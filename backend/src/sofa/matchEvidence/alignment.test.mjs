import { buildAlignment } from './alignment.js';
import { buildEvidenceFromTicks, buildLatestMatchEvidence } from '../matchEvidence.js';

function assert(condition, message) {
    if (!condition) throw new Error(message);
}

const now = new Date('2026-06-21T00:00:00.000Z');
const good = buildAlignment({ sofaTick: { timestamp: '2026-06-20T23:59:50.000Z', data: { seq: 4 } }, betfairTick: { timestamp: '2026-06-20T23:59:48.000Z', data: { seq: 8 } }, now });
assert(good.alignmentQuality === 'good', 'good alignment');
assert(good.sofaAgeSec === 10 && good.betfairAgeSec === 12 && good.maxTickGapSec === 12, 'good ages');
assert(good.maxSourceAgeSec === 12 && good.crossSourceGapSec === 2 && good.pairwiseAvailable === true, 'freshness and pairwise gap separated');
assert(good.sofaSeq === 4 && good.betfairSeq === 8, 'sequence preservation');
const medium = buildAlignment({ sofaTick: { timestamp: '2026-06-20T23:59:20.000Z', data: {} }, betfairTick: null, now });
assert(medium.alignmentQuality === 'poor' && medium.maxSourceAgeSec === 40 && medium.pairwiseAvailable === false, 'missing source has no pairwise alignment');
const poor = buildAlignment({ sofaTick: { timestamp: '2026-06-20T23:58:59.000Z', data: {} }, betfairTick: null, now });
assert(poor.alignmentQuality === 'poor', 'poor alignment');
const invalid = buildAlignment({ sofaTick: { timestamp: 'invalid', data: {} }, betfairTick: null, now });
assert(invalid.sofaAgeSec === null && invalid.alignmentQuality === 'poor', 'invalid timestamp');
const future = buildAlignment({ sofaTick: { timestamp: '2026-06-21T00:00:30.000Z', data: {} }, betfairTick: null, now });
assert(future.sofaAgeSec === null && future.freshnessQuality === 'poor', 'future timestamp beyond tolerance');
assert(typeof buildEvidenceFromTicks === 'function' && typeof buildLatestMatchEvidence === 'function', 'facade exports');
console.log('matchEvidence alignment: 10 assertions passed');
