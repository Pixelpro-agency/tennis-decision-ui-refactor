import assert from 'node:assert/strict';
import { buildTargetContext } from './targetContext.js';

let passed = 0;
let failed = 0;

function test(name, fn) {
    try {
        fn();
        console.log(`PASS ${name}`);
        passed += 1;
    }
    catch (error) {
        console.error(`FAIL ${name}`);
        console.error(error.message);
        failed += 1;
    }
}

function runner(name, selectionId, price) {
    return {
        name,
        selectionId,
        lastTradedPrice: price,
        bestBack: null,
        bestLay: null,
        ladder: null,
        moneyFlow: null
    };
}

test('first-set winner uses an earlier usable price tick', () => {
    const firstTickEntry = {
        data: {
            seq: 1,
            runners: [
                runner('Player A', 11, 2.2),
                runner('Player B', 22, 1.8)
            ]
        }
    };

    const lastTickEntry = {
        data: {
            seq: 2,
            runners: [
                runner('Player A', 11, null),
                runner('Player B', 22, 1.8)
            ]
        }
    };

    const result = buildTargetContext({
        snapshot: {
            players: {
                home: { name: 'Player A' },
                away: { name: 'Player B' }
            },
            score: {
                sets: [{ home: 6, away: 4 }]
            }
        },
        firstTickEntry,
        lastTickEntry,
        window: [firstTickEntry, lastTickEntry],
        validTicks: [firstTickEntry, lastTickEntry]
    });

    assert.equal(result.available, true);
    assert.equal(result.targetRole, 'FIRST_SET_WINNER');
    assert.equal(result.targetSofaName, 'Player A');
    assert.equal(result.priceRunner.selectionId, 11);
    assert.equal(result.usingStalePrice, true);
});

test('market favourite is used when no first-set winner exists', () => {
    const firstTickEntry = {
        data: {
            seq: 1,
            runners: [
                runner('Market Favourite', 11, 1.5),
                runner('Other Runner', 22, 2.6)
            ]
        }
    };

    const lastTickEntry = {
        data: {
            seq: 2,
            runners: [
                runner('Market Favourite', 11, 1.4),
                runner('Other Runner', 22, 2.8)
            ]
        }
    };

    const result = buildTargetContext({
        snapshot: {
            players: {
                home: { name: 'Player A' },
                away: { name: 'Player B' }
            },
            score: {
                sets: [{ home: 4, away: 3 }]
            }
        },
        firstTickEntry,
        lastTickEntry,
        window: [firstTickEntry, lastTickEntry],
        validTicks: [firstTickEntry, lastTickEntry]
    });

    assert.equal(result.available, true);
    assert.equal(result.targetRole, 'MARKET_FAVOURITE_FALLBACK');
    assert.equal(result.targetSofaName, 'Market Favourite');
});

test('unmatched first-set winner keeps the unavailable reason', () => {
    const firstTickEntry = {
        data: {
            seq: 1,
            runners: [
                runner('Player A', 11, 2.2),
                runner('Player B', 22, 1.8)
            ]
        }
    };

    const lastTickEntry = {
        data: {
            seq: 2,
            runners: [
                runner('Different A', 33, 2.2),
                runner('Different B', 44, 1.8)
            ]
        }
    };

    const result = buildTargetContext({
        snapshot: {
            players: {
                home: { name: 'Player A' },
                away: { name: 'Player B' }
            },
            score: {
                sets: [{ home: 6, away: 3 }]
            }
        },
        firstTickEntry,
        lastTickEntry,
        window: [firstTickEntry, lastTickEntry],
        validTicks: [firstTickEntry, lastTickEntry]
    });

    assert.equal(result.available, false);
    assert.equal(result.reason, 'RUNNER_MATCH_NOT_FOUND');
    assert.equal(result.latestTickSeq, 2);
});

console.log(`Results: ${passed} passed, ${failed} failed`);

if (failed > 0) {
    process.exit(1);
}
