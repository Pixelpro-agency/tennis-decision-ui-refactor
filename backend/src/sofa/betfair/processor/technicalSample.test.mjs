import {
    classifyBetfairTechnicalSample
} from '../processor.js';
import {
    createCheckSuite
} from './processorTestHarness.mjs';

const { check, finish } = createCheckSuite('technicalSample');

const technical = classifyBetfairTechnicalSample({
    runners: [],
    market_info: { total_matched: 1 }
});
check(
    'technical-classification-is-unchanged',
    technical.usable === false && technical.reason === 'runners_empty'
);

const validRunners = [
    { name: 'Player A', selectionId: 101 },
    { name: 'Player B', selectionId: ' 102 ' }
];

const cases = [
    ['invalid raw null', null, 'invalid_raw'],
    ['invalid raw array', [], 'invalid_raw'],
    ['raw error', { error: 'x' }, 'raw_error'],
    ['api error', { api_error: 'x' }, 'api_error'],
    ['runners missing', { market_info: { total_matched: 1 } }, 'runners_missing'],
    ['runners empty', { runners: [], market_info: { total_matched: 1 } }, 'runners_empty'],
    ['runner null', { runners: [null], market_info: { total_matched: 1 } }, 'runner_invalid'],
    ['runner primitive', { runners: ['x'], market_info: { total_matched: 1 } }, 'runner_invalid'],
    ['runner nested array', { runners: [[]], market_info: { total_matched: 1 } }, 'runner_invalid'],
    ['selection missing', { runners: [{ name: 'A' }], market_info: { total_matched: 1 } }, 'selection_id_invalid'],
    ['selection blank', { runners: [{ selectionId: ' ' }], market_info: { total_matched: 1 } }, 'selection_id_invalid'],
    ['selection non-finite', { runners: [{ selectionId: Infinity }], market_info: { total_matched: 1 } }, 'selection_id_invalid'],
    ['selection duplicate normalized', { runners: [{ selectionId: 7 }, { selectionId: '7' }], market_info: { total_matched: 1 } }, 'selection_id_duplicate'],
    ['total missing', { runners: validRunners, market_info: {} }, 'total_matched_missing'],
    ['total invalid', { runners: validRunners, market_info: { total_matched: NaN } }, 'total_matched_invalid'],
    ['total infinity', { runners: validRunners, market_info: { total_matched: Infinity } }, 'total_matched_invalid'],
    ['total zero', { runners: validRunners, market_info: { total_matched: 0 } }, 'total_matched_non_positive']
];

for (const [label, raw, reason] of cases) {
    const result = classifyBetfairTechnicalSample(raw);
    check(label, result.usable === false && result.reason === reason);
}

for (const totalMatched of [1000, 'EUR 74,817']) {
    const result = classifyBetfairTechnicalSample({
        runners: validRunners,
        market_info: { total_matched: totalMatched }
    });
    check(
        `valid producer total ${totalMatched}`,
        result.usable === true && result.reason === null && result.totalMatched > 0
    );
}

finish();
