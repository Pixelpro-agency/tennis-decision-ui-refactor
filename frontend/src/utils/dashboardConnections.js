function isSourceIdentityBuffering(sourceIdentityGateStatus) {
    const phase = sourceIdentityGateStatus?.phase;

    return (
        (phase === 'collecting' || phase === 'pending') &&
        sourceIdentityGateStatus?.persistence === 'buffering'
    );
}

function resolveSofaStatus({
    backendData,
    sofaServerStatus,
    sourceIdentityGateStatus
}) {
    if (backendData) {
        return 'connected';
    }

    if (sofaServerStatus === 'waiting') {
        return 'waiting';
    }

    if (isSourceIdentityBuffering(sourceIdentityGateStatus)) {
        return 'waiting';
    }

    return 'disconnected';
}

export function buildDashboardConnections({
    backendData,
    sofaLastUpdate,
    sofaServerStatus,
    sourceIdentityGateStatus,
    betfairData,
    betfairLastUpdate,
    betfairHealth,
    betfairHealthTransition,
    betfairAudioAlertEnabled,
    onToggleBetfairAudioAlert
} = {}) {
    const sofaStatus = resolveSofaStatus({
        backendData,
        sofaServerStatus,
        sourceIdentityGateStatus
    });

    return {
        sofa: {
            status: sofaStatus,
            ok: sofaStatus === 'connected',
            lastUpdate: sofaLastUpdate
        },
        modelTot: {
            ok: false
        },
        betfair: {
            ok: Boolean(betfairData),
            lastUpdate: betfairLastUpdate,
            health: betfairHealth,
            transition: betfairHealthTransition,
            audioAlertEnabled: betfairAudioAlertEnabled,
            onToggleAudioAlert: onToggleBetfairAudioAlert
        }
    };
}
