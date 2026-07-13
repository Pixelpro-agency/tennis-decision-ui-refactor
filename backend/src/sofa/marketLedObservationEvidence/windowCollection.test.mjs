import { parseTs, mergeConfig, collectSofaEventsInWindow } from './windowCollection.js';

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

function makeTick(timestamp) {
    return { timestamp, data: {} };
}

console.log('\n=== windowCollection.test.mjs ===\n');

{
    const valid = parseTs('2025-01-01T12:00:00Z');
    assert('T01-valid-timestamp', valid instanceof Date && valid.toISOString() === '2025-01-01T12:00:00.000Z');
    assert('T01-invalid-timestamp', parseTs('not-a-date') === null);
    assert('T01-empty-timestamp', parseTs(null) === null);
}

{
    const defaultConfig = mergeConfig({});
    const customConfig = mergeConfig({ observationWindowsSec: [30, 90] });
    assert('T02-default-windows', JSON.stringify(defaultConfig.observationWindowsSec) === JSON.stringify([60, 120, 180, 240]));
    assert('T02-custom-windows', JSON.stringify(customConfig.observationWindowsSec) === JSON.stringify([30, 90]));
    assert('T02-null-defaults', JSON.stringify(mergeConfig({ observationWindowsSec: null }).observationWindowsSec) === JSON.stringify([60, 120, 180, 240]));
}

{
    const ticks = [
        makeTick('2025-01-01T12:00:00Z'),
        makeTick('2025-01-01T12:00:30Z'),
        makeTick('2025-01-01T12:01:00Z'),
        makeTick('2025-01-01T12:01:01Z'),
        makeTick('2025-01-01T12:03:00Z'),
        makeTick('invalid')
    ];
    const w60 = collectSofaEventsInWindow(ticks, '2025-01-01T12:00:00Z', 60);
    const w240 = collectSofaEventsInWindow(ticks, '2025-01-01T12:00:00Z', 240);
    assert('T03-60s-count', w60.length === 2, String(w60.length));
    assert('T03-60s-boundary-inclusive', w60[1]?.timestamp === '2025-01-01T12:01:00Z', w60[1]?.timestamp);
    assert('T03-240s-count', w240.length === 4, String(w240.length));
    assert('T03-invalid-afterTs', collectSofaEventsInWindow(ticks, 'invalid', 60).length === 0);
}

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);
if (failed > 0) process.exit(1);
