import {
    detectScoreMarkerTypes,
    detectServerMarkerTypes
} from './scoreState.js';

export function detectPointMarkers(context) {
    const { pointStr, server, serverName, receiverName, timestamp, seq } = context;

    const scoreMarkers = detectScoreMarkerTypes(pointStr);
    const serverMarkers = server ? detectServerMarkerTypes(pointStr, server) : [];
    const allTypes = [...new Set([...scoreMarkers, ...serverMarkers])];

    if (allTypes.length === 0) return [];

    let playerUnderPressure = null;
    if (allTypes.includes('BREAK_POINT')) {
        playerUnderPressure = serverName || null;
    } else if (allTypes.includes('GAME_POINT')) {
        playerUnderPressure = receiverName || null;
    } else if (allTypes.includes('DEUCE') || allTypes.includes('THIRTY_ALL')) {
        playerUnderPressure = null;
    }

    const evidence = [];
    if (allTypes.includes('BREAK_POINT')) evidence.push('Point score indicates break point');
    if (allTypes.includes('DEUCE')) evidence.push('Point score is 40-40 (deuce)');
    if (allTypes.includes('THIRTY_ALL')) evidence.push('Point score is 30-30');
    if (allTypes.includes('GAME_POINT')) evidence.push('Server has game point');
    if (allTypes.includes('PRESSURE_POINT')) evidence.push('High pressure point detected');

    const confidence = server ? 'medium' : 'low';

    return allTypes.map(type => ({
        type,
        timestamp: timestamp || null,
        seq: seq ?? null,
        player: serverName || null,
        playerUnderPressure,
        confidence,
        evidence: evidence.filter(e => {
            if (type === 'BREAK_POINT') return e.includes('break point') || e.includes('pressure');
            if (type === 'DEUCE') return e.includes('deuce') || e.includes('40-40');
            if (type === 'THIRTY_ALL') return e.includes('30-30');
            if (type === 'GAME_POINT') return e.includes('game point');
            if (type === 'PRESSURE_POINT') return e.includes('pressure') || e.includes('40') || e.includes('30');
            return true;
        })
    }));
}
