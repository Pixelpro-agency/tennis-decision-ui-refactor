export function buildMarketFlowSummary(runnersWithFlow, marketMatchedDelta) {
    const empty = {
        available: false,
        reliable: false,
        totalMarketMatchedDelta: null,
        runnersWithFlow: 0,
        runnersConfirmedByPrice: 0,
        bothRunnersSameRawDirection: false,
        dominantRunner: null,
        interpretation: 'unavailable',
        ambiguityReasons: []
    };

    if (!Array.isArray(runnersWithFlow) || runnersWithFlow.length === 0) return empty;

    const available = runnersWithFlow.filter(r => r.flowEvidence?.available);
    if (available.length === 0) return empty;

    const reliable = available.filter(r => r.flowEvidence?.reliable);
    const confirmedByPrice = reliable.filter(r => r.flowEvidence?.confirmedByPrice);
    const ambiguityReasons = [];

    const directionalRunners = reliable.filter(r => {
        const t = r.flowEvidence.rawTrend;
        return t === 'backing' || t === 'laying';
    });
    let bothRunnersSameRawDirection = false;
    if (directionalRunners.length >= 2) {
        const trends = directionalRunners.map(r => r.flowEvidence.rawTrend);
        const allSame = trends.every(t => t === trends[0]);
        if (allSame) {
            bothRunnersSameRawDirection = true;
            ambiguityReasons.push(
                'Both runners show same raw moneyFlow direction; exchange flow may reflect hedging, market making, scalping or cross-market positioning'
            );
        }
    }

    let dominantRunner = null;
    let maxVolume = -Infinity;
    for (const r of reliable) {
        const fe = r.flowEvidence;
        const vol = fe.runnerMatchedDelta ?? ((fe.moneyFlowBack ?? 0) + (fe.moneyFlowLay ?? 0));
        if (vol > maxVolume) {
            maxVolume = vol;
            dominantRunner = r;
        }
    }

    let dominantBlock = null;
    if (dominantRunner) {
        const fe = dominantRunner.flowEvidence;
        dominantBlock = {
            name: dominantRunner.name,
            selectionId: dominantRunner.selectionId ?? null,
            runnerMatchedDelta: fe.runnerMatchedDelta,
            rawTrend: fe.rawTrend,
            priceMoveDirection: fe.priceMove?.direction || 'unknown',
            confirmedByPrice: fe.confirmedByPrice
        };
    }

    let interpretation = 'ambiguous_exchange_flow';
    const confirmedCount = confirmedByPrice.length;

    if (reliable.length === 0) {
        interpretation = 'unavailable';
    } else if (bothRunnersSameRawDirection) {
        interpretation = 'ambiguous_exchange_flow';
    } else if (confirmedCount === 0 && reliable.length > 0) {
        interpretation = 'ambiguous_exchange_flow';
        ambiguityReasons.push('Exchange flow is ambiguous; matched volume does not reveal trader intent');
    } else if (confirmedCount > 0) {
        interpretation = 'ambiguous_exchange_flow';
        if (confirmedCount === 1 && reliable.length === 1) {
            const fe = confirmedByPrice[0]?.flowEvidence;
            if (fe?.interpretation === 'volume_with_price_shortening') interpretation = 'volume_with_price_shortening';
            else if (fe?.interpretation === 'volume_with_price_drifting') interpretation = 'volume_with_price_drifting';
        }
    }

    const totalDelta = typeof marketMatchedDelta === 'number' ? marketMatchedDelta : null;

    return {
        available: true,
        reliable: reliable.length > 0,
        totalMarketMatchedDelta: totalDelta,
        runnersWithFlow: reliable.length,
        runnersConfirmedByPrice: confirmedCount,
        bothRunnersSameRawDirection,
        dominantRunner: dominantBlock,
        interpretation,
        ambiguityReasons
    };
}
