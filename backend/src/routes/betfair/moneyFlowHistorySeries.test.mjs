import assert from 'node:assert/strict';
import { buildMoneyFlowHistorySeries } from './moneyFlowHistorySeries.js';

function makeTick({
    timestamp,
    seq,
    marketTotal = 1000,
    runners
}) {
    return {
        timestamp,
        data: {
            source: 'betfair',
            seq,
            market: { totalMatched: marketTotal },
            graphHealth: { status: 'ok' },
            runners
        }
    };
}

function makeRunner({
    selectionId,
    name,
    matchedTotal,
    runnerDelta,
    marketDelta,
    ladderSource = 'graph_url',
    ladderTradedDelta
}) {
    const moneyFlow = {
        back: 999,
        lay: 777,
        trend: 'backing',
        confidence: 'confirmed'
    };

    if (runnerDelta !== undefined) {
        moneyFlow.runnerDelta = runnerDelta;
    }

    if (marketDelta !== undefined) {
        moneyFlow.marketDelta = marketDelta;
    }

    if (ladderTradedDelta !== undefined) {
        moneyFlow.ladderTradedDelta = ladderTradedDelta;
    }

    return {
        selectionId,
        name,
        matchedTotal,
        totalMatchedOnSelection: matchedTotal,
        ladderSource,
        moneyFlow
    };
}

const renamed = buildMoneyFlowHistorySeries([
    makeTick({
        timestamp: '2026-06-24T10:00:00.000Z',
        seq: 1,
        runners: [makeRunner({
            selectionId: 11,
            name: 'Player A',
            matchedTotal: 100
        })]
    }),
    makeTick({
        timestamp: '2026-06-24T10:00:05.000Z',
        seq: 2,
        marketTotal: 1020,
        runners: [makeRunner({
            selectionId: '11',
            name: 'Player A Renamed',
            matchedTotal: 120,
            runnerDelta: 20,
            marketDelta: 20
        })]
    })
]);

assert.equal(renamed.series.length, 1);
assert.equal(renamed.series[0].selectionId, '11');
assert.equal(renamed.series[0].name, 'Player A Renamed');
assert.equal(renamed.series[0].points.length, 2);
assert.equal(renamed.series[0].points[1].runnerMatchedDelta, 20);
assert.equal(renamed.series[0].points[1].matchedVolume, 20);
assert.equal(renamed.series[0].points[1].timestamp, '2026-06-24T10:00:05.000Z');

const sameNameDifferentIds = buildMoneyFlowHistorySeries([
    makeTick({
        timestamp: '2026-06-24T11:00:00.000Z',
        seq: 1,
        runners: [makeRunner({
            selectionId: 11,
            name: 'Same Name',
            matchedTotal: 100
        })]
    }),
    makeTick({
        timestamp: '2026-06-24T11:00:05.000Z',
        seq: 2,
        runners: [makeRunner({
            selectionId: 22,
            name: 'Same Name',
            matchedTotal: 200
        })]
    })
]);

assert.equal(sameNameDifferentIds.series.length, 2);
assert.deepEqual(
    sameNameDifferentIds.series.map(item => item.selectionId).sort(),
    ['11', '22']
);

const withoutId = buildMoneyFlowHistorySeries([
    makeTick({
        timestamp: '2026-06-24T12:00:00.000Z',
        seq: 1,
        runners: [makeRunner({
            selectionId: null,
            name: 'No Id',
            matchedTotal: 100
        })]
    })
]);

assert.deepEqual(withoutId, { series: [] });

const changedIdPreviousSameName = buildMoneyFlowHistorySeries([
    makeTick({
        timestamp: '2026-06-24T13:00:00.000Z',
        seq: 1,
        runners: [makeRunner({
            selectionId: 11,
            name: 'Shared Name',
            matchedTotal: 100
        })]
    }),
    makeTick({
        timestamp: '2026-06-24T13:00:05.000Z',
        seq: 2,
        runners: [makeRunner({
            selectionId: 22,
            name: 'Shared Name',
            matchedTotal: 150
        })]
    })
]);

const secondSeries = changedIdPreviousSameName.series.find(
    item => item.selectionId === '22'
);
assert.equal(secondSeries.points[0].runnerMatchedDelta, null);
assert.equal(secondSeries.points[0].matchedVolume, 0);
assert.equal(secondSeries.points[0].timestamp, '2026-06-24T13:00:05.000Z');

const validRunnerDelta = buildMoneyFlowHistorySeries([
    makeTick({
        timestamp: '2026-06-24T14:00:00.000Z',
        seq: 1,
        marketTotal: 1000,
        runners: [makeRunner({
            selectionId: 101,
            name: 'Player A',
            matchedTotal: 100
        })]
    }),
    makeTick({
        timestamp: '2026-06-24T14:00:05.000Z',
        seq: 2,
        marketTotal: 1101,
        runners: [makeRunner({
            selectionId: 101,
            name: 'Player A',
            matchedTotal: 201,
            runnerDelta: 101,
            marketDelta: 101,
            ladderTradedDelta: 99
        })]
    })
]);

const validPoint = validRunnerDelta.series[0].points[1];
assert.equal(validPoint.matchedVolume, 101);
assert.equal(validPoint.runnerMatchedDelta, 101);
assert.equal(validPoint.marketMatchedDelta, 101);
assert.equal(validPoint.volumeDetected, true);
assert.equal(validPoint.validForDisplay, true);
assert.equal(validPoint.invalidVolume, false);
assert.equal(validPoint.anomaly, false);

assert.deepEqual(
    Object.keys(validPoint).sort(),
    [
        'anomaly',
        'graphHealth',
        'invalidVolume',
        'ladderSource',
        'ladderTradedDelta',
        'marketMatchedDelta',
        'matchedVolume',
        'reason',
        'runnerMatchedDelta',
        'seq',
        'timestamp',
        'validForDisplay',
        'validationReasons',
        'volumeDetected'
    ].sort()
);

for (const directionalField of [
    'back',
    'lay',
    'trend',
    'confidence',
    'classifiedVolume',
    'unclassified',
    'suppressedVolume'
]) {
    assert.equal(
        Object.hasOwn(validPoint, directionalField),
        false,
        `${directionalField} must not be exposed by the read model`
    );
}

const zeroRunnerDelta = buildMoneyFlowHistorySeries([
    makeTick({
        timestamp: '2026-06-24T15:00:00.000Z',
        seq: 1,
        marketTotal: 1000,
        runners: [makeRunner({
            selectionId: 101,
            name: 'Player A',
            matchedTotal: 100
        })]
    }),
    makeTick({
        timestamp: '2026-06-24T15:00:05.000Z',
        seq: 2,
        marketTotal: 1000,
        runners: [makeRunner({
            selectionId: 101,
            name: 'Player A',
            matchedTotal: 100,
            runnerDelta: 0,
            marketDelta: 0
        })]
    })
]);

const zeroPoint = zeroRunnerDelta.series[0].points[1];
assert.equal(zeroPoint.matchedVolume, 0);
assert.equal(zeroPoint.volumeDetected, false);
assert.equal(zeroPoint.validForDisplay, true);
assert.equal(zeroPoint.invalidVolume, false);
assert.equal(zeroPoint.anomaly, false);

const negativeRunnerDelta = buildMoneyFlowHistorySeries([
    makeTick({
        timestamp: '2026-06-24T16:00:00.000Z',
        seq: 1,
        marketTotal: 1000,
        runners: [makeRunner({
            selectionId: 101,
            name: 'Player A',
            matchedTotal: 100
        })]
    }),
    makeTick({
        timestamp: '2026-06-24T16:00:05.000Z',
        seq: 2,
        marketTotal: 1010,
        runners: [makeRunner({
            selectionId: 101,
            name: 'Player A',
            matchedTotal: 90,
            runnerDelta: -10,
            marketDelta: 10
        })]
    })
]);

const negativePoint = negativeRunnerDelta.series[0].points[1];
assert.equal(negativePoint.matchedVolume, 0);
assert.equal(negativePoint.invalidVolume, true);
assert.equal(negativePoint.anomaly, true);
assert.equal(negativePoint.validForDisplay, false);

const rawZeroComputedPositive = buildMoneyFlowHistorySeries([
    makeTick({
        timestamp: '2026-06-24T17:00:00.000Z',
        seq: 1,
        marketTotal: 1000,
        runners: [makeRunner({
            selectionId: 101,
            name: 'Player A',
            matchedTotal: 100
        })]
    }),
    makeTick({
        timestamp: '2026-06-24T17:00:05.000Z',
        seq: 2,
        marketTotal: 1020,
        runners: [makeRunner({
            selectionId: 101,
            name: 'Player A',
            matchedTotal: 120,
            runnerDelta: 0,
            marketDelta: 20
        })]
    })
]);

const mismatchPoint = rawZeroComputedPositive.series[0].points[1];
assert.equal(mismatchPoint.matchedVolume, 0);
assert.equal(mismatchPoint.invalidVolume, true);
assert.equal(mismatchPoint.anomaly, true);
assert.equal(
    mismatchPoint.reason,
    'runner_delta_raw_computed_mismatch'
);

const computedFallback = buildMoneyFlowHistorySeries([
    makeTick({
        timestamp: '2026-06-24T18:00:00.000Z',
        seq: 1,
        marketTotal: 1000,
        runners: [makeRunner({
            selectionId: 101,
            name: 'Player A',
            matchedTotal: 100
        })]
    }),
    makeTick({
        timestamp: '2026-06-24T18:00:05.000Z',
        seq: 2,
        marketTotal: 1030,
        runners: [makeRunner({
            selectionId: 101,
            name: 'Player A',
            matchedTotal: 130
        })]
    })
]);

const computedPoint = computedFallback.series[0].points[1];
assert.equal(computedPoint.matchedVolume, 30);
assert.equal(computedPoint.runnerMatchedDelta, 30);
assert.equal(computedPoint.marketMatchedDelta, 30);
assert.equal(computedPoint.volumeDetected, true);

const missingLadder = buildMoneyFlowHistorySeries([
    makeTick({
        timestamp: '2026-06-24T19:00:00.000Z',
        seq: 1,
        marketTotal: 1000,
        runners: [makeRunner({
            selectionId: 101,
            name: 'Player A',
            matchedTotal: 100
        })]
    }),
    makeTick({
        timestamp: '2026-06-24T19:00:05.000Z',
        seq: 2,
        marketTotal: 1010,
        runners: [makeRunner({
            selectionId: 101,
            name: 'Player A',
            matchedTotal: 110,
            runnerDelta: 10,
            marketDelta: 10,
            ladderSource: null
        })]
    })
]);

const missingLadderPoint = missingLadder.series[0].points[1];
assert.equal(missingLadderPoint.matchedVolume, 10);
assert.equal(missingLadderPoint.ladderTradedDelta, null);
assert.equal(missingLadderPoint.validForDisplay, true);


function buildExplicitMismatchPoint({
    previousMarketTotal,
    currentMarketTotal,
    previousRunnerTotal,
    currentRunnerTotal,
    rawRunnerDelta,
    rawMarketDelta
}) {
    const result = buildMoneyFlowHistorySeries([
        makeTick({
            timestamp: '2026-06-24T21:00:00.000Z',
            seq: 1,
            marketTotal: previousMarketTotal,
            runners: [makeRunner({
                selectionId: 909,
                name: 'Mismatch Player',
                matchedTotal: previousRunnerTotal
            })]
        }),
        makeTick({
            timestamp: '2026-06-24T21:00:05.000Z',
            seq: 2,
            marketTotal: currentMarketTotal,
            runners: [makeRunner({
                selectionId: 909,
                name: 'Mismatch Player',
                matchedTotal: currentRunnerTotal,
                runnerDelta: rawRunnerDelta,
                marketDelta: rawMarketDelta
            })]
        })
    ]);

    return result.series[0].points[1];
}

function assertInvalidMismatch(point, reason) {
    assert.equal(point.reason, reason);
    assert.equal(point.matchedVolume, 0);
    assert.equal(point.validForDisplay, false);
    assert.equal(point.invalidVolume, true);
    assert.equal(point.anomaly, true);
}

const explicitRunnerZeroComputedOne = buildExplicitMismatchPoint({
    previousMarketTotal: 1000,
    currentMarketTotal: 1001,
    previousRunnerTotal: 100,
    currentRunnerTotal: 101,
    rawRunnerDelta: 0,
    rawMarketDelta: 1
});

assertInvalidMismatch(
    explicitRunnerZeroComputedOne,
    'runner_delta_raw_computed_mismatch'
);

const explicitRunnerOneComputedZero = buildExplicitMismatchPoint({
    previousMarketTotal: 1000,
    currentMarketTotal: 1001,
    previousRunnerTotal: 100,
    currentRunnerTotal: 100,
    rawRunnerDelta: 1,
    rawMarketDelta: 1
});

assertInvalidMismatch(
    explicitRunnerOneComputedZero,
    'runner_delta_raw_computed_mismatch'
);

const explicitMarketZeroComputedOne = buildExplicitMismatchPoint({
    previousMarketTotal: 1000,
    currentMarketTotal: 1001,
    previousRunnerTotal: 100,
    currentRunnerTotal: 101,
    rawRunnerDelta: 1,
    rawMarketDelta: 0
});

assertInvalidMismatch(
    explicitMarketZeroComputedOne,
    'market_delta_raw_computed_mismatch'
);

const explicitMarketOneComputedZero = buildExplicitMismatchPoint({
    previousMarketTotal: 1000,
    currentMarketTotal: 1000,
    previousRunnerTotal: 100,
    currentRunnerTotal: 100,
    rawRunnerDelta: 0,
    rawMarketDelta: 1
});

assertInvalidMismatch(
    explicitMarketOneComputedZero,
    'market_delta_raw_computed_mismatch'
);

const explicitZeroZero = buildExplicitMismatchPoint({
    previousMarketTotal: 1000,
    currentMarketTotal: 1000,
    previousRunnerTotal: 100,
    currentRunnerTotal: 100,
    rawRunnerDelta: 0,
    rawMarketDelta: 0
});

assert.equal(explicitZeroZero.matchedVolume, 0);
assert.equal(explicitZeroZero.volumeDetected, false);
assert.equal(explicitZeroZero.validForDisplay, true);
assert.equal(explicitZeroZero.invalidVolume, false);
assert.equal(explicitZeroZero.anomaly, false);

console.log('moneyFlowHistorySeries non-directional volume tests passed');
