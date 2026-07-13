import { buildRecentCompletedGamesWindow } from './pointByPoint.js';

const POINT_SHARE_BASIS = 'statistics.ALL.pointsTotal';

function createUnavailableMatchPointShare() {
    return {
        available: false,
        basis: POINT_SHARE_BASIS,
        homePoints: null,
        awayPoints: null,
        totalPoints: null,
        homePct: null,
        awayPct: null,
        leadingSide: null,
        reason: 'points_total_unavailable'
    };
}

function createUnavailableRecent(reason) {
    return {
        available: false,
        reason,
        window: null,
        pointShare: null
    };
}

function createUnavailableComparison(reason) {
    return {
        available: false,
        reason,
        homeDeltaPctPoints: null,
        awayDeltaPctPoints: null,
        observedShift: null
    };
}

function parseNonNegativeFiniteNumber(input) {
    if (typeof input === 'number') {
        return Number.isFinite(input) && input >= 0 ? input : null;
    }

    if (typeof input === 'string') {
        const trimmed = input.trim();

        if (!trimmed) return null;

        const parsed = Number(trimmed);

        return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
    }

    return null;
}

function findPointsTotal(snapshot) {
    const matchStats = Array.isArray(snapshot?.stats?.match)
        ? snapshot.stats.match
        : [];

    return matchStats.find(stat =>
        stat?.period === 'ALL' &&
        stat?.key === 'pointsTotal'
    ) || null;
}

function roundToOneDecimal(number) {
    return Math.round(number * 10) / 10;
}

function buildMatchPointShare(snapshot) {
    const pointsTotal = findPointsTotal(snapshot);
    const homePoints = parseNonNegativeFiniteNumber(pointsTotal?.homeValue);
    const awayPoints = parseNonNegativeFiniteNumber(pointsTotal?.awayValue);

    if (homePoints === null || awayPoints === null) {
        return createUnavailableMatchPointShare();
    }

    const totalPoints = homePoints + awayPoints;

    if (!(totalPoints > 0)) {
        return createUnavailableMatchPointShare();
    }

    const homePct = roundToOneDecimal((homePoints / totalPoints) * 100);
    const awayPct = Number((100 - homePct).toFixed(1));

    return {
        available: true,
        basis: POINT_SHARE_BASIS,
        homePoints,
        awayPoints,
        totalPoints,
        homePct,
        awayPct,
        leadingSide: homePoints > awayPoints
            ? 'home'
            : awayPoints > homePoints
                ? 'away'
                : 'level'
    };
}

function buildRecentContext(snapshot) {
    const recentWindow = buildRecentCompletedGamesWindow(
        snapshot?.pointByPoint
    );

    if (!recentWindow.available) {
        const reason = snapshot?.pointByPoint?.available === false &&
            snapshot.pointByPoint.reason
            ? snapshot.pointByPoint.reason
            : recentWindow.reason;

        return createUnavailableRecent(reason);
    }

    return {
        available: true,
        reason: null,
        window: {
            kind: recentWindow.kind,
            requestedGames: recentWindow.requestedGames,
            includedGames: recentWindow.includedGames,
            excludedCurrentGame: recentWindow.excludedCurrentGame,
            games: recentWindow.games.map(game => ({
                set: game.set,
                game: game.game
            }))
        },
        pointShare: {
            available: true,
            homePoints: recentWindow.homePoints,
            awayPoints: recentWindow.awayPoints,
            totalPoints: recentWindow.totalPoints,
            homePct: recentWindow.homePct,
            awayPct: recentWindow.awayPct,
            leadingSide: recentWindow.leadingSide
        }
    };
}

function buildComparisonContext(matchPointShare, recent) {
    if (!matchPointShare.available) {
        return createUnavailableComparison('points_total_unavailable');
    }

    if (!recent.available || !recent.pointShare) {
        return createUnavailableComparison('recent_window_unavailable');
    }

    const homeDeltaPctPoints = roundToOneDecimal(
        recent.pointShare.homePct - matchPointShare.homePct
    );
    const awayDeltaPctPoints = roundToOneDecimal(
        recent.pointShare.awayPct - matchPointShare.awayPct
    );

    const matchLeader = matchPointShare.leadingSide;
    const recentLeader = recent.pointShare.leadingSide;
    const observedShift = (
        (matchLeader === 'home' || matchLeader === 'away') &&
        (recentLeader === 'home' || recentLeader === 'away') &&
        matchLeader !== recentLeader
    );

    return {
        available: true,
        reason: null,
        homeDeltaPctPoints,
        awayDeltaPctPoints,
        observedShift
    };
}

function buildDataQuality(matchPointShare, recent) {
    if (matchPointShare.available && recent.available) {
        return {
            level: 'complete',
            sources: {
                statistics: true,
                pointByPoint: true
            },
            reasons: []
        };
    }

    if (matchPointShare.available) {
        return {
            level: 'partial',
            sources: {
                statistics: true,
                pointByPoint: false
            },
            reasons: [recent.reason || 'recent_window_not_calculated']
        };
    }

    const reasons = ['points_total_unavailable'];

    if (!recent.available && recent.reason) {
        reasons.push(recent.reason);
    }

    return {
        level: 'insufficient',
        sources: {
            statistics: false,
            pointByPoint: recent.available
        },
        reasons
    };
}

export function buildLocalContext(snapshot) {
    const matchPointShare = buildMatchPointShare(snapshot);
    const recent = buildRecentContext(snapshot);
    const comparison = buildComparisonContext(matchPointShare, recent);

    return {
        version: 1,
        source: 'project-calculated',
        purpose: 'descriptive-match-context',
        available: matchPointShare.available,
        match: {
            pointShare: matchPointShare
        },
        recent,
        comparison,
        dataQuality: buildDataQuality(matchPointShare, recent)
    };
}
