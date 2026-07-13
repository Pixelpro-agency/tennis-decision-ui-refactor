export const NOW = new Date('2026-06-19T12:10:00.000Z');

export function makeTick(ts, marketTotal, runnerList, seq) {
    return {
        timestamp: ts,
        data: {
            seq: seq ?? null,
            graphHealth: { status: 'ok' },
            market: { totalMatched: marketTotal ?? 0 },
            runners: runnerList.map(r => ({
                name: r.name ?? 'Runner',
                selectionId: r.selectionId ?? 1,
                lastTradedPrice: r.ltp ?? null,
                bestBack: r.bestBack ?? null,
                bestLay: r.bestLay ?? null,
                matchedTotal: r.matchedTotal ?? null,
                ladderSource: r.ladderSource ?? 'graph',
                moneyFlow: {
                    back: r.mfBack ?? 0,
                    lay: r.mfLay ?? 0,
                    trend: r.mfTrend ?? 'neutral',
                    runnerDelta: r.runnerDelta ?? 0,
                    marketDelta: r.marketDelta ?? 0,
                    confidence: r.mfConfidence ?? 'confirmed',
                    reason: r.mfReason ?? null
                }
            }))
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
