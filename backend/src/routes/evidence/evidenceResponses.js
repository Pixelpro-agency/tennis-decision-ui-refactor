import {
    getSourceIdentityGateStatus as getSourceIdentityGateStatusDefault,
    confirmActiveSourceIdentityGate as confirmActiveSourceIdentityGateDefault
} from '../../sofa/sourceIdentityGate.js';

export function normalizeEvidenceEventId(value) {
    return typeof value === 'string' && value.trim()
    ? value.trim()
    : null;
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
    const httpStatus = validationCode === 'confirmation_context_incomplete'
    ? 422
    : validationCode === 'automatic_identity_not_pending'
    ? 409
    : 400;
    
    return {
        httpStatus,
        body: {
            ok: false,
            eventId,
            error: 'Source identity confirmation is invalid'
        }
    };
    
}

export function buildGateManualConfirmationResponse(eventId, reqBody, dependencies = {}) {
    const getGateStatus = dependencies.getSourceIdentityGateStatus || getSourceIdentityGateStatusDefault;
    const confirmGate = dependencies.confirmActiveSourceIdentityGate || confirmActiveSourceIdentityGateDefault;

    const gateStatus = getGateStatus(eventId);
    if (!gateStatus || !gateStatus.ok) {
        return null; // Fallback to normal behavior when no active gate exists
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
            confirmationText: reqBody?.confirmationText
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

