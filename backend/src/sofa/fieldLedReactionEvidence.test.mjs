import { buildFieldLedReactionEvidence } from './fieldLedReactionEvidence.js';

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
            source: 'sofa', seq, serving,
            score: {
                point,
                games: { home: gamesHome, away: gamesAway },
                totalSetsHome: setsHome,
                totalSetsAway: setsAway
            },
            status: { type: statusType, description: statusDesc },
            players: { home: { name: 'Alice' }, away: { name: 'Bob' } }
        }
    };
}

function makeBetfairTick(ts, marketTotal, runnerOpts = {}, seq = 1) {
    const {
        name = 'Alice',
        selectionId = 1,
        ltp = 1.8,
        bestBack = 1.79,
        bestLay = 1.81
    } = runnerOpts;
    return {
        timestamp: ts,
        data: {
            seq,
            graphHealth: { status: 'ok' },
            market: { totalMatched: marketTotal ?? 0 },
            runners: [{
                name, selectionId,
                lastTradedPrice: ltp,
                bestBack, bestLay,
                matchedTotal: null,
                ladderSource: 'graph',
                moneyFlow: { back: 0, lay: 0, trend: 'neutral', runnerDelta: 0, marketDelta: 0, confidence: 'confirmed', reason: null }
            }]
        }
    };
}

console.log('\n=== fieldLedReactionEvidence.test.mjs ===\n');

{
    console.log('T01: Empty input');
    const r = buildFieldLedReactionEvidence();
    assert('T01-available-false', r.available === false, String(r.available));
    assert('T01-sourceFieldEvent-null', r.sourceFieldEvent === null);
    assert('T01-observationWindows-empty', Array.isArray(r.observationWindows) && r.observationWindows.length === 0);
    assert('T01-causalityClaimed-false', r.causalityClaimed === false);
    assert('T01-summary-causalityClaimed', r.summary.causalityClaimed === false);
    assert('T01-sourceType', r.sourceType === 'sofa_event', r.sourceType);
    assert('T01-interpretation', r.interpretation === 'temporal_proximity_only', r.interpretation);
}

{
    console.log('\nT02: No relevant Sofa marker');
    // Only ordinary score ticks, no break point / deuce / 30-all / game point
    const sofaTicks = [
        makeSofaTick('2026-06-19T12:09:00Z', { point: '15-0', serving: 'home' }),
        makeSofaTick('2026-06-19T12:09:30Z', { point: '30-0', serving: 'home' })
    ];
    const r = buildFieldLedReactionEvidence({ sofaTicks, now: NOW });
    assert('T02-available-false', r.available === false);
    assert('T02-sourceFieldEvent-null', r.sourceFieldEvent === null);
    assert('T02-reason-present', r.summary.reasons.length > 0, JSON.stringify(r.summary.reasons));
    assert('T02-causalityClaimed', r.causalityClaimed === false);
}

{
    console.log('\nT03: Break point followed by Betfair observation');
    // BREAK_POINT: server=home at 30, receiver=away at 40 → 30-40 with serving=home
    const anchorTs = '2026-06-19T12:09:00.000Z';
    const sofaTicks = [
        makeSofaTick('2026-06-19T12:08:50Z', { point: '30-0', serving: 'home' }),
        makeSofaTick(anchorTs, { point: '30-40', serving: 'home' })
    ];
    const betfairTicks = [
        makeBetfairTick('2026-06-19T12:08:55Z', 5000, { ltp: 1.80 }),          // baseline before anchor
        makeBetfairTick('2026-06-19T12:09:10Z', 5200, { ltp: 1.85 }),           // +10s
        makeBetfairTick('2026-06-19T12:09:30Z', 5400, { ltp: 1.90 })            // +30s
    ];
    const r = buildFieldLedReactionEvidence({ sofaTicks, betfairTicks, now: NOW });
    assert('T03-available', r.available === true, String(r.available));
    assert('T03-sourceType-sofa', r.sourceFieldEvent?.type === 'BREAK_POINT',
        String(r.sourceFieldEvent?.type));
    assert('T03-windows-count', r.observationWindows.length === 6, String(r.observationWindows.length));
    assert('T03-marketResponseObserved', r.summary.marketResponseObserved === true);
    // first response should be within the 10s window
    assert('T03-firstResponse-10', r.summary.firstObservedResponseWindowSec <= 30,
        String(r.summary.firstObservedResponseWindowSec));
    // window 10s: tick at +10s is inside
    const w10 = r.observationWindows.find(w => w.windowSec === 10);
    assert('T03-w10-priceChangeObserved', w10?.priceChangeObserved === true,
        JSON.stringify(w10?.runnerPriceChanges));
    assert('T03-w10-matchedVolumeIncrease', w10?.matchedVolumeIncreaseObserved === true,
        String(w10?.marketMatchedDelta));
    assert('T03-causalityClaimed-false', r.causalityClaimed === false);
    assert('T03-summary-causalityClaimed', r.summary.causalityClaimed === false);
    for (const w of r.observationWindows) {
        assert(`T03-window-${w.windowSec}-causalityClaimed`, w.causalityClaimed === false);
    }
}

{
    console.log('\nT04: Marker present, no Betfair ticks after anchor');
    const anchorTs = '2026-06-19T12:09:00.000Z';
    const sofaTicks = [
        makeSofaTick('2026-06-19T12:08:50Z', { point: '30-0', serving: 'home' }),
        makeSofaTick(anchorTs, { point: '30-40', serving: 'home' })
    ];
    const betfairTicks = [
        makeBetfairTick('2026-06-19T12:08:55Z', 5000, { ltp: 1.80 })  // only before anchor
    ];
    const r = buildFieldLedReactionEvidence({ sofaTicks, betfairTicks, now: NOW });
    assert('T04-available', r.available === true, String(r.available));
    assert('T04-sourceFieldEvent-available', r.sourceFieldEvent !== null);
    assert('T04-allWindows-noTicks', r.observationWindows.every(w => w.betfairTicksObserved === 0),
        JSON.stringify(r.observationWindows.map(w => w.betfairTicksObserved)));
    assert('T04-marketResponseFalse', r.summary.marketResponseObserved === false);
    assert('T04-dataQuality-poor', r.summary.dataQuality === 'poor', r.summary.dataQuality);
    assert('T04-causalityClaimed', r.causalityClaimed === false);
}

{
    console.log('\nT05: Custom config — dedup and sort windows, clamp maxSourceAgeSec');
    const anchorTs = '2026-06-19T12:09:00.000Z';
    const sofaTicks = [
        makeSofaTick('2026-06-19T12:08:50Z', { point: '30-0', serving: 'home' }),
        makeSofaTick(anchorTs, { point: '30-40', serving: 'home' })
    ];
    const r = buildFieldLedReactionEvidence({
        sofaTicks,
        now: NOW,
        config: { observationWindowsSec: [30, 10, 30, -1], maxSourceAgeSec: 90 }
    });
    assert('T05-windows-deduped-sorted',
        JSON.stringify(r.config.observationWindowsSec) === JSON.stringify([10, 30]),
        JSON.stringify(r.config.observationWindowsSec));
    assert('T05-maxSourceAgeSec', r.config.maxSourceAgeSec === 90, String(r.config.maxSourceAgeSec));
    assert('T05-window-count', r.observationWindows.length === 2, String(r.observationWindows.length));
}

{
    console.log('\nT06: Source event too old');
    // anchor is more than 240s before NOW
    const oldTs = '2026-06-19T12:05:00.000Z'; // 300s before 12:10
    const sofaTicks = [
        makeSofaTick('2026-06-19T12:04:50Z', { point: '30-0', serving: 'home' }),
        makeSofaTick(oldTs, { point: '30-40', serving: 'home' })
    ];
    const r = buildFieldLedReactionEvidence({ sofaTicks, now: NOW });
    assert('T06-available-false', r.available === false, String(r.available));
    assert('T06-sourceFieldEvent-present', r.sourceFieldEvent !== null);
    assert('T06-no-windows', r.observationWindows.length === 0, String(r.observationWindows.length));
    assert('T06-reason-stale', r.summary.reasons.some(s => s.includes('maxSourceAgeSec')),
        JSON.stringify(r.summary.reasons));
    assert('T06-causalityClaimed', r.causalityClaimed === false);
}

{
    console.log('\nT07: No mutation of inputs');
    const anchorTs = '2026-06-19T12:09:00.000Z';
    const sofaTicks = [
        makeSofaTick('2026-06-19T12:08:50Z', { point: '30-0', serving: 'home' }),
        makeSofaTick(anchorTs, { point: '30-40', serving: 'home' })
    ];
    const betfairTicks = [
        makeBetfairTick('2026-06-19T12:08:55Z', 5000),
        makeBetfairTick('2026-06-19T12:09:10Z', 5200)
    ];
    const cfg = { observationWindowsSec: [10, 30] };

    const sofaSnap = JSON.stringify(sofaTicks);
    const bfSnap = JSON.stringify(betfairTicks);
    const cfgSnap = JSON.stringify(cfg);

    buildFieldLedReactionEvidence({ sofaTicks, betfairTicks, now: NOW, config: cfg });

    assert('T07-sofaTicks-not-mutated', JSON.stringify(sofaTicks) === sofaSnap);
    assert('T07-betfairTicks-not-mutated', JSON.stringify(betfairTicks) === bfSnap);
    assert('T07-config-not-mutated', JSON.stringify(cfg) === cfgSnap);
}

console.log(`\n=== Tests completed: ${passed} passed, ${failed} failed ===\n`);
if (failed > 0) process.exit(1);
