import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { createCommitJournalStore } from '../commitJournal.js';
import { runPendingCommitRecovery } from '../recovery.js';
import { repairSofaCommitFromJournal } from '../sofaUpdates.js';
import { repairBetfairCommitFromJournal } from '../../betfair/processor.js';
import {
    countJournalFiles,
    createFixture,
    finish,
    makeRecord,
    makeTempRoot,
    test
} from './recoveryTestFixtures.mjs';

await test('T01-no-journal', async () => {
    const fixture = createFixture();
    try {
        const summary = await runPendingCommitRecovery(fixture.dependencies);
        assert.equal(summary.ok, true);
        assert.equal(summary.fatal, false);
        assert.equal(summary.scanned, 0);
        assert.equal(summary.recovered, 0);
        assert.equal(summary.cleaned, 0);
        assert.equal(summary.retryablePending, 0);
        assert.equal(summary.recoveryFailed, 0);
        assert.equal(summary.alreadyRecoveryFailed, 0);
        assert.equal(summary.invalidJournal, 0);
        assert.equal(summary.outcomes.length, 0);
    } finally {
        fixture.cleanup();
    }
});

await test('T02-sofa-pending-single-document', async () => {
    const fixture = createFixture();
    try {
        const historyDocument = {
            metadata: { eventId: 'event-sofa' },
            history: [{ timestamp: '2026-07-07T12:00:00.000Z', commitId: 'sofa-commit-1', sofa: {} }]
        };
        const timelineDocument = {
            metadata: { eventId: 'event-sofa' },
            timeline: []
        };

        fixture.writeJournal('sofa-commit-1', makeRecord({
            commitId: 'sofa-commit-1',
            eventId: 'event-sofa',
            source: 'sofa',
            historyCompleted: false,
            timelineCompleted: true,
            historyDocument,
            timelineDocument
        }));

        const summary = await runPendingCommitRecovery(fixture.dependencies);

        assert.equal(summary.ok, true);
        assert.equal(summary.fatal, false);
        assert.equal(summary.scanned, 1);
        assert.equal(summary.recovered, 1);
        assert.equal(summary.cleaned, 0);
        assert.equal(summary.retryablePending, 0);
        assert.equal(summary.recoveryFailed, 0);
        assert.equal(summary.alreadyRecoveryFailed, 0);
        assert.equal(summary.invalidJournal, 0);
        assert.equal(fixture.historyWrites.length, 1);
        assert.equal(fixture.timelineWrites.length, 0);
        assert.equal(fixture.historyWrites[0].commitId, 'sofa-commit-1');
        assert.deepEqual(fixture.historyWrites[0].document, historyDocument);
        assert.equal(fixture.historyWrites[0].target, '/history/event-sofa.json');
        assert.equal(countJournalFiles(fixture), 0);
    } finally {
        fixture.cleanup();
    }
});

await test('T05-structurally-invalid-record', async () => {
    const fixture = createFixture();
    try {
        fixture.writeJournal('invalid-structure-1', {
            version: 1,
            commitId: 'invalid-structure-1',
            eventId: 'event-invalid',
            source: 'sofa',
            createdAt: new Date().toISOString(),
            status: 'pending',
            reason: null,
            documents: {
                history: {
                    target: '/history/event-invalid.json',
                    payload: 'not-an-object',
                    completed: false
                },
                timeline: {
                    target: '/timeline/sofa_event-invalid.json',
                    payload: { document: { metadata: {} }, metadata: {} },
                    completed: true
                }
            }
        });

        const summary = await runPendingCommitRecovery(fixture.dependencies);

        assert.equal(summary.ok, true);
        assert.equal(summary.scanned, 1);
        assert.equal(summary.recovered, 0);
        assert.equal(summary.cleaned, 0);
        assert.equal(summary.retryablePending, 0);
        assert.equal(summary.recoveryFailed, 1);
        assert.equal(fixture.historyWrites.length, 0);
        assert.equal(fixture.timelineWrites.length, 0);
        assert.equal(countJournalFiles(fixture), 1);

        const raw = JSON.parse(fs.readFileSync(fixture.journalFile('invalid-structure-1'), 'utf8'));
        assert.equal(raw.status, 'recovery_failed');
        assert.equal(raw.reason, 'invalid_journal_structure');
    } finally {
        fixture.cleanup();
    }
});

await test('T09-unparsable-journal-is-invalid', async () => {
    const fixture = createFixture();
    try {
        fs.writeFileSync(path.join(fixture.journalDir, 'broken.json'), '{not-json', 'utf8');

        const summary = await runPendingCommitRecovery(fixture.dependencies);

        assert.equal(summary.ok, true);
        assert.equal(summary.fatal, false);
        assert.equal(summary.scanned, 0);
        assert.equal(summary.invalidJournal, 1);
        assert.equal(fixture.historyWrites.length, 0);
        assert.equal(fixture.timelineWrites.length, 0);

        const outcome = summary.outcomes[0];
        assert.equal(outcome.category, 'invalid_journal');
        assert.equal(outcome.reason, 'invalid_journal');
        assert.equal(outcome.commitId, null);
    } finally {
        fixture.cleanup();
    }
});

await test('T12-unknown-status-is-invalid-record', async () => {
    const fixture = createFixture();
    try {
        fixture.writeJournal('unknown-status-1', makeRecord({
            commitId: 'unknown-status-1',
            eventId: 'event-unknown-status',
            source: 'sofa',
            status: 'unknown',
            reason: null,
            historyCompleted: true,
            timelineCompleted: true,
            historyDocument: { metadata: { eventId: 'event-unknown-status' }, history: [] },
            timelineDocument: { metadata: { eventId: 'event-unknown-status' }, timeline: [] }
        }));

        const summary = await runPendingCommitRecovery(fixture.dependencies);

        assert.equal(summary.ok, true);
        assert.equal(summary.scanned, 1);
        assert.equal(summary.recovered, 0);
        assert.equal(summary.cleaned, 0);
        assert.equal(summary.retryablePending, 0);
        assert.equal(summary.recoveryFailed, 1);
        assert.equal(summary.alreadyRecoveryFailed, 0);
        assert.equal(summary.invalidJournal, 0);
        assert.equal(fixture.historyWrites.length, 0);
        assert.equal(fixture.timelineWrites.length, 0);

        const raw = JSON.parse(fs.readFileSync(fixture.journalFile('unknown-status-1'), 'utf8'));
        assert.equal(raw.status, 'recovery_failed');
        assert.equal(raw.reason, 'invalid_journal_structure');

        const second = await runPendingCommitRecovery(fixture.dependencies);
        assert.equal(second.scanned, 1);
        assert.equal(second.recoveryFailed, 0);
        assert.equal(second.alreadyRecoveryFailed, 1);
        assert.equal(second.recovered, 0);
        assert.equal(second.cleaned, 0);
        assert.equal(second.retryablePending, 0);
        assert.equal(fixture.historyWrites.length, 0);
        assert.equal(fixture.timelineWrites.length, 0);
    } finally {
        fixture.cleanup();
    }
});

await test('T13-missing-target-is-invalid-record', async () => {
    const fixture = createFixture();
    try {
        fixture.writeJournal('missing-target-1', {
            version: 1,
            commitId: 'missing-target-1',
            eventId: 'event-missing-target',
            source: 'sofa',
            createdAt: new Date().toISOString(),
            status: 'pending',
            reason: null,
            documents: {
                history: {
                    target: '',
                    payload: { document: { metadata: {} }, metadata: {} },
                    completed: false
                },
                timeline: {
                    target: '/timeline/sofa_event-missing-target.json',
                    payload: { document: { metadata: {} }, metadata: {} },
                    completed: true
                }
            }
        });

        const summary = await runPendingCommitRecovery(fixture.dependencies);

        assert.equal(summary.ok, true);
        assert.equal(summary.scanned, 1);
        assert.equal(summary.recoveryFailed, 1);
        assert.equal(fixture.historyWrites.length, 0);
        assert.equal(fixture.timelineWrites.length, 0);

        const raw = JSON.parse(fs.readFileSync(fixture.journalFile('missing-target-1'), 'utf8'));
        assert.equal(raw.status, 'recovery_failed');
        assert.equal(raw.reason, 'invalid_journal_structure');

        const second = await runPendingCommitRecovery(fixture.dependencies);
        assert.equal(second.alreadyRecoveryFailed, 1);
        assert.equal(second.recoveryFailed, 0);
    } finally {
        fixture.cleanup();
    }
});

await test('T16-unsafe-json-is-invalid-journal', async () => {
    const fixture = createFixture();
    try {
        fs.writeFileSync(
            path.join(fixture.journalDir, 'unsafe.json'),
            JSON.stringify({
                version: 1,
                commitId: 'unsafe-1',
                eventId: 'event-unsafe',
                source: 'sofa',
                createdAt: new Date().toISOString(),
                status: 'pending',
                reason: null,
                documents: {
                    history: {
                        target: '/history/event-unsafe.json',
                        payload: { diagnostics: { url: 'https://api.test/data?token=secret' } },
                        completed: false
                    },
                    timeline: {
                        target: '/timeline/sofa_event-unsafe.json',
                        payload: { document: { metadata: {} }, metadata: {} },
                        completed: true
                    }
                }
            }, null, 2),
            'utf8'
        );

        const summary = await runPendingCommitRecovery(fixture.dependencies);

        assert.equal(summary.ok, true);
        assert.equal(summary.scanned, 0);
        assert.equal(summary.invalidJournal, 1);
        assert.equal(summary.recoveryFailed, 0);
        assert.equal(summary.alreadyRecoveryFailed, 0);
        assert.equal(fixture.historyWrites.length, 0);
        assert.equal(fixture.timelineWrites.length, 0);

        const outcome = summary.outcomes[0];
        assert.equal(outcome.category, 'invalid_journal');
    } finally {
        fixture.cleanup();
    }
});

await test('T17-invalid-record-never-reaches-adapters', async () => {
    const fixture = createFixture();
    try {
        fixture.dependencies.writeHistoryDocument = () => {
            throw new Error('history adapter must not be called');
        };
        fixture.dependencies.writeTimelineDocument = () => {
            throw new Error('timeline adapter must not be called');
        };

        fixture.writeJournal('adapter-guard-1', {
            version: 1,
            commitId: 'adapter-guard-1',
            eventId: 'event-adapter-guard',
            source: 'sofa',
            createdAt: new Date().toISOString(),
            status: 'pending',
            reason: null,
            documents: {
                history: {
                    target: '',
                    payload: { document: { metadata: {} }, metadata: {} },
                    completed: false
                },
                timeline: {
                    target: '/timeline/sofa_event-adapter-guard.json',
                    payload: { document: { metadata: {} }, metadata: {} },
                    completed: true
                }
            }
        });

        const summary = await runPendingCommitRecovery(fixture.dependencies);

        assert.equal(summary.recoveryFailed, 1);
        assert.equal(summary.recovered, 0);
        assert.equal(summary.retryablePending, 0);
    } finally {
        fixture.cleanup();
    }
});

await test('T21-completed-target-invalid-json', async () => {
    const fixture = createFixture();
    try {
        const historyDocument = {
            metadata: { eventId: 'event-invalid-json' },
            history: [{ timestamp: '2026-07-07T12:00:00.000Z', commitId: 'invalid-json-1', sofa: {} }]
        };
        const timelineDocument = {
            metadata: { eventId: 'event-invalid-json' },
            timeline: []
        };

        fixture.writeJournal('invalid-json-1', makeRecord({
            commitId: 'invalid-json-1',
            eventId: 'event-invalid-json',
            source: 'sofa',
            historyCompleted: true,
            timelineCompleted: true,
            historyDocument,
            timelineDocument
        }));

        fixture.dependencies.verifyDocumentTarget = target => {
            if (target === '/history/event-invalid-json.json') {
                return { ok: false, reason: 'invalid_json' };
            }
            return { ok: true, reason: null };
        };

        const summary = await runPendingCommitRecovery(fixture.dependencies);

        assert.equal(summary.ok, true);
        assert.equal(summary.scanned, 1);
        assert.equal(summary.recovered, 1);
        assert.equal(summary.cleaned, 0);
        assert.equal(summary.retryablePending, 0);
        assert.equal(fixture.historyWrites.length, 1);
        assert.equal(fixture.timelineWrites.length, 0);
        assert.deepEqual(fixture.historyWrites[0].document, historyDocument);
        assert.equal(countJournalFiles(fixture), 0);
    } finally {
        fixture.cleanup();
    }
});

finish('recovery/invalid');
