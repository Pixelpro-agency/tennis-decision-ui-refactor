import { SOFA_RECENT_SEC, BETFAIR_RECENT_SEC, MEDIUM_AGE_SEC, ageSec } from './time.js';

export function buildAlignment({ sofaTick, betfairTick, now }) {
    const sofaTs = sofaTick?.timestamp || sofaTick?.data?.timestamp || null;
    const betfairTs = betfairTick?.timestamp || betfairTick?.data?.timestamp || null;

    const sofaAge = ageSec(sofaTs, now);
    const betfairAge = betfairTick ? ageSec(betfairTs, now) : null;

    const sofaSeq = sofaTick?.data?.seq ?? null;
    const betfairSeq = betfairTick?.data?.seq ?? null;

    let maxTickGapSec = null;
    if (sofaAge !== null && betfairAge !== null) {
        maxTickGapSec = Math.max(sofaAge, betfairAge);
    } else if (sofaAge !== null) {
        maxTickGapSec = sofaAge;
    }

    let alignmentQuality = 'poor';
    if (sofaAge !== null && betfairAge !== null && sofaAge <= SOFA_RECENT_SEC && betfairAge <= BETFAIR_RECENT_SEC) {
        alignmentQuality = 'good';
    } else if (sofaAge !== null && sofaAge <= MEDIUM_AGE_SEC && (betfairAge === null || betfairAge <= MEDIUM_AGE_SEC)) {
        alignmentQuality = 'medium';
    }

    return {
        sofaSeq,
        betfairSeq,
        sofaTimestamp: sofaTs,
        betfairTimestamp: betfairTs,
        sofaAgeSec: sofaAge !== null ? Math.round(sofaAge) : null,
        betfairAgeSec: betfairAge !== null ? Math.round(betfairAge) : null,
        maxTickGapSec: maxTickGapSec !== null ? Math.round(maxTickGapSec) : null,
        alignmentQuality
    };
}
