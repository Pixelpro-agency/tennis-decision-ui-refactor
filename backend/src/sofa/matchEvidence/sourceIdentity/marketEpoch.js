import { asString, getTickData } from './shared.js';
import { normalizeName } from './normalize.js';

export function buildBetfairIdentitySignature(tick) {
const data = getTickData(tick);
const runners = Array.isArray(data.runners) ? data.runners : [];
const marketId = asString(data.market?.marketId).trim();

const selectionIds = runners
    .map(runner => runner?.selectionId)
    .filter(selectionId => (
        selectionId !== null &&
        selectionId !== undefined &&
        asString(selectionId).trim() !== ''
    ))
    .map(selectionId => asString(selectionId).trim())
    .sort();

if (
    marketId &&
    selectionIds.length >= 2 &&
    new Set(selectionIds).size === selectionIds.length
) {
    return `marketId:${marketId}|selectionIds:${selectionIds.join(',')}`;
}

const marketKey = asString(data.marketKey).trim();

const normalizedRunners = runners
    .map(runner => normalizeName(runner?.name))
    .filter(Boolean)
    .sort();

if (
    marketKey &&
    normalizedRunners.length >= 2 &&
    new Set(normalizedRunners).size === normalizedRunners.length
) {
    return `marketKey:${marketKey}|runners:${normalizedRunners.join('|')}`;
}

return null;

}

export function selectActiveBetfairMarketEpoch(input) {
const entries = Array.isArray(input)
? input.slice()
: Array.isArray(input?.timeline)
? input.timeline.slice()
: [];

if (entries.length === 0) {
    return {
        ticks: [],
        lastTick: null,
        signature: null,
        reasons: ['Active Betfair market epoch is unavailable']
    };
}

const lastTick = entries[entries.length - 1];
const signature = buildBetfairIdentitySignature(lastTick);

if (!signature) {
    return {
        ticks: [],
        lastTick,
        signature: null,
        reasons: ['Active Betfair market identity is unavailable']
    };
}

let startIndex = entries.length - 1;
let exclusionReason = null;

while (startIndex > 0) {
    const previousSignature = buildBetfairIdentitySignature(
        entries[startIndex - 1]
    );

    if (previousSignature === signature) {
        startIndex -= 1;
        continue;
    }

    exclusionReason = previousSignature
        ? 'Historical Betfair market epoch excluded after market identity changed'
        : 'Historical Betfair ticks excluded because market identity is unavailable';

    break;
}

const reasons = exclusionReason ? [exclusionReason] : [];

return {
    ticks: entries.slice(startIndex),
    lastTick,
    signature,
    reasons
};

}
