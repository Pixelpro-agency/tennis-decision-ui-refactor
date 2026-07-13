const PRESSURE_WINDOW_MAX_AGE_SEC = 90;

function emptyPressureBlock(player = null) {
    return {
        active: false,
        player,
        severity: 'low',
        confidence: 'low',
        evidence: []
    };
}

function buildServicePressure(markerTypes, serverName, evidence) {
    if (!markerTypes.includes('BREAK_POINT')) return emptyPressureBlock(serverName);
    const sev = markerTypes.filter(m => m === 'BREAK_POINT').length > 1 ? 'high' : 'medium';
    return {
        active: true,
        player: serverName,
        severity: sev,
        confidence: serverName ? 'medium' : 'low',
        evidence
    };
}

function buildReturnPressure(markerTypes, receiverName) {
    if (!markerTypes.includes('BREAK_POINT')) return emptyPressureBlock(receiverName);
    return {
        active: true,
        player: receiverName,
        severity: 'medium',
        confidence: receiverName ? 'medium' : 'low',
        evidence: ['Receiver has break point']
    };
}

function buildPressureBlock(markerTypes, playerUnderPressure, serverName, receiverName, evidence) {
    const hasPressure =
        markerTypes.includes('BREAK_POINT') ||
        markerTypes.includes('DEUCE') ||
        markerTypes.includes('THIRTY_ALL') ||
        markerTypes.includes('PRESSURE_POINT');

    if (!hasPressure) return null;

    let type = 'generic_pressure';
    let severity = 'low';
    if (markerTypes.includes('BREAK_POINT')) {
        type = 'service_pressure';
        severity = 'medium';
    } else if (markerTypes.includes('DEUCE')) {
        type = 'deuce_pressure';
        severity = 'medium';
    } else if (markerTypes.includes('THIRTY_ALL')) {
        type = 'service_pressure';
        severity = 'low';
    }

    return {
        active: true,
        playerUnderPressure,
        type,
        severity,
        confidence: playerUnderPressure ? 'medium' : 'low',
        evidence
    };
}


function parseTs(ts) {
    if (!ts) return null;
    const d = new Date(ts);
    return isNaN(d.getTime()) ? null : d;
}

function buildPressureWindow(markedTicks, now) {
    const nowMs = now.getTime();
    const recent = markedTicks.filter(t => {
        const d = parseTs(t.timestamp);
        if (!d) return false;
        return (nowMs - d.getTime()) / 1000 <= PRESSURE_WINDOW_MAX_AGE_SEC;
    });

    if (recent.length === 0) {
        return {
            active: false,
            type: null,
            playerUnderPressure: null,
            startedAt: null,
            durationSec: 0,
            severity: 'low',
            confidence: 'low',
            evidence: []
        };
    }

    const allMarkers = recent.flatMap(t => t.markerTypes || []);
    const breakPoints = allMarkers.filter(m => m === 'BREAK_POINT').length;
    const deuces = allMarkers.filter(m => m === 'DEUCE').length;
    const thirtyAlls = allMarkers.filter(m => m === 'THIRTY_ALL').length;

    let severity = 'low';
    if (breakPoints >= 2) severity = 'high';
    else if (breakPoints >= 1 || deuces >= 1) severity = 'medium';

    const lastWithPlayer = [...recent].reverse().find(t => t.playerUnderPressure);
    const playerUnderPressure = lastWithPlayer?.playerUnderPressure || null;

    let type = 'service_pressure';
    if (breakPoints === 0 && deuces > 0) type = 'deuce_pressure';
    else if (breakPoints === 0 && thirtyAlls > 0) type = 'generic_pressure';

    const startedAt = recent[0].timestamp || null;
    const lastTs = recent[recent.length - 1].timestamp || null;
    const startD = parseTs(startedAt);
    const lastD = parseTs(lastTs);
    const durationSec = (startD && lastD)
        ? Math.max(0, Math.round((lastD.getTime() - startD.getTime()) / 1000))
        : 0;

    const evidence = [];
    if (breakPoints > 0) evidence.push(`${breakPoints} BREAK_POINT marker(s) in recent Sofa ticks`);
    if (deuces > 0) evidence.push(`${deuces} DEUCE marker(s) in recent Sofa ticks`);
    if (thirtyAlls > 0) evidence.push(`${thirtyAlls} THIRTY_ALL marker(s) in recent Sofa ticks`);

    return {
        active: true,
        type,
        playerUnderPressure,
        startedAt,
        durationSec,
        severity,
        confidence: playerUnderPressure ? 'medium' : 'low',
        evidence
    };
}

export {
    buildServicePressure,
    buildReturnPressure,
    buildPressureBlock,
    buildPressureWindow
};
