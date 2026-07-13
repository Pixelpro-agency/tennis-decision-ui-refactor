import { extractSofaScoreSnapshot } from './snapshot.js';
import { buildObservationWindow } from './observationWindow.js';

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

console.log('\n=== observationWindow.test.mjs ===\n');

const results = [];

{
    const result = buildObservationWindow({
        sourceTs: new Date('2025-01-01T12:00:00Z'),
        windowSec: 60,
        windowTicks: [],
        baseline: null,
        hasBaseline: false,
        now: new Date('2025-01-01T12:01:00Z')
    });
    results.push(result);
    assert('T01-no-ticks-count', result.tickCount === 0, String(result.tickCount));
    assert('T01-no-ticks-quality', result.dataQuality === 'poor', result.dataQuality);
    assert('T01-no-ticks-causality', result.causalityClaimed === false);
}

{
    const baselineTick = makeSofaTick('2025-01-01T11:59:50Z', { point: '15-0' });
    const windowTick = makeSofaTick('2025-01-01T12:00:20Z', { point: '30-0' });
    const result = buildObservationWindow({
        sourceTs: new Date('2025-01-01T12:00:00Z'),
        windowSec: 60,
        windowTicks: [windowTick],
        baseline: extractSofaScoreSnapshot(baselineTick),
        hasBaseline: true,
        now: new Date('2025-01-01T12:01:00Z')
    });
    results.push(result);
    assert('T02-point-changed', result.pointChanged === true, String(result.pointChanged));
    assert('T02-score-changed', result.scoreChanged === true, String(result.scoreChanged));
    assert('T02-quality-medium', result.dataQuality === 'medium', result.dataQuality);
}

{
    const baselineTick = makeSofaTick('2025-01-01T11:59:50Z', { point: '30-0' });
    const windowTick = makeSofaTick('2025-01-01T12:00:20Z', { point: '30-40', serving: 'home', gamesHome: 2 });
    const result = buildObservationWindow({
        sourceTs: new Date('2025-01-01T12:00:00Z'),
        windowSec: 60,
        windowTicks: [windowTick],
        baseline: extractSofaScoreSnapshot(baselineTick),
        hasBaseline: true,
        now: new Date('2025-01-01T12:01:00Z')
    });
    results.push(result);
    assert('T03-break-point', result.relevantMarkersObserved.includes('BREAK_POINT'), JSON.stringify(result.relevantMarkersObserved));
    assert('T03-field-event', result.fieldEventObservedAfterFlow === true, String(result.fieldEventObservedAfterFlow));
}

{
    const baselineTick = makeSofaTick('2025-01-01T11:59:50Z', { point: '30-0' });
    const firstTick = makeSofaTick('2025-01-01T12:00:20Z', { point: '40-0' });
    const secondTick = makeSofaTick('2025-01-01T12:00:50Z', { point: '0-0', gamesHome: 1 });
    const result = buildObservationWindow({
        sourceTs: new Date('2025-01-01T12:00:00Z'),
        windowSec: 60,
        windowTicks: [firstTick, secondTick],
        baseline: extractSofaScoreSnapshot(baselineTick),
        hasBaseline: true,
        now: new Date('2025-01-01T12:01:00Z')
    });
    results.push(result);
    assert('T04-quality-good', result.dataQuality === 'good', result.dataQuality);
    assert('T04-game-changed', result.gameChanged === true, String(result.gameChanged));
}

assert('T05-causality-always-false', results.every(result => result.causalityClaimed === false));

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);
if (failed > 0) process.exit(1);
