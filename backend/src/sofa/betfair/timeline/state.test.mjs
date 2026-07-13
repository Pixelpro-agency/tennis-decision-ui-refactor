import assert from 'node:assert/strict';
import {
    findLastAlgorithmicTick,
    getNextBetfairSeq,
    isDuplicateBetfairTick,
    isRegressiveBetfairTick
} from './state.js';

let passed = 0;

function check(label, value) {
    assert.equal(value, true, label);
    console.log(`PASS ${label}`);
    passed += 1;
}

function makeRunner({
    selectionId = '11',
    name = 'Player A',
    matchedTotal = 400,
    totalMatchedOnSelection = 400,
    lastTradedPrice = 2,
    bestBack = 1.98,
    bestBackSize = 100,
    bestLay = 2.02,
    bestLaySize = 110,
    traded = 80
} = {}) {
    return {
        selectionId,
        name,
        matchedTotal,
        totalMatchedOnSelection,
        lastTradedPrice,
        bestBack,
        bestBackSize,
        bestLay,
        bestLaySize,
        ladder: [{ price: 2, traded }]
    };
}

function makeTick({
    totalMatched = 1000,
    runners = [makeRunner()]
} = {}) {
    return {
        source: 'betfair',
        seq: 7,
        diagnostics: { graphLoginRequired: false },
        market: { totalMatched },
        graphHealth: {
            status: 'ok',
            graphUrlsSucceeded: 2,
            graphUrlsFailed: 0,
            hasUsableGraphLadder: true,
            authSuspected: false
        },
        runners
    };
}

const algorithmicTick = makeTick();
const timeline = {
    timeline: [
        { data: { source: 'other', seq: 99, runners: [] } },
        { data: algorithmicTick }
    ]
};

check('find last algorithmic tick', findLastAlgorithmicTick(timeline) === algorithmicTick);
check('missing timeline returns null', findLastAlgorithmicTick(null) === null);
check('next sequence follows last tick', getNextBetfairSeq(timeline) === 8);
check('next sequence starts at one', getNextBetfairSeq({ timeline: [] }) === 1);

const baseline = makeTick({
    runners: [
        makeRunner({ selectionId: '11', name: 'Player A' }),
        makeRunner({
            selectionId: '12',
            name: 'Player B',
            matchedTotal: 500,
            totalMatchedOnSelection: 500,
            lastTradedPrice: 3,
            bestBack: 2.98,
            bestLay: 3.02,
            traded: 90
        })
    ]
});

const reordered = structuredClone(baseline);
reordered.runners.reverse();
check(
    'same values with runners reordered are duplicate',
    isDuplicateBetfairTick(baseline, reordered)
);

const changedSelectionId = structuredClone(baseline);
changedSelectionId.runners[0].selectionId = '99';
check(
    'different selectionId is not duplicate',
    !isDuplicateBetfairTick(baseline, changedSelectionId)
);

const changedMatched = structuredClone(baseline);
changedMatched.runners[0].matchedTotal += 1;
check(
    'different matchedTotal is not duplicate',
    !isDuplicateBetfairTick(baseline, changedMatched)
);

const changedTraded = structuredClone(baseline);
changedTraded.runners[0].ladder[0].traded += 1;
check(
    'different ladder traded is not duplicate',
    !isDuplicateBetfairTick(baseline, changedTraded)
);

const noSelectionId = structuredClone(baseline);
noSelectionId.runners[0].selectionId = null;
check(
    'runner without selectionId is not reliably deduplicated',
    !isDuplicateBetfairTick(baseline, noSelectionId)
);

const lowerMarket = structuredClone(baseline);
lowerMarket.market.totalMatched -= 1;
check(
    'lower market total is regressive',
    isRegressiveBetfairTick(baseline, lowerMarket)
);

const lowerRunnerMatched = structuredClone(baseline);
lowerRunnerMatched.runners[0].matchedTotal -= 1;
check(
    'lower runner matchedTotal for same ID is regressive',
    isRegressiveBetfairTick(baseline, lowerRunnerMatched)
);

const lowerRunnerSelectionMatched = structuredClone(baseline);
lowerRunnerSelectionMatched.runners[0].totalMatchedOnSelection -= 1;
check(
    'lower totalMatchedOnSelection for same ID is regressive',
    isRegressiveBetfairTick(baseline, lowerRunnerSelectionMatched)
);

const lowerLadderTraded = structuredClone(baseline);
lowerLadderTraded.runners[0].ladder[0].traded -= 1;
check(
    'lower ladder traded for same ID and price is regressive',
    isRegressiveBetfairTick(baseline, lowerLadderTraded)
);

const changedIdWithLowerValues = structuredClone(baseline);
changedIdWithLowerValues.runners[0].selectionId = '77';
changedIdWithLowerValues.runners[0].matchedTotal = 1;
changedIdWithLowerValues.runners[0].totalMatchedOnSelection = 1;
changedIdWithLowerValues.runners[0].ladder[0].traded = 1;
check(
    'changed selectionId is a new identity, not a runner regression',
    !isRegressiveBetfairTick(baseline, changedIdWithLowerValues)
);

console.log(`timeline state: ${passed} assertions passed`);
