import { computeLatestScoreChange } from './temporalAlignment/scoreChange.js';
export { computeLatestScoreChange };
import { computeLatestRelevantSofaMarker } from './temporalAlignment/sofaMarker.js';
export { computeLatestRelevantSofaMarker };
import { computeLatestBetfairMove } from './temporalAlignment/betfairMove.js';
export { computeLatestBetfairMove };
import { computeReactionWindows } from './temporalAlignment/reactionWindows.js';
export { computeReactionWindows };
import { checkBookTradable } from './temporalAlignment/bookTradable.js';
export { checkBookTradable };

const PRICE_MOVE_THRESHOLD = 0.01;

const SCORE_TYPE_PRIORITY = { set: 4, game: 3, point: 2, match_status: 1, unknown: 0 };

export function buildTemporalAlignment({ sofaTicks, betfairTicks, now }) {
    const warnings = [];

    const st = Array.isArray(sofaTicks) ? sofaTicks : [];
    const bt = Array.isArray(betfairTicks) ? betfairTicks : [];

    if (st.length === 0) warnings.push('Sofa timeline unavailable; field-side temporal evidence missing');
    if (bt.length === 0) warnings.push('Betfair timeline unavailable; market-side temporal evidence missing');

    const latestScoreChange = computeLatestScoreChange(st, now);
    const latestRelevantSofaMarker = computeLatestRelevantSofaMarker(st, now);
    const latestBetfairMove = computeLatestBetfairMove(bt, now);
    const reactionWindows = computeReactionWindows(latestRelevantSofaMarker, latestBetfairMove);

    if (!latestScoreChange.available) warnings.push('No score change detected in Sofa lookback window');
    if (!latestRelevantSofaMarker.available) warnings.push('No relevant Sofa pressure marker found in lookback window');
    if (!latestBetfairMove.available) warnings.push('No significant Betfair price/volume move found in lookback window');
    if (latestBetfairMove.available && latestBetfairMove.invalidVolume) {
        warnings.push('Market move detected, but moneyFlow volume was invalidated by TotalMatched gate');
        if (latestBetfairMove.priceDelta !== null && Math.abs(latestBetfairMove.priceDelta) > PRICE_MOVE_THRESHOLD) {
            warnings.push('Market price moved, but volume confirmation is invalid');
        }
    } else if (latestBetfairMove.available && latestBetfairMove.flowAmbiguous) {
        warnings.push('Market moved, but flow is ambiguous');
    }
    if (latestBetfairMove.available && !latestBetfairMove.volumeDetected && !latestBetfairMove.invalidVolume) {
        warnings.push('Market price moved, but volume confirmation is missing');
    }
    if (latestBetfairMove.available && !latestRelevantSofaMarker.available) {
        warnings.push('Market moved, but field evidence unclear');
    }
    if (latestRelevantSofaMarker.available && !latestBetfairMove.available) {
        warnings.push('Sofa pressure detected, but market confirmation missing');
    }
    if (latestBetfairMove.available && latestBetfairMove.directionAttributed === 'none') {
        warnings.push('Matched volume detected, direction not attributed');
    }
    if (reactionWindows.relation === 'sofa_before_betfair') {
        warnings.push('Sofa marker detected before Betfair move, but causality not established');
    } else if (reactionWindows.relation === 'betfair_before_sofa') {
        warnings.push('Market moved before latest Sofa marker');
    } else if (reactionWindows.relation === 'same_window') {
        warnings.push('Field and market events occurred in the same window');
    }

    return {
        latestScoreChange,
        latestRelevantSofaMarker,
        latestBetfairMove,
        reactionWindows,
        warnings
    };
}