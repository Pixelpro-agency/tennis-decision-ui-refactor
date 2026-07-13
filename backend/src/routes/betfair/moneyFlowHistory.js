import { normalizeSelectionId } from '../../sofa/betfair/moneyFlow.js';

function isFiniteNumber(value) {
    return typeof value === 'number' && Number.isFinite(value);
}

function roundMoney(value) {
    return Math.round(value * 100) / 100;
}

function selectValidDelta(rawDelta, computedDelta) {
    if (rawDelta !== null && rawDelta >= 0) {
        return rawDelta;
    }

    if (computedDelta !== null && computedDelta >= 0) {
        return computedDelta;
    }

    return null;
}

function buildInvalidValidation(reason, validationReasons) {
    return {
        validForDisplay: false,
        invalidVolume: true,
        anomaly: true,
        reason,
        validationReasons
    };
}

export function validateMoneyFlowPoint({
    rawMarketDelta,
    computedMarketDelta,
    rawRunnerDelta,
    computedRunnerDelta,
    reason
}) {
    const validationReasons = [];

    if (reason === 'matched_total_decreased') {
        validationReasons.push('reason=matched_total_decreased');
        return buildInvalidValidation(
            'matched_total_decreased',
            validationReasons
        );
    }

    const negativeDeltas = [
        ['rawMarketDelta', rawMarketDelta],
        ['computedMarketDelta', computedMarketDelta],
        ['rawRunnerDelta', rawRunnerDelta],
        ['computedRunnerDelta', computedRunnerDelta]
    ];

    for (const [name, value] of negativeDeltas) {
        if (value !== null && value < 0) {
            validationReasons.push(`${name}=${value} < 0`);
            return buildInvalidValidation(
                reason || 'matched_total_decreased',
                validationReasons
            );
        }
    }

    if (
        rawRunnerDelta !== null &&
        computedRunnerDelta !== null &&
        (
            (rawRunnerDelta === 0 && computedRunnerDelta > 0) ||
            (rawRunnerDelta > 0 && computedRunnerDelta === 0)
        )
    ) {
        validationReasons.push(
            `rawRunnerDelta(${rawRunnerDelta}) vs computedRunnerDelta(${computedRunnerDelta}) zero-vs-positive mismatch`
        );
        return buildInvalidValidation(
            'runner_delta_raw_computed_mismatch',
            validationReasons
        );
    }

    if (rawRunnerDelta !== null && computedRunnerDelta !== null) {
        const base = Math.max(
            Math.abs(rawRunnerDelta),
            Math.abs(computedRunnerDelta)
        );
        const tol = Math.max(1, base * 0.10);

        if (Math.abs(rawRunnerDelta - computedRunnerDelta) > tol) {
            validationReasons.push(
                `rawRunnerDelta(${rawRunnerDelta}) vs computedRunnerDelta(${computedRunnerDelta}) diverge > tol(${tol.toFixed(1)})`
            );
            return buildInvalidValidation(
                'runner_delta_raw_computed_mismatch',
                validationReasons
            );
        }
    }

    if (
        rawMarketDelta !== null &&
        computedMarketDelta !== null &&
        (
            (rawMarketDelta === 0 && computedMarketDelta > 0) ||
            (rawMarketDelta > 0 && computedMarketDelta === 0)
        )
    ) {
        validationReasons.push(
            `rawMarketDelta(${rawMarketDelta}) vs computedMarketDelta(${computedMarketDelta}) zero-vs-positive mismatch`
        );
        return buildInvalidValidation(
            'market_delta_raw_computed_mismatch',
            validationReasons
        );
    }

    if (rawMarketDelta !== null && computedMarketDelta !== null) {
        const base = Math.max(
            Math.abs(rawMarketDelta),
            Math.abs(computedMarketDelta)
        );
        const tol = Math.max(1, base * 0.10);

        if (Math.abs(rawMarketDelta - computedMarketDelta) > tol) {
            validationReasons.push(
                `rawMarketDelta(${rawMarketDelta}) vs computedMarketDelta(${computedMarketDelta}) diverge > tol(${tol.toFixed(1)})`
            );
            return buildInvalidValidation(
                'market_delta_raw_computed_mismatch',
                validationReasons
            );
        }
    }

    const effectiveMarketDelta = selectValidDelta(
        rawMarketDelta,
        computedMarketDelta
    );
    const effectiveRunnerDelta = selectValidDelta(
        rawRunnerDelta,
        computedRunnerDelta
    );

    if (
        effectiveMarketDelta !== null &&
        effectiveRunnerDelta !== null
    ) {
        const tol = Math.max(1, Math.abs(effectiveMarketDelta) * 0.05);

        if (effectiveRunnerDelta > effectiveMarketDelta + tol) {
            validationReasons.push(
                `runnerDelta(${effectiveRunnerDelta}) > marketDelta(${effectiveMarketDelta}) + tol(${tol.toFixed(1)})`
            );
            return buildInvalidValidation(
                'runner_delta_exceeds_market_delta',
                validationReasons
            );
        }
    }

    return {
        validForDisplay: true,
        invalidVolume: false,
        anomaly: false,
        reason: reason || null,
        validationReasons
    };
}

export function buildMoneyFlowHistoryPoint({ tick, previousTick, runner }) {
    const d = tick?.data || {};
    const mf = runner?.moneyFlow || {};
    const ts = typeof tick?.timestamp === 'string' ? tick.timestamp : '';

    const rawRunnerDelta = isFiniteNumber(mf.runnerDelta)
        ? mf.runnerDelta
        : null;
    const rawMarketDelta = isFiniteNumber(mf.marketDelta)
        ? mf.marketDelta
        : null;

    let computedRunnerDelta = null;
    let computedMarketDelta = null;

    if (previousTick) {
        const runnerSelectionId = normalizeSelectionId(runner?.selectionId);
        const prevRunner = runnerSelectionId === null
            ? null
            : (previousTick.data?.runners || []).find((previousRunner) =>
                normalizeSelectionId(previousRunner?.selectionId) === runnerSelectionId
            ) || null;

        const prevRunnerTotal = isFiniteNumber(prevRunner?.matchedTotal)
            ? prevRunner.matchedTotal
            : null;
        const currRunnerTotal = isFiniteNumber(runner?.matchedTotal)
            ? runner.matchedTotal
            : null;

        if (prevRunnerTotal !== null && currRunnerTotal !== null) {
            computedRunnerDelta = currRunnerTotal - prevRunnerTotal;
        }

        const prevMarketTotal = isFiniteNumber(
            previousTick.data?.market?.totalMatched
        )
            ? previousTick.data.market.totalMatched
            : null;
        const currMarketTotal = isFiniteNumber(d.market?.totalMatched)
            ? d.market.totalMatched
            : null;

        if (prevMarketTotal !== null && currMarketTotal !== null) {
            computedMarketDelta = currMarketTotal - prevMarketTotal;
        }
    }

    const validation = validateMoneyFlowPoint({
        rawMarketDelta,
        computedMarketDelta,
        rawRunnerDelta,
        computedRunnerDelta,
        reason: mf.reason || null
    });

    const selectedRunnerDelta = selectValidDelta(
        rawRunnerDelta,
        computedRunnerDelta
    );
    const selectedMarketDelta = selectValidDelta(
        rawMarketDelta,
        computedMarketDelta
    );
    const canDisplay = validation.validForDisplay;

    const runnerMatchedDelta = canDisplay && selectedRunnerDelta !== null
        ? roundMoney(selectedRunnerDelta)
        : null;
    const marketMatchedDelta = canDisplay && selectedMarketDelta !== null
        ? roundMoney(selectedMarketDelta)
        : null;
    const matchedVolume = runnerMatchedDelta !== null
        ? runnerMatchedDelta
        : 0;

    return {
        timestamp: ts,
        matchedVolume,
        runnerMatchedDelta,
        marketMatchedDelta,
        ladderTradedDelta: isFiniteNumber(mf.ladderTradedDelta)
            ? mf.ladderTradedDelta
            : null,
        reason: validation.reason,
        validationReasons: validation.validationReasons,
        seq: isFiniteNumber(d.seq) ? d.seq : null,
        graphHealth: d.graphHealth?.status || null,
        ladderSource: runner?.ladderSource || null,
        volumeDetected: matchedVolume > 0,
        validForDisplay: validation.validForDisplay,
        invalidVolume: validation.invalidVolume,
        anomaly: validation.anomaly
    };
}
