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

await runTest('stale tracking session discards completed scraper result', async () => {
    let observeCount = 0;
    let persistCount = 0;
    let capturedOptions;
    const info = {
        betfairUrl: 'some-url',
        betfairFinished: false,
        trackingSessionId: 'session-a'
    };
    const result = await updateBetfair('event-stale', info, {
        ...defaultDeps,
        fetchBetfairData: (_url, _eventId, options) => {
            capturedOptions = options;
            return Promise.resolve(createValidResult());
        },
        isTrackingSessionCurrent: () => false,
        observeBetfairSourceIdentitySample: () => {
            observeCount++;
            return { action: 'persist-current' };
        },
        persistBetfairTrackingSample: () => { persistCount++; }
    });

    assert.equal(capturedOptions.trackingSessionId, 'session-a');
    assert.equal(capturedOptions.noCache, true);
    assert.equal(result.reason, 'stale_tracking_session');
    assert.equal(observeCount, 0);
    assert.equal(persistCount, 0);
    assert.equal(info.betfairRuntime.lastSuccessfulScrapeAt, null);
});

await runTest('session becoming stale during gate observation cannot persist', async () => {
    let current = true;
    let persistCount = 0;
    const result = await updateBetfair(
        'event-race',
        { betfairUrl: 'some-url', betfairFinished: false, trackingSessionId: 'session-old' },
        {
            ...defaultDeps,
            isTrackingSessionCurrent: () => current,
            observeBetfairSourceIdentitySample: () => {
                current = false;
                return { action: 'persist-current' };
            },
            persistBetfairTrackingSample: () => { persistCount++; }
        }
    );
    assert.equal(result.reason, 'stale_tracking_session');
    assert.equal(persistCount, 0);
});

await runTest('weak finished hint does not stop polling', async () => {
    const info = { betfairUrl: 'some-url', betfairFinished: false };
    await updateBetfair('event-weak-finished', info, {
        ...defaultDeps,
        fetchBetfairData: () => Promise.resolve({
            ...createValidResult(),
            event_status: {
                hasFinished: false,
                weakFinishedHint: true,
                source: '.sports-header:visible-text'
            }
        })
    });
    assert.equal(info.betfairFinished, false);
});

finish('betfairTrackerUpdate/gate');
