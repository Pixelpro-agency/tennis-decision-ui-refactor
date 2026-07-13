import { findMatchingRunner, toNum, ladderTop3Sum, getValidBetfairTicks, hasUsablePrice, hasUsableLadder, hasUsableMoneyFlow, isFinishedOrEmptyTick, tickTimestampMs } from './helpers.js';
import { buildTargetContext } from './marketEvidence/targetContext.js';
import { buildTargetSignals } from './marketEvidence/targetSignals.js';

export function buildMarketEvidence(betfairTimeline, snapshot, eventId) {
    const defaultUnavailable = (reason) => ({
        available: false,
        reason,
        market: null,
        targetRunner: null,
        runners: [],
        miniSeries: [],
        confidence: {
            level: 'low',
            score: 0,
            reasons: ['No Betfair market evidence available']
        },
        dataQuality: {
            hasBetfairTimeline: false,
            validTicks: 0,
            hasLadder: false,
            hasMoneyFlow: false,
            hasPrices: false,
            latestTickSeq: null,
            latestUsablePriceSeq: null,
            latestUsableLadderSeq: null,
            latestUsableMoneyFlowSeq: null,
            usingStalePrice: false,
            usingStaleLadder: false,
            usingStaleMoneyFlow: false,
            staleSeconds: 0,
            marketProbablyFinished: false,
            warnings: []
        }
    });

    if (!betfairTimeline) {
        return defaultUnavailable('BETFAIR_TIMELINE_NOT_AVAILABLE');
    }

    const validTicks = getValidBetfairTicks(betfairTimeline);
    if (validTicks.length === 0) {
        return defaultUnavailable('BETFAIR_TIMELINE_NOT_AVAILABLE');
    }

    if (validTicks.length < 2) {
        return defaultUnavailable('NOT_ENOUGH_BETFAIR_TICKS');
    }

    const window = validTicks.slice(-10);
    const firstTickEntry = window[0];
    const firstTick = firstTickEntry.data;
    const lastTickEntry = window[window.length - 1];
    const lastTick = lastTickEntry.data;

    const market = lastTick.market || {};
    const marketId = market.marketId || null;
    const lastTotalMatched = toNum(market.totalMatched, 0);
    const firstTotalMatched = toNum(firstTick.market?.totalMatched, 0);
    const totalMatchedDelta = lastTotalMatched - firstTotalMatched;

    const targetContext = buildTargetContext({
        snapshot,
        firstTickEntry,
        lastTickEntry,
        window,
        validTicks
    });

    if (!targetContext.available) {
        const dq = defaultUnavailable(targetContext.reason);
        dq.dataQuality.hasBetfairTimeline = true;
        dq.dataQuality.validTicks = validTicks.length;
        dq.dataQuality.latestTickSeq = targetContext.latestTickSeq;
        dq.dataQuality.warnings.push(...targetContext.warnings);
        return dq;
    }

    const {
        warnings,
        targetRole,
        targetSofaName,
        latestPrice,
        latestLadder,
        latestMoneyFlow,
        usingStalePrice,
        usingStaleLadder,
        usingStaleMoneyFlow,
        priceRunner,
        ladderRunner,
        moneyFlowRunner,
        firstTargetRunner,
        hasLadder,
        hasMoneyFlow,
        hasPrices
    } = targetContext;
    const {
        priceDelta,
        priceDeltaPct,
        lastMatchedTotal,
        matchedDelta,
        volumeAcceleration,
        backTop3,
        layTop3,
        imbalance,
        liquidityLabel,
        pressureScore,
        pressureSide,
        pressureLabel
    } = buildTargetSignals({
        warnings,
        targetSofaName,
        priceRunner,
        ladderRunner,
        moneyFlowRunner,
        firstTargetRunner,
        hasMoneyFlow,
        hasPrices,
        window
    });

    const marketProbablyFinished = isFinishedOrEmptyTick(lastTick);
    if (marketProbablyFinished) {
        warnings.push('Market probably finished or latest tick is empty.');
    }

    const lastTs = tickTimestampMs(lastTickEntry);
    const priceTs = tickTimestampMs(latestPrice?.tick);
    const ladderTs = tickTimestampMs(latestLadder?.tick);
    const moneyFlowTs = tickTimestampMs(latestMoneyFlow?.tick);
    let staleSeconds = 0;
    if (lastTs !== null) {
        const candidates = [];
        if (usingStalePrice && priceTs !== null) candidates.push((lastTs - priceTs) / 1000);
        if (usingStaleLadder && ladderTs !== null) candidates.push((lastTs - ladderTs) / 1000);
        if (usingStaleMoneyFlow && moneyFlowTs !== null) candidates.push((lastTs - moneyFlowTs) / 1000);
        staleSeconds = candidates.length > 0 ? Math.max(...candidates) : 0;
    }

    let confidenceScore = 100;
    const confidenceReasons = [];
    if (validTicks.length < 5) {
        confidenceScore -= 30;
        confidenceReasons.push('Fewer than 5 valid ticks');
    }
    if (usingStalePrice) {
        confidenceScore -= 25;
        confidenceReasons.push('Using stale price tick');
    }
    if (usingStaleLadder) {
        confidenceScore -= 20;
        confidenceReasons.push('Using stale ladder tick');
    }
    if (!hasMoneyFlow) {
        confidenceScore -= 15;
        confidenceReasons.push('No usable money flow');
    } else if (usingStaleMoneyFlow) {
        confidenceScore -= 15;
        confidenceReasons.push('Using stale money flow tick');
    }
    if (marketProbablyFinished) {
        confidenceScore -= 20;
        confidenceReasons.push('Market probably finished');
    }
    confidenceScore = Math.max(0, Math.min(100, confidenceScore));
    const confidenceLevel = confidenceScore >= 75 ? 'high' : confidenceScore >= 45 ? 'medium' : 'low';

    const runnersSummary = (lastTick.runners || [])
        .slice(0, 2)
        .map(r => {
            const firstR = findMatchingRunner(r.name, firstTick.runners);
            const rLtp = toNum(r.lastTradedPrice, null);
            const rFirstLtp = toNum(firstR?.lastTradedPrice, null);
            const rPriceDelta = rLtp !== null && rFirstLtp !== null ? rLtp - rFirstLtp : null;

            return {
                name: r.name,
                selectionId: r.selectionId,
                lastTradedPrice: rLtp,
                bestBack: toNum(r.bestBack, null),
                bestLay: toNum(r.bestLay, null),
                matchedTotal: toNum(r.matchedTotal, null),
                matchedDelta: firstR !== null ? toNum(r.matchedTotal, 0) - toNum(firstR.matchedTotal, 0) : null,
                wom: toNum(r.wom, null),
                moneyFlowTrend: r.moneyFlow?.trend || null,
                priceDelta: rPriceDelta,
                hasUsablePrice: hasUsablePrice(r),
                hasUsableLadder: hasUsableLadder(r),
                hasUsableMoneyFlow: hasUsableMoneyFlow(r)
            };
        });

    const miniSeries = window.map(t => ({
        seq: t.data.seq,
        ts: t.data.ts || t.timestamp,
        elapsedSeconds: t.elapsedSeconds,
        totalMatched: toNum(t.data.market?.totalMatched, null),
        runners: (t.data.runners || [])
            .slice(0, 2)
            .map(r => ({
                name: r.name,
                lastTradedPrice: toNum(r.lastTradedPrice, null),
                bestBack: toNum(r.bestBack, null),
                bestLay: toNum(r.bestLay, null),
                matchedTotal: toNum(r.matchedTotal, null),
                wom: toNum(r.wom, null),
                moneyFlowTrend: r.moneyFlow?.trend || null,
                hasUsablePrice: hasUsablePrice(r),
                hasUsableLadder: hasUsableLadder(r),
                hasUsableMoneyFlow: hasUsableMoneyFlow(r)
            }))
    }));

    return {
        available: true,
        reason: null,
        market: {
            marketId,
            totalMatched: lastTotalMatched,
            totalMatchedDelta,
            ticksUsed: window.length,
            lastUpdatedAt: lastTick.timestamp || null
        },
        targetRunner: {
            name: priceRunner.name,
            role: targetRole,
            selectionId: priceRunner.selectionId,
            lastTradedPrice: toNum(priceRunner.lastTradedPrice, null),
            bestBack: toNum(priceRunner.bestBack, null),
            bestBackSize: toNum(priceRunner.bestBackSize, null),
            bestLay: toNum(priceRunner.bestLay, null),
            bestLaySize: toNum(priceRunner.bestLaySize, null),
            matchedTotal: lastMatchedTotal,
            matchedDelta,
            wom: toNum(moneyFlowRunner.wom, null),
            moneyFlow: moneyFlowRunner.moneyFlow || null,
            priceDelta,
            priceDeltaPct,
            liquidity: {
                backTop3,
                layTop3,
                imbalance,
                label: liquidityLabel
            },
            volumeAcceleration,
            pressure: {
                side: pressureSide,
                score: pressureScore,
                label: pressureLabel
            }
        },
        runners: runnersSummary,
        miniSeries,
        confidence: {
            level: confidenceLevel,
            score: confidenceScore,
            reasons: confidenceReasons
        },
        dataQuality: {
            hasBetfairTimeline: true,
            validTicks: validTicks.length,
            hasLadder,
            hasMoneyFlow,
            hasPrices,
            latestTickSeq: lastTick.seq ?? null,
            latestUsablePriceSeq: latestPrice?.tick?.data?.seq ?? null,
            latestUsableLadderSeq: latestLadder?.tick?.data?.seq ?? null,
            latestUsableMoneyFlowSeq: latestMoneyFlow?.tick?.data?.seq ?? null,
            usingStalePrice,
            usingStaleLadder,
            usingStaleMoneyFlow,
            staleSeconds,
            marketProbablyFinished,
            warnings
        }
    };
}