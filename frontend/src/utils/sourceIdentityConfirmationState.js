export const MANUAL_CONFIRMATION_APPLIED_REASON =
'Manual confirmation applied for current SofaScore/Betfair epoch';

function normalizeIdentityList(value) {
    return Array.isArray(value) ? value : [];
}

export function getIdentityStateKey(eventId, sourceIdentity) {
    if (!sourceIdentity) return String(eventId || '');
    
    const stateParts = [
        eventId || '',
        sourceIdentity.status || ''
    ].concat(
        normalizeIdentityList(sourceIdentity.sofaPlayers),
        normalizeIdentityList(sourceIdentity.betfairRunners),
        normalizeIdentityList(sourceIdentity.reasons)
    );
    
    return stateParts.join('\u001f');
}

export function getSourceIdentityConfirmationState(eventId, sourceIdentity) {
    const sofaPlayers = normalizeIdentityList(sourceIdentity?.sofaPlayers);
    const betfairRunners = normalizeIdentityList(sourceIdentity?.betfairRunners);
    
    const canConfirmIdentity = Boolean(eventId) &&
    sourceIdentity?.status === 'pending' &&
    sofaPlayers.length === 2 &&
    betfairRunners.length === 2;
    
    const pendingIdentityIncomplete =
    sourceIdentity?.status === 'pending' && !canConfirmIdentity;
    
    const manualConfirmationApplied =
    sourceIdentity?.status !== 'mismatch' &&
    normalizeIdentityList(sourceIdentity?.reasons)
    .includes(MANUAL_CONFIRMATION_APPLIED_REASON);
    
    return {
        sofaPlayers,
        betfairRunners,
        canConfirmIdentity,
        pendingIdentityIncomplete,
        manualConfirmationApplied,
        identityStateKey: getIdentityStateKey(eventId, sourceIdentity)
    };
}