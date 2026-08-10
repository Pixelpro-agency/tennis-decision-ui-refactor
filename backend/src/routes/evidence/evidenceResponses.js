import {
    getSourceIdentityGateStatus as getSourceIdentityGateStatusDefault,
    confirmActiveSourceIdentityGate as confirmActiveSourceIdentityGateDefault
} from '../../sofa/sourceIdentityGate.js';
import { normalizeEventId } from '../../utils/eventId.js';

export function normalizeEvidenceEventId(value) {
    return normalizeEventId(value);
}

export function buildInvalidEvidenceEventIdResponse() {
    return {
        httpStatus: 400,
        body: {
            ok: false,
            error: 'Missing or invalid eventId'
        }
    };
}

export function buildManualConfirmationValidationResponse(
    eventId,
    validationCode
) {
    const mappings = {
        confirmation_text_invalid: [400, 'confirmation_text_invalid'],
        selected_pairs_invalid: [400, 'selected_pairs_invalid'],
        confirmation_context_incomplete: [422, 'confirmation_context_incomplete'],
        automatic_identity_not_pending: [409, 'automatic_identity_not_pending'],
        invalid_phase: [409, 'confirmation_phase_invalid'],
        session_not_found: [409, 'confirmation_session_changed'],
        stale_session: [409, 'confirmation_session_changed'],
        persistence_failed: [500, 'confirmation_persistence_failed'],
        bootstrap_persistence_failed: [500, 'confirmation_bootstrap_failed'],
        bootstrap_rollback_failed: [500, 'confirmation_rollback_failed']
    };
    const [httpStatus, code] = mappings[validationCode] || [400, 'confirmation_invalid'];
    
    return {
        httpStatus,
        body: {
            ok: false,
            eventId,
            code,
            error: 'Source identity confirmation is invalid'
        }
    };
    
}

export function buildGateManualConfirmationResponse(eventId, reqBody, dependencies = {}) {
    const getGateStatus = dependencies.getSourceIdentityGateStatus || getSourceIdentityGateStatusDefault;
    const confirmGate = dependencies.confirmActiveSourceIdentityGate || confirmActiveSourceIdentityGateDefault;

    const gateStatus = getGateStatus(eventId);
    if (!gateStatus || !gateStatus.ok) {
        return buildManualConfirmationValidationResponse(eventId, 'session_not_found');
    }

    if (gateStatus.phase === 'collecting') {
        return buildManualConfirmationValidationResponse(eventId, 'confirmation_context_incomplete');
    }

    if (gateStatus.phase === 'mismatch' || gateStatus.phase === 'recording') {
        return buildManualConfirmationValidationResponse(eventId, 'automatic_identity_not_pending');
    }

    if (gateStatus.phase === 'pending') {
        const confirmResult = confirmGate(eventId, {
            selectedPairs: reqBody?.selectedPairs,
            confirmationText: reqBody?.confirmationText,
            trackingSessionId: reqBody?.trackingSessionId
        });

        if (!confirmResult.ok) {
            return buildManualConfirmationValidationResponse(eventId, confirmResult.code);
        }

        return {
            httpStatus: 200,
            body: {
                ok: true,
                eventId,
                confirmed: true,
                phase: confirmResult.phase,
                sourceIdentity: confirmResult.sourceIdentity
            }
        };
    }

    return buildManualConfirmationValidationResponse(eventId, 'invalid_phase');
}

