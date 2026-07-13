import assert from 'node:assert/strict';
import { buildLayTheWinnerContext } from './context.js';

let passed = 0;
let failed = 0;

function test(name, fn) {
    try {
        fn();
        console.log(`PASS ${name}`);
        passed += 1;
    } catch (error) {
        console.error(`FAIL ${name}`);
        console.error(error.message);
        failed += 1;
    }
}

function buildSnapshot(overrides = {}) {
    return {
        players: {
            home: { name: 'Player A' },
            away: { name: 'Player B' }
        },
        score: {
            sets: [],
            games: null
        },
        stats: {
            set2: [],
            match: []
        },
        serving: null,
        ...overrides
    };
}

test('identifies the completed first-set winner and serving player', () => {
    const result = buildLayTheWinnerContext(
        buildSnapshot({
            score: {
                sets: [{ home: 6, away: 4 }],
                games: { home: 2, away: 1 }
            },
            serving: 'home'
        })
    );

    assert.equal(result.winner1stSet, 'Player A');
    assert.equal(result.winner1stSetAvailable, true);
    assert.equal(result.servingName, 'Player A');
    assert.equal(result.gameScore, '2-1');
    assert.equal(result.currentSet, 1);
});

test('uses break-point data from the snapshot', () => {
    const result = buildLayTheWinnerContext(
        buildSnapshot({
            score: {
                sets: [{ home: 4, away: 3 }, { home: 1, away: 0 }],
                games: { home: 1, away: 0 }
            },
            stats: {
                set2: [{ key: 'breakPointsScored', home: 2, away: 4 }],
                match: []
            }
        })
    );

    assert.equal(result.breakOpportunities, 'Player A: 2 | Player B: 4');
    assert.equal(result.breakOpportunitiesAvailable, true);
});

test('keeps unavailable snapshot context without removed fields', () => {
    const result = buildLayTheWinnerContext(buildSnapshot());

    assert.equal(result.winner1stSetAvailable, false);
    assert.equal(result.breakOpportunitiesAvailable, false);

    const removedFields = [
        'current' + 'Story',
        'current' + 'StoryAvailable',
        'moment' + 'umChecklistLabel',
        'moment' + 'umChecklistOk',
        'moment' + 'umChecklistBadge'
    ];

    for (const field of removedFields) {
        assert.equal(field in result, false, `Removed field present: ${field}`);
    }
});

console.log(`Results: ${passed} passed, ${failed} failed`);

if (failed > 0) {
    process.exit(1);
}
