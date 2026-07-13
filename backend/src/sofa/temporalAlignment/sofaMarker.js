import { detectPointMarkers } from '../sofaEventMarkers.js';

const SOFA_LOOKBACK_MAX = 60;

const RELEVANT_MARKER_TYPES = new Set([
    'BREAK_POINT', 'DEUCE', 'THIRTY_ALL', 'GAME_POINT', 'PRESSURE_POINT'
]);

function parseTs(ts) {
    if (!ts) return null;
    const d = new Date(ts);
    return isNaN(d.getTime()) ? null : d;
}

function ageSec(ts, now) {
    const d = parseTs(ts);
    if (!d) return null;
    return Math.max(0, (now.getTime() - d.getTime()) / 1000);
}

function markerStateKey(markerType, tick) {
    const d = tick?.data || {};
    const point = d.score?.point ?? '';
    const gh = d.score?.games?.home ?? '';
    const ga = d.score?.games?.away ?? '';
    const server = d.serving ?? '';
    return `${markerType}|${point}|${gh}-${ga}|${server}`;
}

function detectRelevantMarkersFromTick(tick) {
    const d = tick?.data || {};
    const pointStr = d.score?.point ?? null;
    const server = d.serving ?? null;
    const players = d.players || {};
    const serverName = server ? (players[server]?.name || null) : null;
    const receiverSide = server === 'home' ? 'away' : server === 'away' ? 'home' : null;
    const receiverName = receiverSide ? (players[receiverSide]?.name || null) : null;

    const allMarkers = detectPointMarkers({
        pointStr,
        server,
        serverName,
        receiverName,
        timestamp: tick?.timestamp || null,
        seq: d.seq ?? null
    });

    return allMarkers.filter(m => RELEVANT_MARKER_TYPES.has(m.type));
}

function selectBestMarkerType(markerTypes) {
    const priority = ['BREAK_POINT', 'DEUCE', 'THIRTY_ALL', 'GAME_POINT', 'PRESSURE_POINT'];
    for (const p of priority) {
        if (markerTypes.includes(p)) return p;
    }
    return markerTypes[0] || null;
}

export function computeLatestRelevantSofaMarker(sofaTicks, now) {
    const empty = {
        available: false,
        type: null,
        stateFirstSeenAt: null,
        latestSeenAt: null,
        ageSec: null,
        seqFirst: null,
        seqLatest: null,
        pointState: null,
        gameScore: null,
        server: null,
        playerUnderPressure: null,
        confidence: 'low',
        reasons: ['No relevant marker detected in Sofa timeline']
    };

    if (!Array.isArray(sofaTicks) || sofaTicks.length === 0) return empty;

    const ticks = sofaTicks.slice(-SOFA_LOOKBACK_MAX);

    let latestMarkerTick = null;
    let latestMarkers = [];

    for (let i = ticks.length - 1; i >= 0; i--) {
        const tick = ticks[i];
        const markers = detectRelevantMarkersFromTick(tick);
        if (markers.length > 0) {
            latestMarkerTick = tick;
            latestMarkers = markers;
            break;
        }
    }

    if (!latestMarkerTick) return empty;

    const bestType = selectBestMarkerType(latestMarkers.map(m => m.type));
    const latestStateKey = markerStateKey(bestType, latestMarkerTick);

    let firstMarkerTick = latestMarkerTick;
    const latestIdx = ticks.indexOf(latestMarkerTick);

    for (let i = latestIdx - 1; i >= 0; i--) {
        const tick = ticks[i];
        const markers = detectRelevantMarkersFromTick(tick);
        if (markers.length === 0) break;
        const key = markerStateKey(bestType, tick);
        if (key !== latestStateKey) break;
        firstMarkerTick = tick;
    }

    const d = latestMarkerTick.data || {};
    const stateFirstSeenAt = firstMarkerTick.timestamp || firstMarkerTick.data?.timestamp || null;
    const latestSeenAt = latestMarkerTick.timestamp || latestMarkerTick.data?.timestamp || null;

    const age = ageSec(latestSeenAt, now);

    const bestMarker = latestMarkers.find(m => m.type === bestType) || latestMarkers[0];
    const playerUnderPressure = bestMarker?.playerUnderPressure || null;

    const server = d.serving ?? null;
    let confidence = 'low';
    if (age !== null && age <= 120) confidence = 'medium';
    if (age !== null && age <= 30) confidence = 'high';
    if (!server) confidence = 'low';

    const reasons = [];
    if (!server) reasons.push('Server not identified; marker confidence limited');
    if (age !== null && age > 120) reasons.push('Marker older than 120s');

    return {
        available: true,
        type: bestType,
        stateFirstSeenAt,
        latestSeenAt,
        ageSec: age !== null ? Math.round(age) : null,
        seqFirst: firstMarkerTick.data?.seq ?? null,
        seqLatest: latestMarkerTick.data?.seq ?? null,
        pointState: d.score?.point ?? null,
        gameScore: d.score?.games ? { home: d.score.games.home ?? null, away: d.score.games.away ?? null } : null,
        server,
        playerUnderPressure,
        confidence,
        reasons
    };
}
