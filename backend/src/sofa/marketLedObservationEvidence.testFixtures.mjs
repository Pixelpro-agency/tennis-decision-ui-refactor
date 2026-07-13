let passed = 0;
let failed = 0;

export function assert(label, condition, detail) {
    if (condition) {
        console.log(`  PASS [${label}]`);
        passed++;
    } else {
        console.error(`  FAIL [${label}]${detail ? ': ' + detail : ''}`);
        failed++;
    }
}

export function makeSofaTick(ts, scoreOpts = {}, players = { home: 'Alice', away: 'Bob' }, seq = 1) {
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

export function makeSourceEvent(ts, overrides = {}) {
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

export function finish(scope = 'marketLedObservationEvidence.test.mjs') {
    console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);
    if (failed > 0) process.exit(1);
}
