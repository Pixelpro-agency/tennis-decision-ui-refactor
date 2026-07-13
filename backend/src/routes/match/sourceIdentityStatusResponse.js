import { getSourceIdentityGateStatus } from '../../sofa/sourceIdentityGate.js';

export function buildSourceIdentityStatusResponse(eventId) {
    if (!eventId || !eventId.trim()) {
        return {
            httpStatus: 400,
            body: {
                ok: false,
                error: 'Missing or invalid eventId'
            }
        };
    }

    const gateStatus = getSourceIdentityGateStatus(eventId);
    
    if (!gateStatus || !gateStatus.ok) {
        return {
            httpStatus: 404,
            body: {
                ok: false,
                eventId: eventId.trim(),
                error: 'No active source identity gate session found for this event'
            }
        };
    }

    // Ensure serializable structure without URLs, token, local paths, or mutable references.
    const responseBody = {
        ok: true,
        eventId: gateStatus.eventId,
        active: gateStatus.active,
        phase: gateStatus.phase,
        persistence: gateStatus.persistence,
        sourceIdentity: null,
        updatedAt: gateStatus.updatedAt
    };

    if (gateStatus.error && typeof gateStatus.error === 'string' && gateStatus.error.trim()) {
        responseBody.error = gateStatus.error;
    }

    if (gateStatus.sourceIdentity) {
        responseBody.sourceIdentity = {
            status: gateStatus.sourceIdentity.status,
            sofaPlayers: Array.isArray(gateStatus.sourceIdentity.sofaPlayers) 
                ? [...gateStatus.sourceIdentity.sofaPlayers] 
                : [],
            betfairRunners: Array.isArray(gateStatus.sourceIdentity.betfairRunners) 
                ? [...gateStatus.sourceIdentity.betfairRunners] 
                : [],
            reasons: Array.isArray(gateStatus.sourceIdentity.reasons) 
                ? [...gateStatus.sourceIdentity.reasons] 
                : []
        };
    }

    return {
        httpStatus: 200,
        body: responseBody
    };
}
