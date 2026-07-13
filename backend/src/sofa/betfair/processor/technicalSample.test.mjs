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

finish();
