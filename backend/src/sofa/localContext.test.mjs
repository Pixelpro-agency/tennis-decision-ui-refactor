import assert from 'node:assert/strict';
import { buildLocalContext } from './localContext.js';
import { normalizePointByPoint } from './pointByPoint.js';
import {
    verifiedHomeLeadingPointByPointFixture,
    verifiedPointByPointFixture
} from './fixtures/pointByPoint.verified.fixture.mjs';

function pointsTotal(homeValue, awayValue) {
    return {
        period: 'ALL',
        key: 'pointsTotal',
        homeValue,
        awayValue
    };
}

function createSnapshot(
    homeValue,
    awayValue,
    pointByPoint = normalizePointByPoint(verifiedPointByPointFixture)
) {
    return {
        stats: {
            match: [pointsTotal(homeValue, awayValue)]
        },
        pointByPoint
    };
}

{
    const snapshot = createSnapshot(
        38,
        52,
        normalizePointByPoint(verifiedHomeLeadingPointByPointFixture)
    );
    const before = structuredClone(snapshot);
    const context = buildLocalContext(snapshot);

    assert.equal(context.available, true);
    assert.deepEqual(context.match.pointShare, {
        available: true,
        basis: 'statistics.ALL.pointsTotal',
        homePoints: 38,
        awayPoints: 52,
        totalPoints: 90,
        homePct: 42.2,
        awayPct: 57.8,
        leadingSide: 'away'
    });

    assert.deepEqual(context.recent, {
        available: true,
        reason: null,
        window: {
            kind: 'completed-games',
            requestedGames: 3,
            includedGames: 3,
            excludedCurrentGame: true,
            games: [
                { set: 3, game: 6 },
                { set: 3, game: 7 },
                { set: 3, game: 8 }
            ]
        },
        pointShare: {
            available: true,
            homePoints: 15,
            awayPoints: 13,
            totalPoints: 28,
            homePct: 53.6,
            awayPct: 46.4,
            leadingSide: 'home'
        }
    });

    assert.deepEqual(context.comparison, {
        available: true,
        reason: null,
        homeDeltaPctPoints: 11.4,
        awayDeltaPctPoints: -11.4,
        observedShift: true
    });

    assert.deepEqual(context.dataQuality, {
        level: 'complete',
        sources: {
            statistics: true,
            pointByPoint: true
        },
        reasons: []
    });

    assert.deepEqual(snapshot, before);
}

{
    const context = buildLocalContext(createSnapshot(50, 50));

    assert.equal(context.match.pointShare.leadingSide, 'level');
    assert.equal(context.recent.pointShare.leadingSide, 'away');
    assert.equal(context.comparison.available, true);
    assert.equal(context.comparison.observedShift, false);
}

{
    const context = buildLocalContext(createSnapshot(
        38,
        52,
        {
            available: false,
            reason: 'point_by_point_unavailable',
            semantics: null,
            sets: []
        }
    ));

    assert.deepEqual(context.recent, {
        available: false,
        reason: 'point_by_point_unavailable',
        window: null,
        pointShare: null
    });

    assert.deepEqual(context.comparison, {
        available: false,
        reason: 'recent_window_unavailable',
        homeDeltaPctPoints: null,
        awayDeltaPctPoints: null,
        observedShift: null
    });

    assert.deepEqual(context.dataQuality, {
        level: 'partial',
        sources: {
            statistics: true,
            pointByPoint: false
        },
        reasons: ['point_by_point_unavailable']
    });
}

{
    const context = buildLocalContext({
        stats: {
            match: [pointsTotal(0, 0)]
        },
        pointByPoint: normalizePointByPoint(verifiedPointByPointFixture)
    });

    assert.equal(context.available, false);
    assert.equal(context.match.pointShare.reason, 'points_total_unavailable');
    assert.equal(context.match.pointShare.homePct, null);
    assert.equal(context.match.pointShare.awayPct, null);
    assert.equal(context.match.pointShare.leadingSide, null);
    assert.equal(context.comparison.available, false);
}

console.log('localContext: OK');
