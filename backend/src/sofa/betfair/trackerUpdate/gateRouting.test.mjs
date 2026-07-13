import assert from 'node:assert/strict';
import { updateBetfair } from '../trackerUpdate.js';
import {
    buildBetfairSessionHealth,
    createClock,
    createValidResult,
    defaultDeps,
    finish,
    runTest
} from './trackerUpdateTestFixtures.mjs';

await runTest('action bootstrapped -> zero Betfair persistence', async () => {
    let persistCount = 0;
    const deps = {
        ...defaultDeps,
        observeBetfairSourceIdentitySample: () => ({ action: 'bootstrapped' }),
        persistBetfairTrackingSample: () => { persistCount++; }
    };

    await updateBetfair('event-test', { betfairUrl: 'some-url', betfairFinished: false }, deps);
    assert.equal(persistCount, 0);
});

await runTest('action persist-current -> one Betfair persistence with normalized key', async () => {
    let persistCount = 0;
    let passedKey = null;
    const deps = {
        ...defaultDeps,
        observeBetfairSourceIdentitySample: () => ({ action: 'persist-current' }),
        persistBetfairTrackingSample: (eventId, result, key) => {
            persistCount++;
            passedKey = key;
        }
    };

    await updateBetfair('event-test', { betfairUrl: 'some-url', betfairFinished: false }, deps);
    assert.equal(persistCount, 1);
    assert.equal(passedKey, 'normalized-some-url');
});

await runTest('action blocked -> zero Betfair persistence', async () => {
    let persistCount = 0;
    const deps = {
        ...defaultDeps,
        observeBetfairSourceIdentitySample: () => ({ action: 'blocked' }),
        persistBetfairTrackingSample: () => { persistCount++; }
    };

    await updateBetfair('event-test', { betfairUrl: 'some-url', betfairFinished: false }, deps);
    assert.equal(persistCount, 0);
});

await runTest('action buffered -> zero Betfair persistence', async () => {
    let persistCount = 0;
    const deps = {
        ...defaultDeps,
        observeBetfairSourceIdentitySample: () => ({ action: 'buffered' }),
        persistBetfairTrackingSample: () => { persistCount++; }
    };

    await updateBetfair('event-test', { betfairUrl: 'some-url', betfairFinished: false }, deps);
    assert.equal(persistCount, 0);
});

await runTest('explicit hasFinished stops polling without gate or persistence', async () => {
    let keyCount = 0;
    let observeCount = 0;
    let persistCount = 0;
    const deps = {
        ...defaultDeps,
        fetchBetfairData: () => Promise.resolve({
            runners: [],
            market_info: { total_matched: 0 },
            event_status: { hasFinished: true }
        }),
        getBetfairTrackingKey: () => { keyCount++; return 'unexpected-key'; },
        observeBetfairSourceIdentitySample: () => { observeCount++; return { action: 'no-gate' }; },
        persistBetfairTrackingSample: () => { persistCount++; }
    };

    const info = { betfairUrl: 'some-url', betfairFinished: false };
    await updateBetfair('event-finished', info, deps);

    assert.equal(info.betfairFinished, true);
    assert.equal(keyCount, 0);
    assert.equal(observeCount, 0);
    assert.equal(persistCount, 0);
});

finish('betfairTrackerUpdate/gate');
