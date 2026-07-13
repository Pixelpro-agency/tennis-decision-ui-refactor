export function extractPlayers(tick) {
    const d = tick?.data || {};
    const home = d.players?.home?.name || null;
    const away = d.players?.away?.name || null;
    if (!home && !away) return null;
    return { home, away };
}

export function extractServer(tick) {
    const d = tick?.data || {};
    if (d.serving === 'home' || d.serving === 'away') return d.serving;
    if (d.players?.home?.isServing === true) return 'home';
    if (d.players?.away?.isServing === true) return 'away';
    return null;
}

export function extractPointScore(tick) {
    const point = tick?.data?.score?.point;
    if (typeof point !== 'string' || point.trim() === '') return null;
    return point.trim();
}

export function extractGameScore(tick) {
    const games = tick?.data?.score?.games;
    if (!games || typeof games !== 'object') return null;
    const home = typeof games.home === 'number' ? games.home : null;
    const away = typeof games.away === 'number' ? games.away : null;
    if (home === null && away === null) return null;
    return { home: home ?? 0, away: away ?? 0 };
}

export function extractSetScore(tick) {
    const sets = tick?.data?.score?.sets;
    if (!Array.isArray(sets) || sets.length === 0) return null;
    const totalHome = tick?.data?.score?.totalSetsHome ?? null;
    const totalAway = tick?.data?.score?.totalSetsAway ?? null;
    return { sets, totalHome, totalAway };
}


const POINT_RANK = { '0': 0, '15': 1, '30': 2, '40': 3, 'A': 4 };

function parsePointPair(pointStr) {
    if (!pointStr || typeof pointStr !== 'string') return null;
    const parts = pointStr.split('-');
    if (parts.length !== 2) return null;
    const h = parts[0].trim().toUpperCase();
    const a = parts[1].trim().toUpperCase();
    if (POINT_RANK[h] === undefined || POINT_RANK[a] === undefined) return null;
    return { home: h, away: a };
}


export function detectScoreMarkerTypes(pointStr) {
    const p = parsePointPair(pointStr);
    if (!p) return [];

    const markers = [];

    if (p.home === '30' && p.away === '30') {
        markers.push('THIRTY_ALL');
        markers.push('PRESSURE_POINT');
    }

    if (p.home === '40' && p.away === '40') {
        markers.push('DEUCE');
        markers.push('PRESSURE_POINT');
    }

    if (p.home === 'A' || p.away === 'A') {
        markers.push('PRESSURE_POINT');
    }

    return markers;
}

export function detectServerMarkerTypes(pointStr, server) {
    if (!server) return [];
    const p = parsePointPair(pointStr);
    if (!p) return [];

    const markers = [];
    const serverPoint = server === 'home' ? p.home : p.away;
    const receiverPoint = server === 'home' ? p.away : p.home;

    const sRank = POINT_RANK[serverPoint];
    const rRank = POINT_RANK[receiverPoint];

    if (serverPoint === '40' && receiverPoint !== '40' && receiverPoint !== 'A') {
        markers.push('GAME_POINT');
    }
    if (serverPoint === 'A') {
        markers.push('GAME_POINT');
    }

    if (receiverPoint === 'A') {
        markers.push('BREAK_POINT');
        markers.push('PRESSURE_POINT');
    }
    if (receiverPoint === '40' && serverPoint !== '40' && serverPoint !== 'A') {
        markers.push('BREAK_POINT');
        markers.push('PRESSURE_POINT');
    }

    return markers;
}


export function inferGamePhase(pointStr, markerTypes) {
    if (!pointStr) return 'unknown';
    const p = parsePointPair(pointStr);
    if (!p) return 'unknown';

    if (markerTypes.includes('DEUCE')) return 'deuce';
    if (markerTypes.includes('BREAK_POINT')) return 'break_point';
    if (markerTypes.includes('GAME_POINT')) return 'game_point';
    if (markerTypes.includes('THIRTY_ALL')) return 'pressure_game';

    const sRank = POINT_RANK[p.home];
    const aRank = POINT_RANK[p.away];
    const maxRank = Math.max(sRank, aRank);
    if (maxRank >= 3) return 'pressure_game';
    if (maxRank >= 2) return 'mid_game';
    return 'early_game';
}

export function inferSetPhase(tick) {
    const gs = extractGameScore(tick);
    const ss = extractSetScore(tick);
    if (!gs) return 'unknown';

    const { home, away } = gs;
    const total = home + away;
    const pointStr = extractPointScore(tick);
    const p = pointStr ? parsePointPair(pointStr) : null;
    const isTiebreak = p &&
        ((p.home === '0' || POINT_RANK[p.home] !== undefined) &&
         (p.away === '0' || POINT_RANK[p.away] !== undefined)) &&
        home === 6 && away === 6;

    if (home === 6 && away === 6) return 'tiebreak';
    if (total <= 4) return 'early_set';
    if (total <= 8) return 'mid_set';
    return 'late_set';
}
