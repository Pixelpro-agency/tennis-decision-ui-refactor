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
    sourceIdentityGateStatus,
    sofaReadStatus
}) {
    if (backendData && sofaReadStatus === 'current') {
        return 'connected';
    }

    if (sofaReadStatus === 'degraded') return 'degraded';

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
    sofaReadStatus,
    sourceIdentityGateStatus,
    betfairData,
    betfairReadStatus,
    betfairLastUpdate,
    betfairHealth,
    betfairHealthTransition,
    betfairAudioAlertEnabled,
    onToggleBetfairAudioAlert
} = {}) {
    const sofaStatus = resolveSofaStatus({
        backendData,
        sofaServerStatus,
        sourceIdentityGateStatus,
        sofaReadStatus
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
            status: betfairReadStatus === 'current'
                ? 'connected'
                : betfairReadStatus || 'disconnected',
            ok: Boolean(betfairData) && betfairReadStatus === 'current',
            lastUpdate: betfairLastUpdate,
            health: betfairHealth,
            transition: betfairHealthTransition,
            audioAlertEnabled: betfairAudioAlertEnabled,
            onToggleAudioAlert: onToggleBetfairAudioAlert
        }
    };
}
