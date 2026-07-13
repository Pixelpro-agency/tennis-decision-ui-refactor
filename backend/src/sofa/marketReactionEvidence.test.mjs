import { buildMarketReactionEvidence } from './marketReactionEvidence.js';

let passed = 0;
let failed = 0;

function assert(label, condition, detail = '') {
    if (condition) {
        console.log(`  PASS [${label}]`);
        passed++;
    } else {
        console.error(`  FAIL [${label}]${detail ? ': ' + detail : ''}`);
        failed++;
    }
}

const NOW = new Date('2026-06-19T12:10:00.000Z');

function makeBetfairTick(ts, marketTotal, runnerOpts = {}, seq = 1) {
    const {
        name = 'RunnerA',
        selectionId = 1,
        ltp = 1.8,
        bestBack = 1.79,
        bestLay = 1.81,
        matchedTotal = null,
        mfBack = 0,
        mfLay = 0,
        mfTrend = 'neutral',
        runnerDelta = 0,
        marketDelta = 0,
        mfConfidence = 'confirmed',
        mfReason = null
    } = runnerOpts;

    return {
        timestamp: ts,
        data: {
            seq,
            graphHealth: { status: 'ok' },
            market: { totalMatched: marketTotal ?? 0 },
            runners: [{
                name,
                selectionId,
                lastTradedPrice: ltp,
                bestBack,
                bestLay,
                matchedTotal,
                ladderSource: 'graph',
                moneyFlow: {
                    back: mfBack,
                    lay: mfLay,
                    trend: mfTrend,
                    runnerDelta,
                    marketDelta,
                    confidence: mfConfidence,
                    reason: mfReason
                }
            }]
        }
    };
}

function makeSofaTick(ts, scoreOpts = {}, seq = 1) {
    const {
        point = '0-0',
        gamesHome = 0, gamesAway = 0,
        setsHome = 0, setsAway = 0,
        serving = 'home',
        statusType = 'inprogress',
        statusDesc = 'In progress'
    } = scoreOpts;

    return {
        timestamp: ts,
        data: {
            source: 'sofa',
            seq,
            serving,
            score: {
                point,
                games: { home: gamesHome, away: gamesAway },
                totalSetsHome: setsHome,
                totalSetsAway: setsAway
            },
            status: { type: statusType, description: statusDesc },
            players: {
                home: { name: 'Alice' },
                away: { name: 'Bob' }
            }
        }
    };
}

console.log('\n=== marketReactionEvidence.test.mjs ===\n');

{
    console.log('T01: Empty input');
    const r = buildMarketReactionEvidence();
    assert('T01-available-false', r.available === false, String(r.available));
    assert('T01-smf-available-false', r.significantMarketFlow.available === false);
    assert('T01-mlo-available-false', r.marketLedObservation.available === false);
    assert('T01-flr-available-false', r.fieldLedReaction.available === false);
    assert('T01-summary-causalityClaimed', r.summary.causalityClaimed === false);
    assert('T01-smf-causalityClaimed-field', !('causalityClaimed' in r.significantMarketFlow) ||
        r.significantMarketFlow.causalityClaimed === false);
    assert('T01-mlo-causalityClaimed', r.marketLedObservation.summary.causalityClaimed === false);
    assert('T01-flr-causalityClaimed', r.fieldLedReaction.causalityClaimed === false);
}

{
    console.log('\nT02: Betfair ticks but no significant flow');
    const ticks = [
        makeBetfairTick('2026-06-19T12:00:00Z', 200, {
            runnerDelta: 200, marketDelta: 200, mfBack: 200, mfTrend: 'back'
        })
    ];
    const r = buildMarketReactionEvidence({ betfairTicks: ticks, now: NOW });
    assert('T02-smf-available', r.significantMarketFlow.available === true);
    assert('T02-largeFlowDetected-false', r.summary.largeFlowDetected === false,
        String(r.significantMarketFlow.summary.largeFlowDetected));
    assert('T02-mlo-available-false', r.marketLedObservation.available === false);
    assert('T02-latestFlow-null', r.significantMarketFlow.latestSignificantFlow === null);
    assert('T02-parent-available-true', r.available === true);
}

{
    console.log('\nT03: Significant flow produces market-led observation');
    const flowTs = '2026-06-19T12:00:00Z';
    const betfairTicks = [
        makeBetfairTick('2026-06-19T11:59:50Z', 5000, {
            runnerDelta: 100, marketDelta: 100, mfBack: 100, mfTrend: 'back'
        }),
        makeBetfairTick(flowTs, 6200, {
            runnerDelta: 1200, marketDelta: 1200, mfBack: 1200, mfTrend: 'back'
        })
    ];
    const sofaTicks = [
        makeSofaTick('2026-06-19T11:59:50Z', { point: '30-0', gamesHome: 2 }),
        makeSofaTick('2026-06-19T12:00:30Z', { point: '40-0', gamesHome: 2 }),
        makeSofaTick('2026-06-19T12:01:00Z', { point: '0-0', gamesHome: 3 })
    ];
    const r = buildMarketReactionEvidence({ betfairTicks, sofaTicks, now: NOW });
    assert('T03-largeFlowDetected', r.summary.largeFlowDetected === true,
        String(r.significantMarketFlow.summary.largeFlowDetected));
    assert('T03-mlo-available', r.marketLedObservation.available === true,
        String(r.marketLedObservation.available));
    const latestFlow = r.significantMarketFlow.latestSignificantFlow;
    assert('T03-latestFlow-not-null', latestFlow !== null);
    assert('T03-sourceMarketEvent-ts', latestFlow !== null &&
        r.marketLedObservation.sourceMarketEvent?.timestamp === latestFlow.timestamp,
        `mlo: ${r.marketLedObservation.sourceMarketEvent?.timestamp} vs flow: ${latestFlow?.timestamp}`);
    assert('T03-fieldEvidence', r.marketLedObservation.observationWindows.some(w => w.fieldEventObservedAfterFlow));
    assert('T03-causalityClaimed-false', r.summary.causalityClaimed === false);
    assert('T03-mlo-causalityClaimed-false', r.marketLedObservation.summary.causalityClaimed === false);
}

{
    console.log('\nT04: Config forwarding');
    const betfairTicks = [
        makeBetfairTick('2026-06-19T12:00:00Z', 6200, {
            runnerDelta: 1200, marketDelta: 1200, mfBack: 1200, mfTrend: 'back'
        })
    ];
    const r = buildMarketReactionEvidence({
        betfairTicks,
        now: NOW,
        config: {
            significantMarketFlow: { baselineLookbackTicks: 0 },
            marketLedObservation: { observationWindowsSec: [30, 90] }
        }
    });
    assert('T04-smf-config-baselineLookbackTicks',
        r.config.significantMarketFlow.baselineLookbackTicks === 0,
        String(r.config.significantMarketFlow.baselineLookbackTicks));
    assert('T04-mlo-config-windowsSec',
        Array.isArray(r.config.marketLedObservation.observationWindowsSec) &&
        r.config.marketLedObservation.observationWindowsSec[0] === 30 &&
        r.config.marketLedObservation.observationWindowsSec[1] === 90,
        JSON.stringify(r.config.marketLedObservation.observationWindowsSec));
    assert('T04-mlo-windows-count',
        r.marketLedObservation.observationWindows.length === 2 ||
        r.marketLedObservation.available === false);
}

{
    console.log('\nT05: Field-led real contract — no Sofa source');
    const r = buildMarketReactionEvidence();
    const flr = r.fieldLedReaction;
    assert('T05-available-false', flr.available === false, String(flr.available));
    assert('T05-sourceType', flr.sourceType === 'sofa_event', flr.sourceType);
    assert('T05-causalityClaimed-false', flr.causalityClaimed === false, String(flr.causalityClaimed));
    assert('T05-interpretation', flr.interpretation === 'temporal_proximity_only', flr.interpretation);
    assert('T05-sourceFieldEvent-null', flr.sourceFieldEvent === null);
}

{
    console.log('\nT06: Parent summary forwarding — ambiguous flow');
    const flowTs = '2026-06-19T12:00:00Z';
    const betfairTicks = [
        makeBetfairTick('2026-06-19T11:59:50Z', 5000, {
            runnerDelta: 100, marketDelta: 100, mfBack: 100, mfTrend: 'back'
        }),
        makeBetfairTick(flowTs, 6200, {
            name: 'RunnerA',
            runnerDelta: 1200, marketDelta: 1200,
            mfBack: 700, mfLay: 500, mfTrend: 'mixed',
            mfConfidence: 'low'
        })
    ];
    const sofaTicks = [
        makeSofaTick('2026-06-19T11:59:50Z', { point: '0-0' }),
        makeSofaTick('2026-06-19T12:00:30Z', { point: '15-0' })
    ];
    const r = buildMarketReactionEvidence({ betfairTicks, sofaTicks, now: NOW });
    assert('T06-flowAmbiguous', r.summary.flowAmbiguous === r.marketLedObservation.summary.flowAmbiguous);
    assert('T06-dataQuality', r.summary.dataQuality === r.marketLedObservation.summary.dataQuality,
        `parent: ${r.summary.dataQuality} mlo: ${r.marketLedObservation.summary.dataQuality}`);
    const childReasons = [
        ...(r.significantMarketFlow.summary.reasons ?? []),
        ...(r.marketLedObservation.summary.reasons ?? []),
        ...(r.fieldLedReaction.summary.reasons ?? [])
    ];
    const uniqueChildReasons = [...new Set(childReasons.filter(x => x.length > 0))];
    const parentReasons = r.summary.reasons;
    assert('T06-reasons-unique', parentReasons.length === uniqueChildReasons.length,
        `parent: ${parentReasons.length}, expected: ${uniqueChildReasons.length}`);
    for (const reason of parentReasons) {
        assert(`T06-reason-from-child: "${reason}"`,
            childReasons.includes(reason), reason);
    }
}

{
    console.log('\nT07: No mutation of input arrays and config');
    const betfairTicks = [
        makeBetfairTick('2026-06-19T12:00:00Z', 6200, {
            runnerDelta: 1200, marketDelta: 1200, mfBack: 1200, mfTrend: 'back'
        })
    ];
    const sofaTicks = [
        makeSofaTick('2026-06-19T11:59:50Z'),
        makeSofaTick('2026-06-19T12:00:30Z')
    ];
    const config = { significantMarketFlow: {}, marketLedObservation: {} };

    const betfairSnap = JSON.stringify(betfairTicks);
    const sofaSnap = JSON.stringify(sofaTicks);
    const configSnap = JSON.stringify(config);
    const betfairLen = betfairTicks.length;
    const sofaLen = sofaTicks.length;

    buildMarketReactionEvidence({ betfairTicks, sofaTicks, now: NOW, config });

    assert('T07-betfairTicks-not-mutated', JSON.stringify(betfairTicks) === betfairSnap &&
        betfairTicks.length === betfairLen);
    assert('T07-sofaTicks-not-mutated', JSON.stringify(sofaTicks) === sofaSnap &&
        sofaTicks.length === sofaLen);
    assert('T07-config-not-mutated', JSON.stringify(config) === configSnap);
}

{
    console.log('\nT08: Causality invariant throughout');
    const betfairTicks = [
        makeBetfairTick('2026-06-19T11:59:50Z', 5000, {
            runnerDelta: 100, marketDelta: 100, mfBack: 100, mfTrend: 'back'
        }),
        makeBetfairTick('2026-06-19T12:00:00Z', 6200, {
            runnerDelta: 1200, marketDelta: 1200, mfBack: 1200, mfTrend: 'back'
        })
    ];
    const sofaTicks = [
        makeSofaTick('2026-06-19T11:59:50Z', { point: '30-0' }),
        makeSofaTick('2026-06-19T12:00:30Z', { point: '40-0' })
    ];
    const r = buildMarketReactionEvidence({ betfairTicks, sofaTicks, now: NOW });
    assert('T08-summary-causalityClaimed', r.summary.causalityClaimed === false);
    assert('T08-flows-causalityClaimed',
        r.significantMarketFlow.significantFlows.every(f => f.causalityClaimed === false),
        JSON.stringify(r.significantMarketFlow.significantFlows.map(f => f.causalityClaimed)));
    assert('T08-mlo-summary-causalityClaimed', r.marketLedObservation.summary.causalityClaimed === false);
    assert('T08-flr-causalityClaimed', r.fieldLedReaction.causalityClaimed === false);
}

{
    console.log('\nT09: Field-led available with break point and Betfair response');
    // BREAK_POINT: 30-40 serving home, anchor ~12:09:00
    const anchorTs = '2026-06-19T12:09:00.000Z';
    const sofaTicks = [
        makeSofaTick('2026-06-19T12:08:50Z', { point: '30-0', serving: 'home' }),
        makeSofaTick(anchorTs, { point: '30-40', serving: 'home' })
    ];
    const betfairTicks = [
        makeBetfairTick('2026-06-19T12:08:55Z', 5000, { ltp: 1.80 }),
        makeBetfairTick('2026-06-19T12:09:10Z', 5200, { ltp: 1.90 })
    ];
    const r = buildMarketReactionEvidence({ betfairTicks, sofaTicks, now: NOW });
    assert('T09-flr-available', r.fieldLedReaction.available === true,
        String(r.fieldLedReaction.available));
    assert('T09-flr-marketResponseObserved', r.fieldLedReaction.summary.marketResponseObserved === true);
    assert('T09-summary-fieldLedAvailable', r.summary.fieldLedAvailable === true);
    assert('T09-summary-fieldLedMarketResponseObserved',
        r.summary.fieldLedMarketResponseObserved === true);
    assert('T09-summary-fieldLedDataQuality',
        r.summary.fieldLedDataQuality === r.fieldLedReaction.summary.dataQuality,
        `parent: ${r.summary.fieldLedDataQuality} flr: ${r.fieldLedReaction.summary.dataQuality}`);
    assert('T09-summary-causalityClaimed', r.summary.causalityClaimed === false);
}

{
    console.log('\nT10: Config forwarding to fieldLedReaction');
    const sofaTicks = [
        makeSofaTick('2026-06-19T12:08:50Z', { point: '30-0', serving: 'home' }),
        makeSofaTick('2026-06-19T12:09:00Z', { point: '30-40', serving: 'home' })
    ];
    const r = buildMarketReactionEvidence({
        sofaTicks,
        now: NOW,
        config: {
            fieldLedReaction: {
                observationWindowsSec: [10, 30],
                maxSourceAgeSec: 90
            }
        }
    });
    assert('T10-flr-config-windowsSec',
        JSON.stringify(r.config.fieldLedReaction.observationWindowsSec) === JSON.stringify([10, 30]),
        JSON.stringify(r.config.fieldLedReaction.observationWindowsSec));
    assert('T10-flr-config-maxSourceAgeSec',
        r.config.fieldLedReaction.maxSourceAgeSec === 90,
        String(r.config.fieldLedReaction.maxSourceAgeSec));
}

{
    console.log('\nT11: summary.reasons includes FLR reasons (unique)');
    // source with no Betfair ticks → FLR will have poor-window reasons
    const anchorTs = '2026-06-19T12:09:00.000Z';
    const sofaTicks = [
        makeSofaTick('2026-06-19T12:08:50Z', { point: '30-0', serving: 'home' }),
        makeSofaTick(anchorTs, { point: '30-40', serving: 'home' })
    ];
    const r = buildMarketReactionEvidence({ sofaTicks, now: NOW });
    const flrReasons = r.fieldLedReaction.summary.reasons ?? [];
    for (const reason of flrReasons) {
        assert(`T11-reason-in-parent: "${reason}"`,
            r.summary.reasons.includes(reason), reason);
    }
    assert('T11-reasons-unique',
        r.summary.reasons.length === new Set(r.summary.reasons).size);
}

console.log(`\n=== Tests completed: ${passed} passed, ${failed} failed ===\n`);
if (failed > 0) process.exit(1);
