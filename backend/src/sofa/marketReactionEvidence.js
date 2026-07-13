import { buildSignificantMarketFlowEvidence } from './significantMarketFlowEvidence.js';
import { buildMarketLedObservationEvidence } from './marketLedObservationEvidence.js';
import { buildFieldLedReactionEvidence } from './fieldLedReactionEvidence.js';

export function buildMarketReactionEvidence({
    betfairTicks = [],
    sofaTicks = [],
    now = new Date(),
    config = {}
} = {}) {
    const smfConfig = config?.significantMarketFlow ?? {};
    const mloConfig = config?.marketLedObservation ?? {};
    const flrConfig = config?.fieldLedReaction ?? {};

    const significantMarketFlow = buildSignificantMarketFlowEvidence({
        betfairTicks,
        now,
        config: smfConfig
    });

    const sourceMarketEvent = significantMarketFlow.latestSignificantFlow ?? null;

    const marketLedObservation = buildMarketLedObservationEvidence({
        sourceMarketEvent,
        sofaTicks,
        now,
        config: mloConfig
    });

    const fieldLedReaction = buildFieldLedReactionEvidence({
        sofaTicks,
        betfairTicks,
        now,
        config: flrConfig
    });

    const available =
        significantMarketFlow.available === true ||
        marketLedObservation.available === true ||
        fieldLedReaction.available === true;

    const largeFlowDetected =
        significantMarketFlow.summary.largeFlowDetected === true;

    const marketLedAvailable =
        marketLedObservation.available === true;

    const fieldLedAvailable =
        fieldLedReaction.available === true;

    const fieldLedMarketResponseObserved =
        fieldLedReaction.summary.marketResponseObserved === true;

    const fieldLedDataQuality =
        fieldLedReaction.summary.dataQuality ?? 'unknown';

    const flowAmbiguous =
        marketLedObservation.summary.flowAmbiguous === true;

    const dataQuality =
        marketLedObservation.summary.dataQuality ?? 'unknown';

    const childReasons = [
        ...(significantMarketFlow.summary.reasons ?? []),
        ...(marketLedObservation.summary.reasons ?? []),
        ...(fieldLedReaction.summary.reasons ?? [])
    ];
    const uniqueReasons = [...new Set(childReasons.filter(r => typeof r === 'string' && r.length > 0))];

    return {
        available,

        config: {
            significantMarketFlow: significantMarketFlow.config ?? {},
            marketLedObservation: marketLedObservation.config ?? {},
            fieldLedReaction: fieldLedReaction.config ?? {}
        },

        significantMarketFlow,

        marketLedObservation,

        fieldLedReaction,

        summary: {
            largeFlowDetected,
            marketLedAvailable,
            fieldLedAvailable,
            fieldLedMarketResponseObserved,
            fieldLedDataQuality,
            flowAmbiguous,
            dataQuality,
            causalityClaimed: false,
            reasons: uniqueReasons
        }
    };
}
