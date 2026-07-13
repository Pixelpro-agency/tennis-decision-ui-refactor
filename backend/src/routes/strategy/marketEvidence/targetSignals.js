import { findMatchingRunner, toNum, ladderTop3Sum } from '../helpers.js';

export function buildTargetSignals({
    warnings,
    targetSofaName,
    priceRunner,
    ladderRunner,
    moneyFlowRunner,
    firstTargetRunner,
    hasMoneyFlow,
    hasPrices,
    window
}) {
    let priceDelta = 0;
    let priceDeltaPct = 0;
    let priceUsedForDelta = 'lastTradedPrice';

    const firstLtp = toNum(firstTargetRunner?.lastTradedPrice, null);
    const lastLtp = toNum(priceRunner.lastTradedPrice, null);

    if (firstLtp !== null && lastLtp !== null) {
        priceDelta = lastLtp - firstLtp;
        priceDeltaPct = firstLtp !== 0 ? (priceDelta / firstLtp) * 100 : 0;
    } else {
        const firstFallback = toNum(firstTargetRunner?.bestLay, toNum(firstTargetRunner?.bestBack, null));
        const lastFallback = toNum(priceRunner.bestLay, toNum(priceRunner.bestBack, null));
        if (firstFallback !== null && lastFallback !== null) {
            priceDelta = lastFallback - firstFallback;
            priceDeltaPct = firstFallback !== 0 ? (priceDelta / firstFallback) * 100 : 0;
            priceUsedForDelta = 'bestLay/bestBack fallback';
            warnings.push(`LTP missing, priceDelta computed from ${priceUsedForDelta}`);
        } else {
            warnings.push('Unable to compute priceDelta: no price data');
        }
    }

    const lastMatchedTotal = toNum(priceRunner.matchedTotal, 0);
    const firstMatchedTotal = toNum(firstTargetRunner?.matchedTotal, 0);
    const matchedDelta = lastMatchedTotal - firstMatchedTotal;

    let volumeAcceleration = { value: 0, label: 'flat' };
    const mid = Math.floor(window.length / 2);

    const matchedInWindow = window
        .map(t => {
            const r = findMatchingRunner(targetSofaName, t.data.runners);
            return toNum(r?.matchedTotal, 0);
        })
        .filter(n => n !== null);

    if (matchedInWindow.length >= 2) {
        const firstHalfDelta = matchedInWindow[matchedInWindow.length - 1] - matchedInWindow[0];
        const secondHalfStart = matchedInWindow[Math.max(0, matchedInWindow.length - 1 - mid)];
        const secondHalfDelta = matchedInWindow[matchedInWindow.length - 1] - secondHalfStart;

        if (secondHalfDelta > firstHalfDelta * 1.2) {
            volumeAcceleration = { value: secondHalfDelta - firstHalfDelta, label: 'accelerating' };
        } else if (secondHalfDelta < firstHalfDelta * 0.8) {
            volumeAcceleration = { value: secondHalfDelta - firstHalfDelta, label: 'decelerating' };
        } else {
            volumeAcceleration = { value: secondHalfDelta - firstHalfDelta, label: 'flat' };
        }
    }

    const backTop3 = ladderTop3Sum(ladderRunner.ladder, 'back');
    const layTop3 = ladderTop3Sum(ladderRunner.ladder, 'lay');
    const liquidityTotal = backTop3 + layTop3;
    const imbalance = liquidityTotal > 0 ? (backTop3 - layTop3) / liquidityTotal : 0;

    let liquidityLabel = 'balanced';
    if (liquidityTotal === 0) {
        liquidityLabel = 'unavailable';
    } else if (imbalance > 0.25) {
        liquidityLabel = 'back-heavy';
    } else if (imbalance < -0.25) {
        liquidityLabel = 'lay-heavy';
    }

    const trend = moneyFlowRunner.moneyFlow?.trend || 'neutral';
    const wom = toNum(moneyFlowRunner.wom, 0.5);
    let pressureScore = 0;

    if (trend === 'backing') pressureScore += 30;
    if (trend === 'laying') pressureScore -= 30;
    if (wom > 0.6) pressureScore += 20;
    if (wom < 0.4) pressureScore -= 20;
    if (priceDelta < -0.05) pressureScore += 20;
    if (priceDelta > 0.05) pressureScore -= 20;
    if (matchedDelta > 0) pressureScore += 10;

    pressureScore = Math.max(-100, Math.min(100, pressureScore));

    let pressureLabel = 'mixed market pressure';
    let pressureSide = 'neutral';
    if (!hasPrices || !hasMoneyFlow) {
        pressureLabel = 'market data weak';
        pressureSide = 'neutral';
    } else if (pressureScore >= 30) {
        pressureLabel = 'market backing runner';
        pressureSide = 'back';
    } else if (pressureScore <= -30) {
        pressureLabel = 'market laying runner';
        pressureSide = 'lay';
    }
    return {
        priceDelta,
        priceDeltaPct,
        priceUsedForDelta,
        lastMatchedTotal,
        matchedDelta,
        volumeAcceleration,
        backTop3,
        layTop3,
        liquidityTotal,
        imbalance,
        liquidityLabel,
        pressureScore,
        pressureSide,
        pressureLabel
    };
}
