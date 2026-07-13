import express from 'express';
import { buildLatestMatchEvidence } from '../sofa/matchEvidence.js';
import {
    getLatestSourceIdentityConfirmationState
} from '../sofa/matchEvidence/latestMatchEvidence.js';
import {
    validateManualConfirmation
} from '../sofa/matchEvidence/sourceIdentityConfirmation.js';
import {
    findApplicableSourceIdentityConfirmation,
    revokeSourceIdentityConfirmation,
    upsertSourceIdentityConfirmation
} from '../sofa/matchEvidence/sourceIdentityConfirmationStore.js';
import {
    buildInvalidEvidenceEventIdResponse,
    buildManualConfirmationValidationResponse,
    normalizeEvidenceEventId,
    buildGateManualConfirmationResponse
} from './evidence/evidenceResponses.js';

const router = express.Router();

function getConfirmationState(eventId, res) {
    let state;
    
    try {
        state = getLatestSourceIdentityConfirmationState(eventId);
    } catch (_) {
        res.status(500).json({
            ok: false,
            eventId,
            error: 'Failed to load source identity confirmation state'
        });
        return null;
    }
    
    if (state.missing || !state.sofaFound || !state.betfairFound) {
        res.status(404).json({
            ok: false,
            eventId,
            error: 'No timeline data found for this event',
            reasons: state.reasons || []
        });
        return null;
    }
    
    return state;
    
}

router.get('/:eventId/latest', (req, res) => {
    const eventId = normalizeEvidenceEventId(req.params.eventId);
    
    if (!eventId) {
        const response = buildInvalidEvidenceEventIdResponse();
        
        return res
        .status(response.httpStatus)
        .json(response.body);
    }
    
    let result;
    try {
        result = buildLatestMatchEvidence(eventId);
    } catch (err) {
        return res.status(500).json({
            ok: false,
            eventId,
            error: 'Failed to build match evidence snapshot',
            details: err?.message || String(err)
        });
    }
    
    if (result.missing) {
        return res.status(404).json({
            ok: false,
            eventId,
            error: 'No timeline data found for this event',
            reasons: result.reasons || [],
            integrity: result.integrity
        });
    }

    return res.json({
        ok: true,
        eventId,
        latest: result.evidence,
        sources: result.sources,
        integrity: result.integrity
    });
    
});

router.post('/:eventId/source-identity/confirm', (req, res) => {
    const eventId = normalizeEvidenceEventId(req.params.eventId);
    
    if (!eventId) {
        const response = buildInvalidEvidenceEventIdResponse();
        
        return res
        .status(response.httpStatus)
        .json(response.body);
    }

    // Try gate-specific manual confirmation response first
    const gateResponse = buildGateManualConfirmationResponse(eventId, req.body);
    if (gateResponse) {
        return res
        .status(gateResponse.httpStatus)
        .json(gateResponse.body);
    }
    
    const state = getConfirmationState(eventId, res);
    if (!state) return undefined;
    
    if (state.automaticSourceIdentity?.status !== 'pending') {
        return res.status(409).json({
            ok: false,
            eventId,
            error: 'Automatic source identity cannot be manually confirmed'
        });
    }
    
    const validation = validateManualConfirmation({
        confirmationText: req.body?.confirmationText,
        selectedPairs: req.body?.selectedPairs,
        sourceIdentity: state.automaticSourceIdentity,
        context: state.confirmationContext
    });
    
    if (!validation.ok) {
        const response = buildManualConfirmationValidationResponse(
            eventId,
            validation.code
        );
        
        return res
        .status(response.httpStatus)
        .json(response.body);
    }
    
    const persisted = upsertSourceIdentityConfirmation(validation.record);
    if (!persisted.ok) {
        return res.status(500).json({
            ok: false,
            eventId,
            error: 'Failed to persist source identity confirmation'
        });
    }
    
    return res.status(200).json({
        ok: true,
        eventId,
        confirmed: true
    });
    
});

router.delete('/:eventId/source-identity/confirm', (req, res) => {
    const eventId = normalizeEvidenceEventId(req.params.eventId);
    
    if (!eventId) {
        const response = buildInvalidEvidenceEventIdResponse();
        
        return res
        .status(response.httpStatus)
        .json(response.body);
    }
    
    const state = getConfirmationState(eventId, res);
    if (!state) return undefined;
    
    const lookup = findApplicableSourceIdentityConfirmation(state.confirmationContext);
    if (!lookup.ok) {
        return res.status(500).json({
            ok: false,
            eventId,
            error: 'Failed to read source identity confirmation'
        });
    }
    
    if (!lookup.confirmation) {
        return res.json({
            ok: true,
            eventId,
            revoked: false
        });
    }
    
    const revoked = revokeSourceIdentityConfirmation(lookup.confirmation.fingerprint);
    if (!revoked.ok) {
        return res.status(500).json({
            ok: false,
            eventId,
            error: 'Failed to revoke source identity confirmation'
        });
    }
    
    return res.json({
        ok: true,
        eventId,
        revoked: revoked.revoked === true
    });
    
});

export default router;
