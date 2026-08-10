import assert from 'node:assert/strict';
import { buildSignificantMarketFlowEvidence } from './significantMarketFlowEvidence.js';

const now = new Date('2026-06-19T12:10:00.000Z');

function tick(overrides = {}) {
    const moneyFlow = {
        back: 1200,
        lay: 0,
        trend: 'backing',
        runnerDelta: 1200,
        marketDelta: 1200,
        confidence: 'confirmed',
        reason: null,
        ...overrides.moneyFlow
    };
    return {
        timestamp: overrides.timestamp || '2026-06-19T12:09:50.000Z',
        data: {
            seq: 1,
            graphHealth: { status: overrides.graphHealth || 'ok' },
            market: { totalMatched: 10000 },
            runners: [{
                name: 'Runner A',
                selectionId: overrides.selectionId === undefined ? 1 : overrides.selectionId,
                bestBack: 1.9,
                bestLay: 2,
                ladderSource: overrides.ladderSource || 'graph',
                ladder: overrides.ladder === undefined ? [{}] : overrides.ladder,
                matchedTotal: 5000,
                moneyFlow
            }]
        }
    };
}

const confirmed = buildSignificantMarketFlowEvidence({ betfairTicks: [tick()], now });
assert.equal(confirmed.summary.largeFlowDetected, true);
assert.equal(confirmed.latestSignificantFlow?.runner, 'Runner A');

for (const invalidTick of [
    tick({ moneyFlow: { confidence: 'suppressed', reason: 'runner_matched_unavailable' } }),
    tick({ moneyFlow: { confidence: 'suppressed', reason: 'flow_exceeds_runner_delta' } }),
    tick({ graphHealth: 'stale' }),
    tick({ ladder: [] }),
    tick({ selectionId: null })
]) {
    const result = buildSignificantMarketFlowEvidence({ betfairTicks: [invalidTick], now });
    assert.equal(result.summary.largeFlowDetected, false);
    assert.equal(result.latestSignificantFlow, null);
    assert.ok(result.summary.invalidFlowCount > 0);
}

console.log('significantMarketFlowEvidence.test: 17 assertions passed');
