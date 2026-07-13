import { extractSofaScoreSnapshot, diffSofaScoreSnapshots, resolveServer } from './snapshot.js';
import { detectPointMarkers } from '../sofaEventMarkers.js';

const RELEVANT_MARKER_TYPES = new Set([
    'BREAK_POINT', 'DEUCE', 'THIRTY_ALL', 'GAME_POINT', 'PRESSURE_POINT'
]);

function extractMarkersFromTick(tick) {
    const d = tick?.data || {};
    const pointStr = d.score?.point ?? null;
    const server = resolveServer(tick);
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

function tickTs(tick) {
    return tick?.timestamp || tick?.data?.timestamp || null;
}

function scoreFromTick(tick) {
    const d = tick?.data || {};
    const score = d.score || {};
    const games = score.games || {};
    return {
        point: score.point ?? null,
        games: { home: games.home ?? null, away: games.away ?? null },
        totalSetsHome: score.totalSetsHome ?? null,
        totalSetsAway: score.totalSetsAway ?? null
    };
}

function isoFromDate(d) {
    return d instanceof Date ? d.toISOString() : null;
}

const DISABLED_GAME_CONTEXT = {
    available: false,
    source: 'disabled',
    pointState: null,
    gameScore: null,
    server: null,
    statusDescription: null
};

export function buildObservationWindow({
    sourceTs,
    windowSec,
    windowTicks,
    baseline,
    hasBaseline,
    now,
    includeCurrentGameContext = true
}) {
    const reasons = [];
    const windowStart = isoFromDate(sourceTs);
    const windowEnd = sourceTs instanceof Date
        ? isoFromDate(new Date(sourceTs.getTime() + windowSec * 1000))
        : null;

    const currentGameContext = includeCurrentGameContext === false
        ? DISABLED_GAME_CONTEXT
        : null;

    if (!hasBaseline) {
        reasons.push('No SofaScore baseline before source market event');
    }

    if (windowTicks.length === 0) {
        return {
            windowSec,
            windowStart,
            windowEnd,
            sofaTicksObserved: 0,
            tickCount: 0,
            firstSofaTickAt: null,
            lastSofaTickAt: null,
            firstScore: null,
            latestScore: null,
            latestPointState: null,
            latestGameScore: null,
            latestSetScore: null,
            latestServer: null,
            baseline: baseline ?? null,
            latestSnapshot: null,
            pointChanged: false,
            gameChanged: false,
            setChanged: false,
            statusChanged: false,
            serverChanged: false,
            scoreChanged: false,
            sofaEventsObserved: [],
            relevantMarkersObserved: [],
            fieldEventObservedAfterFlow: false,
            currentGameContext: includeCurrentGameContext === false
                ? DISABLED_GAME_CONTEXT
                : { available: false, source: 'unavailable', pointState: null, gameScore: null, server: null, statusDescription: null },
            dataQuality: 'poor',
            causalityClaimed: false,
            interpretation: 'temporal_proximity_only',
            reasons: [...reasons, 'No SofaScore ticks found after source market event']
        };
    }

    const firstTick = windowTicks[0];
    const latestTick = windowTicks[windowTicks.length - 1];
    const latestSnapshot = extractSofaScoreSnapshot(latestTick);

    const effectiveBaseline = hasBaseline ? baseline : extractSofaScoreSnapshot(firstTick);

    const diff = diffSofaScoreSnapshots(effectiveBaseline, latestSnapshot);

    const sofaEventsObserved = [];
    const relevantMarkersSet = new Set();

    for (const tick of windowTicks) {
        const markers = extractMarkersFromTick(tick);
        for (const m of markers) {
            relevantMarkersSet.add(m.type);
            const ts = tickTs(tick);
            const d = tick?.data || {};
            sofaEventsObserved.push({
                type: m.type,
                timestamp: ts,
                seq: d.seq ?? null,
                pointState: d.score?.point ?? null,
                gameScore: d.score?.games
                    ? { home: d.score.games.home ?? null, away: d.score.games.away ?? null }
                    : null,
                server: resolveServer(tick),
                playerUnderPressure: m.playerUnderPressure ?? null,
                confidence: m.confidence ?? 'low'
            });
        }
    }

    const relevantMarkersObserved = [...relevantMarkersSet];
    const fieldEventObservedAfterFlow = relevantMarkersObserved.length > 0 || diff.scoreChanged;

    const latestD = latestTick?.data || {};
    const latestScore = scoreFromTick(latestTick);
    const firstScore = scoreFromTick(firstTick);

    const resolvedCurrentGameContext = includeCurrentGameContext === false
        ? DISABLED_GAME_CONTEXT
        : {
            available: true,
            source: 'latest_window_tick',
            pointState: latestD.score?.point ?? null,
            gameScore: latestD.score?.games
                ? { home: latestD.score.games.home ?? null, away: latestD.score.games.away ?? null }
                : null,
            server: resolveServer(latestTick),
            statusDescription: latestD.status?.description ?? null
        };

    let dataQuality;
    if (hasBaseline && windowTicks.length >= 2) {
        dataQuality = 'good';
    } else if (windowTicks.length >= 1) {
        dataQuality = 'medium';
    } else {
        dataQuality = 'poor';
    }

    if (!hasBaseline) {
        reasons.push('Baseline derived from first window tick; pre-event state unknown');
        if (dataQuality === 'good') dataQuality = 'medium';
    }

    return {
        windowSec,
        windowStart,
        windowEnd,
        sofaTicksObserved: windowTicks.length,
        tickCount: windowTicks.length,
        firstSofaTickAt: tickTs(firstTick),
        lastSofaTickAt: tickTs(latestTick),
        firstScore,
        latestScore,
        latestPointState: latestD.score?.point ?? null,
        latestGameScore: latestD.score?.games
            ? { home: latestD.score.games.home ?? null, away: latestD.score.games.away ?? null }
            : null,
        latestSetScore: {
            home: latestD.score?.totalSetsHome ?? null,
            away: latestD.score?.totalSetsAway ?? null
        },
        latestServer: resolveServer(latestTick),
        baseline: effectiveBaseline,
        latestSnapshot,
        ...diff,
        sofaEventsObserved,
        relevantMarkersObserved,
        fieldEventObservedAfterFlow,
        currentGameContext: resolvedCurrentGameContext,
        dataQuality,
        causalityClaimed: false,
        interpretation: 'temporal_proximity_only',
        reasons
    };
}
