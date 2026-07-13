import assert from 'node:assert/strict';

import {
    buildLatestBetfairPayload
} from './latestPayload.js';

import {
    betfairTimeline,
    latestTick,
    runtime200,
    sofaTimeline,
    validTicks
} from './latestPayloadTestFixtures.mjs';

let runtimeEventId200 = null;
let healthInput200 = null;
let receivedTicks = null;

const result = await buildLatestBetfairPayload({
    eventId: 'request-event',
    mode: 'cdp',
    cdpUrl: 'http://127.0.0.1:9222',
    dependencies: {
        now: new Date('2026-06-24T11:00:00.000Z'),
        checkCdpStatus: async () => true,
        loadTimeline: source => source === 'betfair' ? betfairTimeline : sofaTimeline,
        getBetfairTrackingRuntime: eventId => {
            runtimeEventId200 = eventId;
            return runtime200;
        },
        buildBetfairSessionHealth: input => {
            healthInput200 = input;
            return { status: 'healthy' };
        },
        getLatestValidBetfairTick: () => latestTick,
        getValidBetfairTicks: () => validTicks,
        buildMoneyFlowHistorySeries: ticks => {
            receivedTicks = ticks;
            return {
                series: [{
                    selectionId: '101',
                    name: 'Player A',
                    points: [{
                        timestamp: ticks[ticks.length - 1].timestamp,
                        matchedVolume: 17,
                        runnerMatchedDelta: 17,
                        marketMatchedDelta: 17,
                        ladderTradedDelta: null,
                        reason: null,
                        validationReasons: [],
                        seq: ticks[ticks.length - 1].data.seq,
                        graphHealth: 'ok',
                        ladderSource: 'graph_url',
                        volumeDetected: true,
                        validForDisplay: true,
                        invalidVolume: false,
                        anomaly: false
                    }]
                }]
            };
        }
    }
});

assert.equal(result.httpStatus, 200);
assert.equal(result.body.ok, true);
assert.equal(result.body.latest, latestTick.data);
assert.equal(receivedTicks.length, 20);
assert.equal(receivedTicks[0].data.seq, 3);
assert.ok(Array.isArray(result.body.moneyFlowHistory.series));
assert.equal(result.body.moneyFlowHistory.series[0].selectionId, '101');
assert.equal(
    result.body.moneyFlowHistory.series[0].points[0].matchedVolume,
    17
);
assert.equal(
    Object.hasOwn(result.body.moneyFlowHistory.series[0].points[0], 'back'),
    false
);
assert.equal(
    Object.hasOwn(result.body.moneyFlowHistory.series[0].points[0], 'lay'),
    false
);
assert.equal(result.body.metadata.eventId, 'stored-event');
assert.equal(runtimeEventId200, 'request-event');
assert.equal(healthInput200.runtime, runtime200);
assert.equal(
    Object.prototype.hasOwnProperty.call(result.body, 'runtime'),
    false
);

const runtime404 = { lastTechnicalErrorAt: '2026-06-24T10:30:00.000Z' };
let runtimeEventId404 = null;
let healthInput404 = null;

const missing = await buildLatestBetfairPayload({
    eventId: 'missing-event',
    dependencies: {
        checkCdpStatus: async () => null,
        loadTimeline: source => source === 'sofa' ? sofaTimeline : null,
        getBetfairTrackingRuntime: eventId => {
            runtimeEventId404 = eventId;
            return runtime404;
        },
        buildBetfairSessionHealth: input => {
            healthInput404 = input;
            return { status: 'missing' };
        }
    }
});

assert.equal(missing.httpStatus, 404);
assert.equal(missing.body.ok, false);
assert.equal(missing.body.health.status, 'missing');
assert.equal(runtimeEventId404, 'missing-event');
assert.equal(healthInput404.runtime, runtime404);
assert.equal(
    Object.prototype.hasOwnProperty.call(missing.body, 'runtime'),
    false
);
