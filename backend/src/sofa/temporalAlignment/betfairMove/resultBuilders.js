import { isBookTradable, roundN } from './primitives.js';

export function buildInvalidBetfairMoveResult({
    cur,
    curRunner,
    toPrice,
    fromPrice,
    priceSource,
    priceDelta,
    priceDirection,
    timestamp,
    age,
    runnerMatchedDelta,
    marketMatchedDelta,
    mfReason,
    volumeValidationReasons
}) {
    const graphHealth = curRunner.data?.graphHealth?.status ||
        cur.data?.graphHealth?.status || null;
    const ladderSource = curRunner.ladderSource || null;
    const tradable = isBookTradable(curRunner);
    const priceDeltaPct = (fromPrice && fromPrice !== 0 && priceDelta !== null)
        ? roundN((priceDelta / fromPrice) * 100, 2)
        : null;

    const reasons = [];
    if (!tradable) reasons.push('Book not tradable at time of move');
    reasons.push('Volume invalidated by TotalMatched gate');

    return {
        available: true,
        timestamp,
        ageSec: age !== null ? Math.round(age) : null,
        seq: cur.data?.seq ?? null,
        runner: curRunner.name || null,
        selectionId: curRunner.selectionId ?? null,
        fromPrice,
        toPrice,
        priceSource,
        direction: priceDirection,
        priceDelta,
        priceDeltaPct,
        marketMatchedDelta: null,
        runnerMatchedDelta: null,
        classifiedVolume: 0,
        unclassifiedVolume: 0,
        suppressedVolume: 0,
        volumeDetected: false,
        directionAttributed: 'none',
        directionReliable: false,
        flowAmbiguous: true,
        validVolume: false,
        invalidVolume: true,
        anomaly: true,
        invalidReason: mfReason,
        validationReasons: volumeValidationReasons,
        rawRunnerMatchedDelta: runnerMatchedDelta,
        rawMarketMatchedDelta: marketMatchedDelta,
        graphHealth,
        ladderSource,
        bookTradable: tradable,
        confidence: 'low',
        reasons
    };
}

export function buildValidBetfairMoveResult({
    cur,
    curRunner,
    toPrice,
    fromPrice,
    priceSource,
    priceDelta,
    priceDirection,
    timestamp,
    age,
    runnerMatchedDelta,
    marketMatchedDelta,
    mf
}) {
    const priceDeltaAbs = Math.abs(priceDelta ?? 0);
    const back = mf && typeof mf.back === 'number' ? mf.back : 0;
    const lay = mf && typeof mf.lay === 'number' ? mf.lay : 0;
    const classifiedVolume = roundN(back + lay, 2) ?? 0;
    const effectiveDelta = runnerMatchedDelta ?? 0;
    const rawUnclassified = Math.max(0, effectiveDelta - classifiedVolume);
    const unclassifiedVolume = roundN(rawUnclassified, 2) ?? 0;

    const mfConfidence = mf?.confidence || null;
    const isSuppressed = mfConfidence === 'suppressed';
    const rawTrend = mf?.trend || 'unknown';
    const suppressedVolume = (isSuppressed || rawTrend === 'neutral')
        ? roundN(Math.max(unclassifiedVolume, effectiveDelta > classifiedVolume ? effectiveDelta - classifiedVolume : 0), 2) ?? 0
        : unclassifiedVolume;

    const volumeDetected = effectiveDelta > 0 || classifiedVolume > 0;

    let directionAttributed = 'none';
    if (back > 0 && lay > 0) directionAttributed = 'mixed';
    else if (back > 0) directionAttributed = 'back';
    else if (lay > 0) directionAttributed = 'lay';

    const directionReliable = (
        !isSuppressed &&
        classifiedVolume > 0 &&
        classifiedVolume >= suppressedVolume &&
        directionAttributed !== 'none' &&
        directionAttributed !== 'mixed' &&
        (
            (directionAttributed === 'back' && priceDirection === 'shortening') ||
            (directionAttributed === 'lay' && priceDirection === 'drifting')
        )
    );

    const flowAmbiguous = (
        isSuppressed ||
        directionAttributed === 'none' ||
        (unclassifiedVolume > 0 && unclassifiedVolume >= classifiedVolume * 0.5) ||
        (classifiedVolume > 0 && suppressedVolume >= classifiedVolume * 0.5) ||
        (directionAttributed !== 'none' && directionAttributed !== 'mixed' && !directionReliable)
    );

    const graphHealth = curRunner.data?.graphHealth?.status ||
        cur.data?.graphHealth?.status || null;
    const ladderSource = curRunner.ladderSource || null;
    const tradable = isBookTradable(curRunner);
    const priceDeltaPct = (fromPrice && fromPrice !== 0 && priceDelta !== null)
        ? roundN((priceDelta / fromPrice) * 100, 2)
        : null;

    const reasons = [];
    if (isSuppressed) reasons.push('moneyFlow confidence is suppressed; volume not attributed');
    if (directionAttributed === 'none') reasons.push('Matched volume detected but direction not attributed');
    if (flowAmbiguous) reasons.push('Flow is ambiguous');
    if (!tradable) reasons.push('Book not tradable at time of move');

    let confidence = 'low';
    if (!flowAmbiguous && directionReliable) confidence = 'medium';
    if (!flowAmbiguous && directionReliable && priceDeltaAbs > 0.1) confidence = 'high';

    return {
        available: true,
        timestamp,
        ageSec: age !== null ? Math.round(age) : null,
        seq: cur.data?.seq ?? null,
        runner: curRunner.name || null,
        selectionId: curRunner.selectionId ?? null,
        fromPrice,
        toPrice,
        priceSource,
        direction: priceDirection,
        priceDelta,
        priceDeltaPct,
        marketMatchedDelta,
        runnerMatchedDelta,
        classifiedVolume,
        unclassifiedVolume,
        suppressedVolume,
        volumeDetected,
        directionAttributed,
        directionReliable,
        flowAmbiguous,
        validVolume: true,
        invalidVolume: false,
        anomaly: false,
        invalidReason: null,
        validationReasons: [],
        rawRunnerMatchedDelta: runnerMatchedDelta,
        rawMarketMatchedDelta: marketMatchedDelta,
        graphHealth,
        ladderSource,
        bookTradable: tradable,
        confidence,
        reasons
    };
}
