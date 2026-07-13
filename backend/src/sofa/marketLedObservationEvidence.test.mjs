
import {
    buildMarketLedObservationEvidence,
    extractSofaScoreSnapshot,
    diffSofaScoreSnapshots,
    collectSofaEventsInWindow,
    buildObservationWindow
} from './marketLedObservationEvidence.js';


let passed = 0;
let failed = 0;

function assert(label, condition, detail) {
    if (condition) {
        console.log(`  PASS [${label}]`);
        passed++;
    } else {
        console.error(`  FAIL [${label}]${detail ? ': ' + detail : ''}`);
        failed++;
    }
}

function makeSofaTick(ts, scoreOpts = {}, players = { home: 'Alice', away: 'Bob' }, seq = 1) {
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
                home: { name: players.home },
                away: { name: players.away }
            }
        }
    };
}

function makeSourceEvent(ts, overrides = {}) {
    return {
        timestamp: ts,
        validVolume: true,
        flowAmbiguous: false,
        direction: 'back',
        directionAttributed: true,
        observedFlowAmount: 1500,
        absoluteFlowTier: 'strong',
        relativeFlowTier: 'elevated',
        ...overrides
    };
}


console.log('\n=== marketLedObservationEvidence.test.mjs ===\n');

{
    console.log('T01: No sourceMarketEvent → available: false');
    const r = buildMarketLedObservationEvidence({ sourceMarketEvent: null, sofaTicks: [] });
    assert('T01-available-false', r.available === false, JSON.stringify(r.available));
    assert('T01-reason', r.summary.reasons.includes('No source market event available'));
    assert('T01-causalityClaimed', r.summary.causalityClaimed === false);
}

{
    console.log('\nT02: No sofaTicks → available: false');
    const src = makeSourceEvent('2025-01-01T12:00:00Z');
    const r = buildMarketLedObservationEvidence({ sourceMarketEvent: src, sofaTicks: [] });
    assert('T02-available-false', r.available === false, JSON.stringify(r.available));
    assert('T02-reason', r.summary.reasons.includes('No SofaScore ticks available'));
    assert('T02-sourceMarketEvent', r.sourceMarketEvent !== null && r.sourceMarketEvent.timestamp === src.timestamp);
    assert('T02-causalityClaimed', r.summary.causalityClaimed === false);
}

{
    console.log('\nT03: Valid input → available: true, 4 observation windows');
    const src = makeSourceEvent('2025-01-01T12:00:00Z');
    const ticks = [
        makeSofaTick('2025-01-01T11:59:50Z', { point: '30-0', gamesHome: 2, gamesAway: 1 }),
        makeSofaTick('2025-01-01T12:00:30Z', { point: '40-0', gamesHome: 2, gamesAway: 1 }),
        makeSofaTick('2025-01-01T12:01:30Z', { point: '0-0', gamesHome: 3, gamesAway: 1 })
    ];
    const r = buildMarketLedObservationEvidence({ sourceMarketEvent: src, sofaTicks: ticks, now: new Date('2025-01-01T12:05:00Z') });
    assert('T03-available', r.available === true);
    assert('T03-windows-count', r.observationWindows.length === 4, String(r.observationWindows.length));
    assert('T03-windows-60', r.observationWindows[0].windowSec === 60);
    assert('T03-windows-240', r.observationWindows[3].windowSec === 240);
    assert('T03-causalityClaimed', r.summary.causalityClaimed === false);
    assert('T03-interpretation', r.observationWindows[0].interpretation === 'temporal_proximity_only');
}

{
    console.log('\nT04: extractSofaScoreSnapshot maps tick fields correctly');
    const tick = makeSofaTick('2025-01-01T12:00:00Z', {
        point: '40-30', gamesHome: 3, gamesAway: 2, setsHome: 1, setsAway: 0, serving: 'away'
    });
    const snap = extractSofaScoreSnapshot(tick);
    assert('T04-point', snap.point === '40-30', snap.point);
    assert('T04-gamesHome', snap.gamesHome === 3, String(snap.gamesHome));
    assert('T04-gamesAway', snap.gamesAway === 2, String(snap.gamesAway));
    assert('T04-setsHome', snap.totalSetsHome === 1, String(snap.totalSetsHome));
    assert('T04-server', snap.server === 'away', snap.server);
}

{
    console.log('\nT05: diffSofaScoreSnapshots detects all field changes');
    const base = extractSofaScoreSnapshot(makeSofaTick('2025-01-01T12:00:00Z', { point: '30-30', gamesHome: 2, gamesAway: 2, setsHome: 1, setsAway: 0, serving: 'home' }));
    const curr = extractSofaScoreSnapshot(makeSofaTick('2025-01-01T12:00:10Z', { point: '40-30', gamesHome: 2, gamesAway: 2, setsHome: 1, setsAway: 0, serving: 'home' }));
    const diff = diffSofaScoreSnapshots(base, curr);
    assert('T05-pointChanged', diff.pointChanged === true);
    assert('T05-gameChanged', diff.gameChanged === false);
    assert('T05-setChanged', diff.setChanged === false);
    assert('T05-serverChanged', diff.serverChanged === false);
    assert('T05-scoreChanged', diff.scoreChanged === true);
}

{
    console.log('\nT06: diffSofaScoreSnapshots with null inputs');
    const diff = diffSofaScoreSnapshots(null, null);
    assert('T06-pointChanged', diff.pointChanged === false);
    assert('T06-scoreChanged', diff.scoreChanged === false);
}

{
    console.log('\nT07: collectSofaEventsInWindow time-range filter');
    const ticks = [
        makeSofaTick('2025-01-01T12:00:00Z'), 
        makeSofaTick('2025-01-01T12:00:30Z'), 
        makeSofaTick('2025-01-01T12:01:00Z'), 
        makeSofaTick('2025-01-01T12:01:01Z'), 
        makeSofaTick('2025-01-01T12:03:00Z'), 
    ];
    const w60 = collectSofaEventsInWindow(ticks, '2025-01-01T12:00:00Z', 60);
    assert('T07-60s-count', w60.length === 2, String(w60.length));
    const w240 = collectSofaEventsInWindow(ticks, '2025-01-01T12:00:00Z', 240);
    assert('T07-240s-count', w240.length === 4, String(w240.length));
}

{
    console.log('\nT08: Baseline uses last tick at or before source event');
    const src = makeSourceEvent('2025-01-01T12:00:00Z');
    const ticks = [
        makeSofaTick('2025-01-01T11:59:00Z', { point: '15-0', gamesHome: 1 }),
        makeSofaTick('2025-01-01T11:59:50Z', { point: '30-0', gamesHome: 1 }),
        makeSofaTick('2025-01-01T12:00:30Z', { point: '40-0', gamesHome: 1 }) 
    ];
    const r = buildMarketLedObservationEvidence({ sourceMarketEvent: src, sofaTicks: ticks });
    const win60 = r.observationWindows[0];
    assert('T08-baseline-point', win60.baseline?.point === '30-0', win60.baseline?.point);
    assert('T08-dataQuality', win60.dataQuality === 'medium', win60.dataQuality);
}

{
    console.log('\nT09: dataQuality good when baseline + 2+ ticks in window');
    const src = makeSourceEvent('2025-01-01T12:00:00Z');
    const ticks = [
        makeSofaTick('2025-01-01T11:59:50Z', { point: '30-0' }),
        makeSofaTick('2025-01-01T12:00:20Z', { point: '40-0' }),
        makeSofaTick('2025-01-01T12:00:50Z', { point: '0-0', gamesHome: 1 })
    ];
    const r = buildMarketLedObservationEvidence({ sourceMarketEvent: src, sofaTicks: ticks });
    const win60 = r.observationWindows[0];
    assert('T09-dataQuality-good', win60.dataQuality === 'good', win60.dataQuality);
}

{
    console.log('\nT10: dataQuality poor when no ticks after source event');
    const src = makeSourceEvent('2025-01-01T12:05:00Z');
    const ticks = [
        makeSofaTick('2025-01-01T11:59:50Z', { point: '30-0' })
    ];
    const r = buildMarketLedObservationEvidence({ sourceMarketEvent: src, sofaTicks: ticks });
    const win60 = r.observationWindows[0];
    assert('T10-poor', win60.dataQuality === 'poor', win60.dataQuality);
    assert('T10-tickCount-0', win60.tickCount === 0, String(win60.tickCount));
    assert('T10-fieldEventFalse', win60.fieldEventObservedAfterFlow === false);
}

{
    console.log('\nT11: gameChanged detected when game score changes');
    const src = makeSourceEvent('2025-01-01T12:00:00Z');
    const ticks = [
        makeSofaTick('2025-01-01T11:59:50Z', { point: '40-0', gamesHome: 2, gamesAway: 1 }),
        makeSofaTick('2025-01-01T12:00:30Z', { point: '0-0',  gamesHome: 3, gamesAway: 1 })
    ];
    const r = buildMarketLedObservationEvidence({ sourceMarketEvent: src, sofaTicks: ticks });
    const win60 = r.observationWindows[0];
    assert('T11-gameChanged', win60.gameChanged === true, String(win60.gameChanged));
    assert('T11-scoreChangedAfterFlow', r.summary.scoreChangedAfterFlow === true);
    assert('T11-gameChangedAfterFlow', r.summary.gameChangedAfterFlow === true);
}

{
    console.log('\nT12: BREAK_POINT marker detected when receiver is at 40 and server is at 30');
    const src = makeSourceEvent('2025-01-01T12:00:00Z');
    const ticks = [
        makeSofaTick('2025-01-01T11:59:50Z', { point: '30-0' }),
        makeSofaTick('2025-01-01T12:00:20Z', { point: '30-40', serving: 'home', gamesHome: 2 }),
    ];
    const r = buildMarketLedObservationEvidence({ sourceMarketEvent: src, sofaTicks: ticks });
    const win60 = r.observationWindows[0];
    assert('T12-markersObserved', win60.relevantMarkersObserved.includes('BREAK_POINT'), JSON.stringify(win60.relevantMarkersObserved));
    assert('T12-sofaEventsCount', win60.sofaEventsObserved.length >= 1, String(win60.sofaEventsObserved.length));
    assert('T12-fieldEvent', win60.fieldEventObservedAfterFlow === true);
    assert('T12-summary-sofaEvents', r.summary.sofaEventsObserved.includes('BREAK_POINT'));
}

{
    console.log('\nT13: DEUCE marker detected at 40-40');
    const src = makeSourceEvent('2025-01-01T12:00:00Z');
    const ticks = [
        makeSofaTick('2025-01-01T11:59:50Z', { point: '30-30' }),
        makeSofaTick('2025-01-01T12:00:20Z', { point: '40-40', serving: 'home' })
    ];
    const r = buildMarketLedObservationEvidence({ sourceMarketEvent: src, sofaTicks: ticks });
    const win60 = r.observationWindows[0];
    assert('T13-deuce', win60.relevantMarkersObserved.includes('DEUCE'), JSON.stringify(win60.relevantMarkersObserved));
    assert('T13-fieldEvent', win60.fieldEventObservedAfterFlow === true);
}

{
    console.log('\nT14: flowAmbiguous from source event propagated to summary');
    const src = makeSourceEvent('2025-01-01T12:00:00Z', { flowAmbiguous: true, validVolume: false });
    const ticks = [
        makeSofaTick('2025-01-01T11:59:50Z', { point: '0-0' }),
        makeSofaTick('2025-01-01T12:00:30Z', { point: '15-0' })
    ];
    const r = buildMarketLedObservationEvidence({ sourceMarketEvent: src, sofaTicks: ticks });
    assert('T14-flowAmbiguous', r.summary.flowAmbiguous === true);
    assert('T14-largeFlowDetected', r.summary.largeFlowDetected === false);
    assert('T14-reason-ambiguous', r.summary.reasons.some(s => s.toLowerCase().includes('ambiguous')));
}

{
    console.log('\nT15: causalityClaimed is always false in all output sections');
    const src = makeSourceEvent('2025-01-01T12:00:00Z');
    const ticks = [
        makeSofaTick('2025-01-01T11:59:50Z'),
        makeSofaTick('2025-01-01T12:00:30Z', { point: '40-40', serving: 'home' })
    ];
    const r = buildMarketLedObservationEvidence({ sourceMarketEvent: src, sofaTicks: ticks });
    assert('T15-summary-causalityClaimed', r.summary.causalityClaimed === false);
    assert('T15-window-causalityClaimed', r.observationWindows.every(w => w.causalityClaimed === false));
    assert('T15-window-interpretation', r.observationWindows.every(w => w.interpretation === 'temporal_proximity_only'));
}


{
    console.log('\nT16: top-level contract shape');
    const src = makeSourceEvent('2025-01-01T12:00:00Z');
    const ticks = [
        makeSofaTick('2025-01-01T11:59:50Z', { point: '30-0' }),
        makeSofaTick('2025-01-01T12:00:30Z', { point: '40-0' })
    ];
    const r = buildMarketLedObservationEvidence({ sourceMarketEvent: src, sofaTicks: ticks });
    assert('T16-available', 'available' in r);
    assert('T16-sourceType', r.sourceType === 'large_market_flow', r.sourceType);
    assert('T16-sourceMarketEvent', r.sourceMarketEvent !== null && typeof r.sourceMarketEvent === 'object');
    assert('T16-config', r.config !== null && typeof r.config === 'object');
    assert('T16-config-windowsSec', Array.isArray(r.config.observationWindowsSec));
    assert('T16-config-includeCurrentGameContext', r.config.includeCurrentGameContext === true);
    assert('T16-observationWindows', Array.isArray(r.observationWindows));
    assert('T16-summary', r.summary !== null && typeof r.summary === 'object');
}

{
    console.log('\nT17: window shape complete with at least two ticks');
    const src = makeSourceEvent('2025-01-01T12:00:00Z');
    const ticks = [
        makeSofaTick('2025-01-01T11:59:50Z', { point: '30-0', gamesHome: 1 }),
        makeSofaTick('2025-01-01T12:00:20Z', { point: '40-0', gamesHome: 1 }),
        makeSofaTick('2025-01-01T12:00:50Z', { point: '0-0', gamesHome: 2 })
    ];
    const r = buildMarketLedObservationEvidence({ sourceMarketEvent: src, sofaTicks: ticks });
    const w = r.observationWindows[0];
    assert('T17-windowSec', typeof w.windowSec === 'number');
    assert('T17-windowStart', typeof w.windowStart === 'string');
    assert('T17-windowEnd', typeof w.windowEnd === 'string');
    assert('T17-sofaTicksObserved', w.sofaTicksObserved === w.tickCount, `${w.sofaTicksObserved} vs ${w.tickCount}`);
    assert('T17-firstSofaTickAt', typeof w.firstSofaTickAt === 'string');
    assert('T17-lastSofaTickAt', typeof w.lastSofaTickAt === 'string');
    assert('T17-firstScore', w.firstScore !== null && typeof w.firstScore === 'object');
    assert('T17-latestScore', w.latestScore !== null && typeof w.latestScore === 'object');
    assert('T17-latestPointState', 'latestPointState' in w);
    assert('T17-latestGameScore', 'latestGameScore' in w);
    assert('T17-latestSetScore', 'latestSetScore' in w);
    assert('T17-latestServer', 'latestServer' in w);
    assert('T17-baseline', 'baseline' in w);
    assert('T17-latestSnapshot', 'latestSnapshot' in w);
    assert('T17-pointChanged', 'pointChanged' in w);
    assert('T17-gameChanged', 'gameChanged' in w);
    assert('T17-setChanged', 'setChanged' in w);
    assert('T17-statusChanged', 'statusChanged' in w);
    assert('T17-serverChanged', 'serverChanged' in w);
    assert('T17-scoreChanged', 'scoreChanged' in w);
    assert('T17-sofaEventsObserved', Array.isArray(w.sofaEventsObserved));
    assert('T17-relevantMarkersObserved', Array.isArray(w.relevantMarkersObserved));
    assert('T17-fieldEventObservedAfterFlow', 'fieldEventObservedAfterFlow' in w);
    assert('T17-currentGameContext', w.currentGameContext !== null && typeof w.currentGameContext === 'object');
    assert('T17-dataQuality', 'dataQuality' in w);
    assert('T17-causalityClaimed', w.causalityClaimed === false);
    assert('T17-interpretation', w.interpretation === 'temporal_proximity_only');
    assert('T17-reasons', Array.isArray(w.reasons));
}

{
    console.log('\nT18: empty window has stable shape with zero/null/false values');
    const src = makeSourceEvent('2025-01-01T12:05:00Z');
    const ticks = [makeSofaTick('2025-01-01T11:59:50Z', { point: '30-0' })];
    const r = buildMarketLedObservationEvidence({ sourceMarketEvent: src, sofaTicks: ticks });
    const w = r.observationWindows[0];
    assert('T18-tickCount-0', w.tickCount === 0, String(w.tickCount));
    assert('T18-sofaTicksObserved-0', w.sofaTicksObserved === 0, String(w.sofaTicksObserved));
    assert('T18-firstSofaTickAt-null', w.firstSofaTickAt === null);
    assert('T18-lastSofaTickAt-null', w.lastSofaTickAt === null);
    assert('T18-firstScore-null', w.firstScore === null);
    assert('T18-latestScore-null', w.latestScore === null);
    assert('T18-latestPointState-null', w.latestPointState === null);
    assert('T18-latestGameScore-null', w.latestGameScore === null);
    assert('T18-latestSetScore-null', w.latestSetScore === null);
    assert('T18-latestServer-null', w.latestServer === null);
    assert('T18-latestSnapshot-null', w.latestSnapshot === null);
    assert('T18-pointChanged-false', w.pointChanged === false);
    assert('T18-gameChanged-false', w.gameChanged === false);
    assert('T18-sofaEventsObserved-empty', Array.isArray(w.sofaEventsObserved) && w.sofaEventsObserved.length === 0);
    assert('T18-relevantMarkersObserved-empty', Array.isArray(w.relevantMarkersObserved) && w.relevantMarkersObserved.length === 0);
    assert('T18-fieldEventFalse', w.fieldEventObservedAfterFlow === false);
    assert('T18-causalityClaimed-false', w.causalityClaimed === false);
    assert('T18-interpretation', w.interpretation === 'temporal_proximity_only');
    assert('T18-windowStart', typeof w.windowStart === 'string');
    assert('T18-windowEnd', typeof w.windowEnd === 'string');
}

{
    console.log('\nT19: summary.reasons includes exact message when no post-event ticks');
    const src = makeSourceEvent('2025-01-01T12:05:00Z');
    const ticks = [makeSofaTick('2025-01-01T11:59:50Z', { point: '30-0' })];
    const r = buildMarketLedObservationEvidence({ sourceMarketEvent: src, sofaTicks: ticks });
    assert('T19-reason', r.summary.reasons.includes('No SofaScore ticks found after source market event'),
        JSON.stringify(r.summary.reasons));
}

{
    console.log('\nT20: sanitize causalityClaimed without mutating input');
    const src = makeSourceEvent('2025-01-01T12:00:00Z', { causalityClaimed: true });
    const ticks = [
        makeSofaTick('2025-01-01T11:59:50Z', { point: '0-0' }),
        makeSofaTick('2025-01-01T12:00:30Z', { point: '15-0' })
    ];
    const r = buildMarketLedObservationEvidence({ sourceMarketEvent: src, sofaTicks: ticks });
    assert('T20-input-not-mutated', src.causalityClaimed === true, `input was mutated: ${src.causalityClaimed}`);
    assert('T20-output-causalityClaimed-false', r.sourceMarketEvent.causalityClaimed === false,
        String(r.sourceMarketEvent.causalityClaimed));
}

{
    console.log('\nT21: server fallback from isServing — home and away');
    const src = makeSourceEvent('2025-01-01T12:00:00Z');
    const makeTickIsServing = (ts, servingSide) => ({
        timestamp: ts,
        data: {
            source: 'sofa',
            seq: 1,
            score: { point: '0-0', games: { home: 0, away: 0 }, totalSetsHome: 0, totalSetsAway: 0 },
            status: { type: 'inprogress', description: 'In progress' },
            players: {
                home: { name: 'Alice', isServing: servingSide === 'home' },
                away: { name: 'Bob', isServing: servingSide === 'away' }
            }
        }
    });

    const ticksHome = [
        makeTickIsServing('2025-01-01T11:59:50Z', 'home'),
        makeTickIsServing('2025-01-01T12:00:30Z', 'home')
    ];
    const rHome = buildMarketLedObservationEvidence({ sourceMarketEvent: src, sofaTicks: ticksHome });
    const snapHome = rHome.observationWindows[0].latestSnapshot;
    assert('T21-server-home', snapHome?.server === 'home', String(snapHome?.server));

    const ticksAway = [
        makeTickIsServing('2025-01-01T11:59:50Z', 'away'),
        makeTickIsServing('2025-01-01T12:00:30Z', 'away')
    ];
    const rAway = buildMarketLedObservationEvidence({ sourceMarketEvent: src, sofaTicks: ticksAway });
    const snapAway = rAway.observationWindows[0].latestSnapshot;
    assert('T21-server-away', snapAway?.server === 'away', String(snapAway?.server));

    const ticksNone = [
        makeTickIsServing('2025-01-01T11:59:50Z', null),
        makeTickIsServing('2025-01-01T12:00:30Z', null)
    ];
    const rNone = buildMarketLedObservationEvidence({ sourceMarketEvent: src, sofaTicks: ticksNone });
    const snapNone = rNone.observationWindows[0].latestSnapshot;
    assert('T21-server-null', snapNone?.server === null, String(snapNone?.server));
}

{
    console.log('\nT22: currentGameContext disabled when includeCurrentGameContext: false');
    const src = makeSourceEvent('2025-01-01T12:00:00Z');
    const ticks = [
        makeSofaTick('2025-01-01T11:59:50Z', { point: '0-0' }),
        makeSofaTick('2025-01-01T12:00:30Z', { point: '15-0' })
    ];
    const r = buildMarketLedObservationEvidence({
        sourceMarketEvent: src,
        sofaTicks: ticks,
        config: { includeCurrentGameContext: false }
    });
    assert('T22-config-false', r.config.includeCurrentGameContext === false, String(r.config.includeCurrentGameContext));
    for (const w of r.observationWindows) {
        assert('T22-window-disabled', w.currentGameContext?.available === false &&
            w.currentGameContext?.source === 'disabled',
            JSON.stringify(w.currentGameContext));
    }
}


console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);
if (failed > 0) process.exit(1);
