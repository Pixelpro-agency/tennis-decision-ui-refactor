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

await runTest('fetch rejection leaves polling active without gate or persistence', async () => {
    let keyCount = 0;
    let observeCount = 0;
    let persistCount = 0;
    const deps = {
        ...defaultDeps,
        fetchBetfairData: () => Promise.reject(new Error('DNS lookup failed')),
        getBetfairTrackingKey: () => { keyCount++; return 'unexpected-key'; },
        observeBetfairSourceIdentitySample: () => { observeCount++; return { action: 'no-gate' }; },
        persistBetfairTrackingSample: () => { persistCount++; }
    };

    const info = { betfairUrl: 'some-url', betfairFinished: false };
    await updateBetfair('event-fetch-error', info, deps);

    assert.equal(info.betfairFinished, false);
    assert.equal(keyCount, 0);
    assert.equal(observeCount, 0);
    assert.equal(persistCount, 0);
});

await runTest('runtime fetch rejection records attempt and safe error while polling stays active', async () => {
    const info = {
        betfairUrl: 'some-url',
        betfairFinished: false,
        betfairRuntime: {
            lastScrapeAttemptAt: null,
            lastSuccessfulScrapeAt: '2026-07-01T11:59:00.000Z',
            lastTechnicalErrorAt: null,
            lastTechnicalErrorReason: null
        }
    };

    await updateBetfair('event-runtime-fetch', info, {
        ...defaultDeps,
        now: createClock(
            '2026-07-01T12:00:00.000Z',
            '2026-07-01T12:00:01.000Z'
        ),
        fetchBetfairData: () => Promise.reject(new Error('DNS lookup failed'))
    });

    assert.equal(info.betfairFinished, false);
    assert.equal(info.betfairRuntime.lastScrapeAttemptAt, '2026-07-01T12:00:00.000Z');
    assert.equal(info.betfairRuntime.lastTechnicalErrorAt, '2026-07-01T12:00:01.000Z');
    assert.equal(info.betfairRuntime.lastTechnicalErrorReason, 'fetch_error: DNS lookup failed');
    assert.equal(info.betfairRuntime.lastSuccessfulScrapeAt, '2026-07-01T11:59:00.000Z');
});

await runTest('technical JSON sample records runtime error without finishing polling', async () => {
    const info = {
        betfairUrl: 'some-url',
        betfairFinished: false
    };

    await updateBetfair('event-runtime-technical', info, {
        ...defaultDeps,
        now: createClock(
            '2026-07-01T12:10:00.000Z',
            '2026-07-01T12:10:01.000Z'
        ),
        fetchBetfairData: () => Promise.resolve({
            error: 'parser failure\nretrying',
            runners: [],
            market_info: {},
            event_status: { hasFinished: false }
        })
    });

    assert.equal(info.betfairFinished, false);
    assert.equal(info.betfairRuntime.lastScrapeAttemptAt, '2026-07-01T12:10:00.000Z');
    assert.equal(info.betfairRuntime.lastTechnicalErrorAt, '2026-07-01T12:10:01.000Z');
    assert.equal(info.betfairRuntime.lastSuccessfulScrapeAt, null);
    assert.equal(info.betfairRuntime.lastTechnicalErrorReason, 'technical_sample: parser failure retrying');
    assert.equal(info.betfairRuntime.lastTechnicalErrorReason.includes('\n'), false);
});

await runTest('valid scrape after technical error clears the active runtime error in health', async () => {
    const info = {
        betfairUrl: 'some-url',
        betfairFinished: false
    };

    let fetchCount = 0;
    const clock = createClock(
        '2026-07-01T12:20:00.000Z',
        '2026-07-01T12:20:01.000Z',
        '2026-07-01T12:20:02.000Z',
        '2026-07-01T12:20:03.000Z'
    );

    const dependencies = {
        ...defaultDeps,
        now: clock,
        fetchBetfairData: () => {
            fetchCount += 1;
            return Promise.resolve(fetchCount === 1
                ? {
                    api_error: 'temporary logout',
                    runners: [],
                    market_info: {},
                    event_status: { hasFinished: false }
                }
                : createValidResult());
        }
    };

    await updateBetfair('event-runtime-recovery', info, dependencies);
    const errorAt = info.betfairRuntime.lastTechnicalErrorAt;

    await updateBetfair('event-runtime-recovery', info, dependencies);

    assert.equal(info.betfairFinished, false);
    assert.equal(info.betfairRuntime.lastSuccessfulScrapeAt, '2026-07-01T12:20:03.000Z');
    assert.ok(new Date(info.betfairRuntime.lastSuccessfulScrapeAt) > new Date(errorAt));

    const health = buildBetfairSessionHealth({
        betfairTimeline: null,
        runtime: info.betfairRuntime,
        now: new Date('2026-07-01T12:20:04.000Z')
    });

    assert.equal(health.metrics.technicalErrorActive, false);
});

await runTest('explicit finished sample records successful scrape timestamp before stopping', async () => {
    const info = {
        betfairUrl: 'some-url',
        betfairFinished: false
    };

    await updateBetfair('event-runtime-finished', info, {
        ...defaultDeps,
        now: createClock(
            '2026-07-01T12:30:00.000Z',
            '2026-07-01T12:30:01.000Z'
        ),
        fetchBetfairData: () => Promise.resolve({
            runners: [],
            market_info: { total_matched: 0 },
            event_status: { hasFinished: true }
        })
    });

    assert.equal(info.betfairFinished, true);
    assert.equal(info.betfairRuntime.lastScrapeAttemptAt, '2026-07-01T12:30:00.000Z');
    assert.equal(info.betfairRuntime.lastSuccessfulScrapeAt, '2026-07-01T12:30:01.000Z');
    assert.equal(info.betfairRuntime.lastTechnicalErrorAt, null);
});

await runTest('only boolean true is accepted as persistence success', async () => {
    const result = await updateBetfair(
        'event-strict-ok',
        { betfairUrl: 'some-url', betfairFinished: false },
        {
            ...defaultDeps,
            observeBetfairSourceIdentitySample: () => ({ action: 'no-gate' }),
            persistBetfairTrackingSample: () => ({
                ok: 'true',
                status: 'complete'
            })
        }
    );

    assert.equal(result?.ok, false);
    assert.equal(result?.status, 'complete');
});

finish('betfairTrackerUpdate/runtime');
