import path from 'node:path';
import fsDefault from 'node:fs';
import os from 'node:os';
import { createHistoryStorage } from '../storage.js';
import { createCommitJournalStore } from '../commitJournal.js';
import {
    assert,
    countFiles,
    createFakeFs,
    createFixture,
    finish,
    journalFile,
    makeRecord
} from './commitJournalTestFixtures.mjs';

{
    const { fake, store } = createFixture();
    const record = makeRecord({
        commitId: 'commit-forbidden',
        eventId: 'event-forbidden',
        historyPayload: {
            safe: {
                Authorization: 'sensitive-value'
            }
        }
    });

    const result = store.createPendingCommit(record);

    assert(
        'T17-forbidden-payload-key-is-rejected',
        result.ok === false &&
            result.status === 'failed' &&
            result.reason === 'invalid_record' &&
            countFiles(fake, fileName => fileName.endsWith('.json')) === 0
    );
}

{
    const rejectedPayloads = [
        { nested: { profileDir: 'value' } },
        { nested: [{ browserProfilePath: 'value' }] },
        { rawBrowserPayload: { value: true } },
        { browserRawPayload: { value: true } },
        { raw_payload_browser: { value: true } },
        { networkCapture: { value: true } },
        { network_dump: { value: true } },
        { networkPayload: { value: true } },
        { nested: { browser: { profile: 'value' } } }
    ];

    for (const [index, historyPayload] of rejectedPayloads.entries()) {
        const { fake, store } = createFixture();
        const result = store.createPendingCommit(makeRecord({
            commitId: `commit-sensitive-${index}`,
            eventId: `event-sensitive-${index}`,
            historyPayload,
            timelinePayload: { entries: [] }
        }));

        assert(
            `T20-sensitive-key-variant-${index + 1}-is-rejected`,
            result.ok === false &&
                result.operation === 'journal' &&
                result.status === 'failed' &&
                result.reason === 'invalid_record' &&
                countFiles(fake, fileName => fileName.endsWith('.json')) === 0
        );
    }
}

{
    const { store } = createFixture();
    const result = store.createPendingCommit(makeRecord({
        commitId: 'commit-network-summary',
        eventId: 'event-network-summary',
        source: 'betfair',
        timelinePayload: {
            diagnostics: {
                networkCaptureSummary: {
                    enabled: false,
                    response_count: 0,
                    json_count: 0,
                    errors_count: 0,
                    candidates_count: 0
                }
            }
        }
    }));

    assert(
        'T-network-capture-summary-is-accepted',
        result.ok === true &&
            result.status === 'created'
    );
}

{
    const { store } = createFixture();
    const result = store.createPendingCommit(makeRecord({
        commitId: 'commit-network-raw',
        eventId: 'event-network-raw',
        source: 'betfair',
        timelinePayload: {
            diagnostics: {
                networkCapture: {
                    token: 'must-not-be-journaled'
                }
            }
        }
    }));

    assert(
        'T-network-raw-remains-rejected',
        result.ok === false &&
            result.status === 'failed' &&
            result.reason === 'invalid_record'
    );
}

{
    const strictSummary = () => ({
        enabled: false,
        response_count: 0,
        json_count: 0,
        errors_count: 0,
        candidates_count: 0
    });

    const { store } = createFixture();
    const result = store.createPendingCommit(makeRecord({
        commitId: 'commit-network-summary-strict',
        eventId: 'event-network-summary-strict',
        source: 'betfair',
        timelinePayload: {
            diagnostics: {
                networkCaptureSummary: strictSummary()
            }
        }
    }));

    assert(
        'T33-network-capture-summary-strict-valid-is-accepted',
        result.ok === true &&
            result.status === 'created'
    );
}

{
    const strictSummary = () => ({
        enabled: false,
        response_count: 0,
        json_count: 0,
        errors_count: 0,
        candidates_count: 0
    });
    const invalidCases = [
        {
            label: 'outside-diagnostics',
            timelinePayload: {
                networkCaptureSummary: strictSummary()
            }
        },
        {
            label: 'nested-under-diagnostics',
            timelinePayload: {
                diagnostics: {
                    nested: {
                        networkCaptureSummary: strictSummary()
                    }
                }
            }
        },
        {
            label: 'inside-diagnostics-array',
            timelinePayload: {
                diagnostics: [{
                    networkCaptureSummary: strictSummary()
                }]
            }
        },
        {
            label: 'raw-url',
            timelinePayload: {
                diagnostics: {
                    networkCaptureSummary: {
                        ...strictSummary(),
                        url: 'https://example.test/raw'
                    }
                }
            }
        },
        {
            label: 'raw-request-dump',
            timelinePayload: {
                diagnostics: {
                    networkCaptureSummary: {
                        ...strictSummary(),
                        requestDump: { method: 'GET' }
                    }
                }
            }
        },
        {
            label: 'missing-field',
            timelinePayload: {
                diagnostics: {
                    networkCaptureSummary: {
                        enabled: false,
                        response_count: 0,
                        json_count: 0,
                        errors_count: 0
                    }
                }
            }
        },
        {
            label: 'invalid-counter',
            timelinePayload: {
                diagnostics: {
                    networkCaptureSummary: {
                        ...strictSummary(),
                        candidates_count: -1
                    }
                }
            }
        },
        {
            label: 'invalid-enabled',
            timelinePayload: {
                diagnostics: {
                    networkCaptureSummary: {
                        ...strictSummary(),
                        enabled: 'false'
                    }
                }
            }
        }
    ];

    for (const [index, invalid] of invalidCases.entries()) {
        const { fake, store } = createFixture();
        const result = store.createPendingCommit(makeRecord({
            commitId: `commit-network-summary-invalid-${index}`,
            eventId: `event-network-summary-invalid-${index}`,
            source: 'betfair',
            timelinePayload: invalid.timelinePayload
        }));

        assert(
            `T34-network-capture-summary-${invalid.label}-is-rejected`,
            result.ok === false &&
                result.status === 'failed' &&
                result.reason === 'invalid_record' &&
                countFiles(fake, fileName => fileName.endsWith('.json')) === 0
        );
    }
}

{
    const forbiddenPayloads = [
        { cookie: 'x' },
        { token: 'x' },
        { authorization: 'x' },
        { header: 'x' },
        { credential: 'x' },
        { password: 'x' },
        { secret: 'x' },
        { browser: 'x' },
        { profile: 'x' },
        { networkCapture: { raw: true } },
        { networkPayload: { raw: true } },
        { captureDump: { raw: true } }
    ];

    for (const [index, payload] of forbiddenPayloads.entries()) {
        const { fake, store } = createFixture();
        const result = store.createPendingCommit(makeRecord({
            commitId: `commit-forbidden-sensitive-${index}`,
            eventId: `event-forbidden-sensitive-${index}`,
            source: 'betfair',
            timelinePayload: { diagnostics: payload }
        }));

        assert(
            `T35-forbidden-network-or-sensitive-key-${index + 1}-is-rejected`,
            result.ok === false &&
                result.status === 'failed' &&
                result.reason === 'invalid_record' &&
                countFiles(fake, fileName => fileName.endsWith('.json')) === 0
        );
    }
}

{
    const { fake, store } = createFixture();
    const result = store.createPendingCommit(makeRecord({
        commitId: 'commit-token-url',
        eventId: 'event-token-url',
        source: 'betfair',
        historyPayload: {
            diagnostics: {
                url: 'https://api.example.test/data?token=secret-value'
            }
        }
    }));

    assert(
        'T39-token-query-parameter-is-rejected',
        result.ok === false &&
            result.status === 'failed' &&
            result.reason === 'invalid_record' &&
            countFiles(fake, fileName => fileName.endsWith('.json')) === 0
    );
}

{
    const { fake, store } = createFixture();
    const result = store.createPendingCommit(makeRecord({
        commitId: 'commit-access-token-url',
        eventId: 'event-access-token-url',
        source: 'betfair',
        timelinePayload: {
            diagnostics: {
                url: 'https://api.example.test/data?access_token=secret-value'
            }
        }
    }));

    assert(
        'T40-access-token-query-parameter-is-rejected',
        result.ok === false &&
            result.status === 'failed' &&
            result.reason === 'invalid_record' &&
            countFiles(fake, fileName => fileName.endsWith('.json')) === 0
    );
}

{
    const { fake, journalDir, store } = createFixture();
    const file = journalFile(journalDir, 'commit-raw-unsafe');
    const raw = {
        version: 1,
        commitId: 'commit-raw-unsafe',
        eventId: 'event-raw-unsafe',
        source: 'sofa',
        createdAt: '2026-07-05T12:00:00.000Z',
        status: 'pending',
        reason: null,
        documents: {
            history: {
                target: 'history-commit-raw-unsafe.json',
                payload: { diagnostics: { url: 'https://api.test/data?token=secret' } },
                completed: false
            },
            timeline: {
                target: 'timeline-commit-raw-unsafe.json',
                payload: { kind: 'timeline' },
                completed: true
            }
        }
    };
    const rawString = JSON.stringify(raw);
    fake.dirs.add(journalDir);
    fake.seed(file, rawString);

    const result = store.markRecoveryFailed('commit-raw-unsafe', 'invalid_journal_structure');

    assert(
        'T45-raw-unsafe-mark-recovery-failed-rejected',
        result.ok === false &&
            result.status === 'failed' &&
            result.reason === 'invalid_journal' &&
            fake.files.get(file) === rawString
    );
}

finish('commitJournal/safety');
