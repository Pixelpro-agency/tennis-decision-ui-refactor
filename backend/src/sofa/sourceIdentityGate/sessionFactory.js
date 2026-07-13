export function createGateSession(eventId, options = {}) {
    return {
        eventId,
        hasBetfairUrl: !!options.hasBetfairUrl,
        onOpenRecording: options.onOpenRecording || (() => {}),
        onMismatch: options.onMismatch || (() => {}),
        phase: options.hasBetfairUrl ? 'collecting' : 'not-applicable',
        sofaSample: null,
        sofaPersistenceData: null,
        betfairSample: null,
        betfairKey: null,
        sourceIdentity: null,
        updatedAt: new Date().toISOString(),
        error: null,
        mismatchCalled: false,
        recordingCalled: false,
        bufferGeneration: 0,
        attemptedBootstrapGeneration: null,
        recordingGeneration: null,
        dependencies: options.dependencies || {}
    };
}

export function cloneSourceIdentity(sourceIdentity) {
    if (!sourceIdentity) return null;
    return {
        status: sourceIdentity.status,
        sofaPlayers: Array.isArray(sourceIdentity.sofaPlayers) ? [...sourceIdentity.sofaPlayers] : [],
        betfairRunners: Array.isArray(sourceIdentity.betfairRunners) ? [...sourceIdentity.betfairRunners] : [],
        normalizedSofaPlayers: Array.isArray(sourceIdentity.normalizedSofaPlayers) ? [...sourceIdentity.normalizedSofaPlayers] : [],
        normalizedBetfairRunners: Array.isArray(sourceIdentity.normalizedBetfairRunners) ? [...sourceIdentity.normalizedBetfairRunners] : [],
        normalizedPairs: Array.isArray(sourceIdentity.normalizedPairs)
            ? sourceIdentity.normalizedPairs.map(pair => ({ ...pair }))
            : [],
        reasons: Array.isArray(sourceIdentity.reasons) ? [...sourceIdentity.reasons] : []
    };
}

export function stopGateSession(session) {
    session.phase = 'stopped';
    session.sofaSample = null;
    session.sofaPersistenceData = null;
    session.betfairSample = null;
    session.sourceIdentity = null;
    session.updatedAt = new Date().toISOString();
}

export function clearMismatchSamples(session) {
    session.sofaSample = null;
    session.sofaPersistenceData = null;
    session.betfairSample = null;
}
