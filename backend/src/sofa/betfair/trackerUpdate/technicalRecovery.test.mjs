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

await runTest('three consecutive technical failures attempt repairOnly without gate or finished state', async () => {
    let keyCount = 0;
    let observeCount = 0;
    let persistCount = 0;
    const samples = [
        { error: 'network timeout', runners: [], market_info: {}, event_status: { hasFinished: false } },
        { api_error: 'not logged in', runners: [], market_info: {}, event_status: { hasFinished: false } },
        { runners: [], market_info: { total_matched: 1000 }, event_status: { hasFinished: false } }
    ];
    const deps = {
        ...defaultDeps,
        fetchBetfairData: () => Promise.resolve(samples.shift()),
        getBetfairTrackingKey: () => { keyCount++; return 'unexpected-key'; },
        observeBetfairSourceIdentitySample: () => { observeCount++; return { action: 'no-gate' }; },
        persistBetfairTrackingSample: () => { persistCount++; }
    };

    const info = { betfairUrl: 'some-url', betfairFinished: false, betfairEmptyCount: 2 };
    await updateBetfair('event-technical', info, deps);
    await updateBetfair('event-technical', info, deps);
    await updateBetfair('event-technical', info, deps);

    assert.equal(info.betfairFinished, false);
    assert.equal(keyCount, 3);
    assert.equal(observeCount, 0);
    assert.equal(persistCount, 3);
});

await runTest('each technical failure attempts repairOnly without gate or finished state', async () => {
    const samples = [
        { label: 'raw error', result: { ...createValidResult(), error: 'network failure' } },
        { label: 'api_error', result: { ...createValidResult(), api_error: 'logout' } },
        { label: 'runners missing', result: { market_info: { total_matched: 1000 }, event_status: { hasFinished: false } } },
        { label: 'runners empty', result: { runners: [], market_info: { total_matched: 1000 }, event_status: { hasFinished: false } } },
        { label: 'totalMatched missing', result: { runners: createValidResult().runners, market_info: {}, event_status: { hasFinished: false } } },
        { label: 'totalMatched zero', result: { runners: createValidResult().runners, market_info: { total_matched: 0 }, event_status: { hasFinished: false } } }
    ];

    for (const sample of samples) {
        let keyCount = 0;
        let observeCount = 0;
        let persistCount = 0;
        const deps = {
            ...defaultDeps,
            fetchBetfairData: () => Promise.resolve(sample.result),
            getBetfairTrackingKey: () => { keyCount++; return 'unexpected-key'; },
            observeBetfairSourceIdentitySample: () => { observeCount++; return { action: 'no-gate' }; },
            persistBetfairTrackingSample: () => { persistCount++; }
        };
        const info = { betfairUrl: 'some-url', betfairFinished: false };

        await updateBetfair(`event-${sample.label}`, info, deps);

        assert.equal(info.betfairFinished, false, sample.label);
        assert.equal(keyCount, 1, sample.label);
        assert.equal(observeCount, 0, sample.label);
        assert.equal(persistCount, 1, sample.label);
    }
});

await runTest('valid sample after technical failures resumes gate observation and persistence', async () => {
    let fetchCount = 0;
    let keyCount = 0;
    let observeCount = 0;
    let persistCount = 0;
    const deps = {
        ...defaultDeps,
        fetchBetfairData: () => {
            fetchCount++;
            return Promise.resolve(fetchCount === 1
                ? { error: 'temporary DNS failure', runners: [], market_info: {}, event_status: { hasFinished: false } }
                : createValidResult());
        },
        getBetfairTrackingKey: (url) => { keyCount++; return 'normalized-' + url; },
        observeBetfairSourceIdentitySample: () => { observeCount++; return { action: 'no-gate' }; },
        persistBetfairTrackingSample: () => { persistCount++; }
    };

    const info = { betfairUrl: 'some-url', betfairFinished: false };
    await updateBetfair('event-recovery', info, deps);
    assert.equal(info.betfairFinished, false);
    assert.equal(keyCount, 1);
    assert.equal(observeCount, 0);
    assert.equal(persistCount, 1);

    await updateBetfair('event-recovery', info, deps);
    assert.equal(info.betfairFinished, false);
    assert.equal(keyCount, 2);
    assert.equal(observeCount, 1);
    assert.equal(persistCount, 2);
});

await runTest('technical sample + repairOnly recovered is propagated without gate', async () => {
    let persistCount = 0;
    let passedOptions = null;
    let observeCount = 0;
    const deps = {
        ...defaultDeps,
        fetchBetfairData: () => Promise.resolve({
            error: 'temporary parser failure',
            runners: [],
            market_info: {},
            event_status: { hasFinished: false }
        }),
        observeBetfairSourceIdentitySample: () => { observeCount++; return { action: 'no-gate' }; },
        persistBetfairTrackingSample: (eventId, result, key, options) => {
            persistCount++;
            passedOptions = options;
            return { ok: true, status: 'recovered', commitId: 'recovered-commit' };
        }
    };

    const info = { betfairUrl: 'some-url', betfairFinished: false };
    const result = await updateBetfair('event-tech-recovered', info, deps);

    assert.equal(info.betfairFinished, false);
    assert.equal(observeCount, 0);
    assert.equal(persistCount, 1);
    assert.deepEqual(passedOptions, { repairOnly: true });
    assert.equal(result?.ok, true);
    assert.equal(result?.status, 'recovered');
    assert.equal(result?.commitId, 'recovered-commit');
});

await runTest('technical sample + repairOnly unchanged preserves existing technical behavior', async () => {
    let persistCount = 0;
    let passedOptions = null;
    let observeCount = 0;
    const deps = {
        ...defaultDeps,
        fetchBetfairData: () => Promise.resolve({
            error: 'temporary parser failure',
            runners: [],
            market_info: {},
            event_status: { hasFinished: false }
        }),
        observeBetfairSourceIdentitySample: () => { observeCount++; return { action: 'no-gate' }; },
        persistBetfairTrackingSample: (eventId, result, key, options) => {
            persistCount++;
            passedOptions = options;
            return undefined;
        }
    };

    const info = { betfairUrl: 'some-url', betfairFinished: false };
    const result = await updateBetfair('event-tech-unchanged', info, deps);

    assert.equal(info.betfairFinished, false);
    assert.equal(observeCount, 0);
    assert.equal(persistCount, 1);
    assert.deepEqual(passedOptions, { repairOnly: true });
    assert.equal(result, undefined);
    assert.equal(info.betfairRuntime.lastTechnicalErrorReason, 'technical_sample: temporary parser failure');
});

await runTest('technical sample + repairOnly failure is propagated without reducing it', async () => {
    let persistCount = 0;
    let passedOptions = null;
    let observeCount = 0;
    const failure = {
        ok: false,
        operation: 'betfair_commit',
        source: 'betfair',
        eventId: 'event-tech-failure',
        commitId: 'pending-commit',
        status: 'failed',
        reason: 'persistence_incomplete',
        failedDocument: 'history'
    };
    const deps = {
        ...defaultDeps,
        fetchBetfairData: () => Promise.resolve({
            error: 'temporary parser failure',
            runners: [],
            market_info: {},
            event_status: { hasFinished: false }
        }),
        observeBetfairSourceIdentitySample: () => { observeCount++; return { action: 'no-gate' }; },
        persistBetfairTrackingSample: (eventId, result, key, options) => {
            persistCount++;
            passedOptions = options;
            return failure;
        }
    };

    const info = { betfairUrl: 'some-url', betfairFinished: false };
    const result = await updateBetfair('event-tech-failure', info, deps);

    assert.equal(info.betfairFinished, false);
    assert.equal(observeCount, 0);
    assert.equal(persistCount, 1);
    assert.deepEqual(passedOptions, { repairOnly: true });
    assert.equal(result?.ok, false);
    assert.equal(result?.eventId, 'event-tech-failure');
    assert.equal(result?.commitId, 'pending-commit');
    assert.equal(result?.status, 'failed');
    assert.equal(result?.reason, 'persistence_incomplete');
    assert.equal(result?.failedDocument, 'history');
});

finish('betfairTrackerUpdate/technical');
