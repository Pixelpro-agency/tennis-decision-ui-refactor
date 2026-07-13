const SOFA_LOOKBACK_MAX = 60;

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

function roundN(v, n) {
    if (typeof v !== 'number' || !isFinite(v)) return null;
    const f = Math.pow(10, n);
    return Math.round(v * f) / f;
}


function extractScoreSnapshot(tick) {
    const d = tick?.data || {};
    const score = d.score || {};
    return {
        point: score.point ?? null,
        gamesHome: score.games?.home ?? null,
        gamesAway: score.games?.away ?? null,
        totalSetsHome: score.totalSetsHome ?? null,
        totalSetsAway: score.totalSetsAway ?? null,
        statusType: d.status?.type ?? null,
        statusDescription: d.status?.description ?? null
    };
}

function scoreSnapshotsEqual(a, b) {
    if (!a || !b) return false;
    return (
        a.point === b.point &&
        a.gamesHome === b.gamesHome &&
        a.gamesAway === b.gamesAway &&
        a.totalSetsHome === b.totalSetsHome &&
        a.totalSetsAway === b.totalSetsAway &&
        a.statusType === b.statusType &&
        a.statusDescription === b.statusDescription
    );
}

function diffScoreSnapshots(from, to) {
    const changed = [];
    if (from.point !== to.point) changed.push('point');
    if (from.gamesHome !== to.gamesHome || from.gamesAway !== to.gamesAway) changed.push('games');
    if (from.totalSetsHome !== to.totalSetsHome || from.totalSetsAway !== to.totalSetsAway) changed.push('sets');
    if (from.statusType !== to.statusType || from.statusDescription !== to.statusDescription) changed.push('match_status');
    return changed;
}

function classifyScoreChangeType(changedFields) {
    if (changedFields.includes('sets')) return 'set';
    if (changedFields.includes('games')) return 'game';
    if (changedFields.includes('point')) return 'point';
    if (changedFields.includes('match_status')) return 'match_status';
    return 'unknown';
}


export function computeLatestScoreChange(sofaTicks, now) {
    const empty = {
        available: false,
        timestamp: null,
        ageSec: null,
        seq: null,
        fromScore: null,
        toScore: null,
        changedFields: [],
        scoreType: 'unknown',
        confidence: 'low',
        reasons: ['Sofa timeline missing or empty']
    };

    if (!Array.isArray(sofaTicks) || sofaTicks.length < 2) {
        return empty;
    }

    const ticks = sofaTicks.slice(-SOFA_LOOKBACK_MAX);

    for (let i = ticks.length - 1; i >= 1; i--) {
        const cur = ticks[i];
        const prev = ticks[i - 1];
        if (!cur || !prev) continue;

        const curSnap = extractScoreSnapshot(cur);
        const prevSnap = extractScoreSnapshot(prev);

        if (scoreSnapshotsEqual(curSnap, prevSnap)) continue;

        const changedFields = diffScoreSnapshots(prevSnap, curSnap);
        if (changedFields.length === 0) continue;

        const scoreType = classifyScoreChangeType(changedFields);
        const ts = cur.timestamp || cur.data?.timestamp || null;
        const age = ageSec(ts, now);

        let confidence = 'low';
        if (age !== null && age <= 120) confidence = 'medium';
        if (age !== null && age <= 30) confidence = 'high';

        const reasons = [];
        if (age !== null && age > 120) reasons.push('Score change is older than 120s');

        return {
            available: true,
            timestamp: ts,
            ageSec: age !== null ? Math.round(age) : null,
            seq: cur.data?.seq ?? null,
            fromScore: {
                point: prevSnap.point,
                games: { home: prevSnap.gamesHome, away: prevSnap.gamesAway },
                totalSets: { home: prevSnap.totalSetsHome, away: prevSnap.totalSetsAway },
                statusType: prevSnap.statusType
            },
            toScore: {
                point: curSnap.point,
                games: { home: curSnap.gamesHome, away: curSnap.gamesAway },
                totalSets: { home: curSnap.totalSetsHome, away: curSnap.totalSetsAway },
                statusType: curSnap.statusType
            },
            changedFields,
            scoreType,
            confidence,
            reasons
        };
    }

    return {
        available: false,
        timestamp: null,
        ageSec: null,
        seq: null,
        fromScore: null,
        toScore: null,
        changedFields: [],
        scoreType: 'unknown',
        confidence: 'low',
        reasons: ['No score change detected in lookback window']
    };
}
