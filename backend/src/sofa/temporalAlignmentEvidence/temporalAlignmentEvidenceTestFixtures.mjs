export const NOW = new Date('2026-06-19T12:10:00.000Z');

export function makeSofaTick(ts, point, gamesHome, gamesAway, totalSetsHome, totalSetsAway, statusType, serving, seq) {
    return {
        timestamp: ts,
        data: {
            source: 'sofa',
            seq: seq ?? null,
            serving: serving ?? null,
            score: {
                point,
                games: { home: gamesHome, away: gamesAway },
                totalSetsHome,
                totalSetsAway
            },
            status: { type: statusType ?? 'inprogress', description: statusType ?? 'inprogress' },
            players: { home: { name: 'HomePlayer' }, away: { name: 'AwayPlayer' } }
        }
    };
}

export function makeBetfairTick(ts, runnerName, ltp, bestBack, bestLay, matchedTotal, mfBack, mfLay, mfTrend, runnerDelta, marketDelta, mfConfidence, seq) {
    return {
        timestamp: ts,
        data: {
            seq: seq ?? null,
            graphHealth: { status: 'ok' },
            market: { totalMatched: matchedTotal ?? 0 },
            runners: [{
                name: runnerName,
                selectionId: 1,
                lastTradedPrice: ltp ?? null,
                bestBack: bestBack ?? null,
                bestLay: bestLay ?? null,
                matchedTotal: matchedTotal ?? null,
                ladderSource: 'graph',
                ladder: [{ price: ltp, traded: 10 }],
                moneyFlow: {
                    back: mfBack ?? 0,
                    lay: mfLay ?? 0,
                    trend: mfTrend ?? 'neutral',
                    runnerDelta: runnerDelta ?? 0,
                    marketDelta: marketDelta ?? 0,
                    confidence: mfConfidence ?? 'confirmed'
                }
            }]
        }
    };
}

export function createAssertionSuite(scope) {
    let passed = 0;
    let failed = 0;

    function assert(label, condition, detail = '') {
        if (condition) {
            console.log(`  ✓ ${label}`);
            passed += 1;
        } else {
            console.error(`  ✗ FAIL: ${label}${detail ? ' — ' + detail : ''}`);
            failed += 1;
        }
    }

    function finish() {
        console.log(`\n=== ${scope}: ${passed} passed, ${failed} failed ===`);
        if (failed > 0) {
            throw new Error(`${failed} ${scope} assertions failed`);
        }
    }

    return { assert, finish };
}
