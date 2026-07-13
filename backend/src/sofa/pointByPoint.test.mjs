import assert from 'node:assert/strict';
import {
    buildRecentCompletedGamesWindow,
    decodeCompletedGame,
    normalizePointByPoint
} from './pointByPoint.js';
import {
    verifiedHomeLeadingPointByPointFixture,
    verifiedPointByPointFixture,
    verifiedUnsupportedTieBreakGame
} from './fixtures/pointByPoint.verified.fixture.mjs';

function homeWinGame(game) {
    return {
        game,
        points: [
            { homePoint: '15', awayPoint: '0' },
            { homePoint: '30', awayPoint: '0' },
            { homePoint: '40', awayPoint: '0' }
        ]
    };
}

{
    const raw = structuredClone(verifiedPointByPointFixture);
    const before = structuredClone(raw);
    const normalized = normalizePointByPoint(raw);

    assert.equal(normalized.available, true);
    assert.deepEqual(normalized.semantics, {
        source: 'home-away-point-transitions',
        representation: 'after-point'
    });
    assert.deepEqual(normalized.sets, verifiedPointByPointFixture);
    assert.deepEqual(raw, before);
}

{
    const normalized = normalizePointByPoint(
        verifiedPointByPointFixture
    );
    const decoded = decodeCompletedGame(normalized.sets[0].games[0]);

    assert.deepEqual(decoded, {
        available: true,
        reason: null,
        homePoints: 4,
        awayPoints: 2,
        totalPoints: 6,
        winners: ['home', 'home', 'away', 'home', 'away', 'home']
    });
}

{
    const normalized = normalizePointByPoint(
        verifiedHomeLeadingPointByPointFixture
    );
    const decoded = decodeCompletedGame(normalized.sets[0].games[1]);

    assert.equal(decoded.available, true);
    assert.equal(decoded.homePoints, 7);
    assert.equal(decoded.awayPoints, 9);
    assert.equal(decoded.totalPoints, 16);
    assert.deepEqual(decoded.winners, [
        'home', 'away', 'away', 'home',
        'away', 'home', 'home', 'away',
        'home', 'away', 'away', 'home',
        'home', 'away', 'away', 'away'
    ]);
}

{
    const decoded = decodeCompletedGame(verifiedUnsupportedTieBreakGame);

    assert.equal(decoded.available, false);
    assert.equal(
        decoded.reason,
        'unsupported_or_ambiguous_score_transition'
    );
    assert.equal(decoded.totalPoints, null);
    assert.deepEqual(decoded.winners, []);
}

{
    const decoded = decodeCompletedGame({
        game: 1,
        points: [
            { homePoint: '15', awayPoint: '0' },
            { homePoint: '40', awayPoint: '0' }
        ]
    });

    assert.equal(decoded.available, false);
    assert.equal(
        decoded.reason,
        'unsupported_or_ambiguous_score_transition'
    );
}

{
    const normalized = normalizePointByPoint(
        verifiedPointByPointFixture
    );
    const before = structuredClone(normalized);
    const window = buildRecentCompletedGamesWindow(normalized);

    assert.deepEqual(window, {
        available: true,
        reason: null,
        kind: 'completed-games',
        requestedGames: 3,
        includedGames: 3,
        excludedCurrentGame: true,
        games: [
            { set: 2, game: 7 },
            { set: 2, game: 8 },
            { set: 2, game: 9 }
        ],
        homePoints: 5,
        awayPoints: 10,
        totalPoints: 15,
        homePct: 33.3,
        awayPct: 66.7,
        leadingSide: 'away'
    });
    assert.deepEqual(normalized, before);
}

{
    const raw = structuredClone(verifiedPointByPointFixture);
    raw[0].games[1].points = [
        { homePoint: '40', awayPoint: '40' }
    ];

    const window = buildRecentCompletedGamesWindow(
        normalizePointByPoint(raw)
    );

    assert.equal(window.available, false);
    assert.equal(
        window.reason,
        'insufficient_verified_completed_games'
    );
    assert.equal(window.includedGames, 0);
    assert.deepEqual(window.games, []);
}

{
    const raw = structuredClone(verifiedPointByPointFixture);
    raw[0].games = raw[0].games.slice(0, 3);

    const window = buildRecentCompletedGamesWindow(
        normalizePointByPoint(raw)
    );

    assert.equal(window.available, false);
    assert.equal(
        window.reason,
        'insufficient_verified_completed_games'
    );
}

{
    const raw = [
        {
            set: 2,
            games: [
                homeWinGame(4),
                homeWinGame(1),
                homeWinGame(2),
                homeWinGame(3)
            ]
        },
        {
            set: 1,
            games: [
                homeWinGame(99)
            ]
        }
    ];

    const window = buildRecentCompletedGamesWindow(
        normalizePointByPoint(raw)
    );

    assert.deepEqual(window.games, [
        { set: 2, game: 1 },
        { set: 2, game: 2 },
        { set: 2, game: 3 }
    ]);
    assert.equal(window.homePoints, 12);
    assert.equal(window.awayPoints, 0);
    assert.equal(window.totalPoints, 12);
    assert.equal(window.homePct, 100);
    assert.equal(window.awayPct, 0);
    assert.equal(window.leadingSide, 'home');
}

{
    const invalid = normalizePointByPoint([
        {
            set: 1,
            games: [
                {
                    game: 1,
                    points: []
                }
            ]
        }
    ]);

    assert.deepEqual(invalid, {
        available: false,
        reason: 'point_by_point_unavailable',
        semantics: null,
        sets: []
    });
}

console.log('pointByPoint: OK');
