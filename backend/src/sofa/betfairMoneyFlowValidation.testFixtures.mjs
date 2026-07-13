export const GRID_SIZE = 20;

export const stubLadder = [{ price: 1.5, back: 100, lay: 80, traded: 1000 }];

export const stubOpts = {
    currentLadderSource: 'graph_url',
    previousLadderSource: 'graph_url',
    currentLadder: stubLadder,
    previousLadder: [{ price: 1.5, back: 100, lay: 80, traded: 900 }],
    lastTradedPrice: 1.5,
    midPrice: 1.5
};

export function buildSharedGrid(histories) {
    const seen = new Set();
    const allTs = [];
    for (const hist of Object.values(histories)) {
        for (const pt of hist) {
            if (pt.timestamp && !seen.has(pt.timestamp)) {
                seen.add(pt.timestamp);
                allTs.push(pt.timestamp);
            }
        }
    }
    allTs.sort((a, b) => a.localeCompare(b));
    const realTs = allTs.slice(-GRID_SIZE);
    const pad = GRID_SIZE - realTs.length;
    const empty = Array.from({ length: pad }, (_, k) => ({ key: `__empty_${k}`, timestamp: '' }));
    return [...empty, ...realTs.map(ts => ({ key: ts, timestamp: ts }))];
}

export function alignToGrid(grid, runnerHistory) {
    const byTs = new Map();
    for (const pt of (runnerHistory || [])) {
        if (pt.timestamp) byTs.set(pt.timestamp, pt);
    }
    return grid.map(slot => {
        if (!slot.timestamp) {
            return {
                timestamp: '',
                back: 0,
                lay: 0,
                unclassified: 0,
                suppressedVolume: 0,
                classifiedVolume: 0,
                emptySlot: true,
                invalidVolume: false,
                anomaly: false,
                validForDisplay: false
            };
        }
        return byTs.get(slot.timestamp) || {
            timestamp: slot.timestamp,
            back: 0,
            lay: 0,
            unclassified: 0,
            suppressedVolume: 0,
            classifiedVolume: 0,
            emptySlot: true,
            invalidVolume: false,
            anomaly: false,
            validForDisplay: false
        };
    });
}

let passed = 0;
let failed = 0;

export function test(name, fn) {
    try {
        fn();
        console.log(`  ✓ ${name}`);
        passed++;
    } catch (err) {
        console.error(`  ✗ ${name}`);
        console.error(`    ${err.message}`);
        failed++;
    }
}

export function finish() {
    console.log(`\n${'─'.repeat(60)}`);
    console.log(`Results: ${passed} passed, ${failed} failed`);
    if (failed > 0) {
        console.error('\nSome tests failed.');
        process.exit(1);
    } else {
        console.log('\nAll tests passed.');
    }
}
