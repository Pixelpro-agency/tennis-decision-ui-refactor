import assert from 'node:assert/strict';
import { updateBetfair } from '../trackerUpdate.js';

let passed = 0;
let failed = 0;

export async function runTest(name, callback) {
    try {
        await callback();
        console.log(`PASS ${name}`);
        passed += 1;
    } catch (error) {
        console.error(`FAIL ${name}`);
        console.error(error);
        failed += 1;
    }
}

export function createValidResult() {
    return {
        runners: [{ name: 'Player A' }, { name: 'Player B' }],
        market_info: { total_matched: 1000 },
        event_status: { hasFinished: false }
    };
}

export const defaultDeps = {
    fetchBetfairData: () => Promise.resolve(createValidResult()),
    getBetfairTrackingKey: (url) => 'normalized-' + url,
    observeBetfairSourceIdentitySample: () => ({ action: 'no-gate' }),
    persistBetfairTrackingSample: () => {}
};

export function finish(scope = 'modular test') {
    console.log(`${scope}: ${passed} passed, ${failed} failed`);
    if (failed > 0) {
        throw new Error(`${failed} ${scope} assertions failed`);
    }
}

export { buildBetfairSessionHealth } from '../../betfairHealth.js';

export function createClock(...timestamps) {
    let index = 0;
    return () => timestamps[index++];
}
