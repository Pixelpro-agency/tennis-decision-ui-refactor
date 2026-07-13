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

await test('T11-repair-adapters-are-direct', async () => {
    const fixture = createFixture();
    try {
        const historyDocument = {
            metadata: { eventId: 'event-direct' },
            history: [{ timestamp: '2026-07-07T12:00:00.000Z', commitId: 'direct-1', sofa: {} }]
        };
        const timelineDocument = {
            metadata: { eventId: 'event-direct' },
            timeline: []
        };

        const record = makeRecord({
            commitId: 'direct-1',
            eventId: 'event-direct',
            source: 'sofa',
            historyCompleted: false,
            timelineCompleted: true,
            historyDocument,
            timelineDocument
        });

        fixture.writeJournal('direct-1', record);

        const result = repairSofaCommitFromJournal(record, fixture.dependencies);
        assert.equal(result.ok, true);
        assert.equal(result.status, 'recovered');
        assert.equal(fixture.historyWrites.length, 1);
        assert.equal(fixture.timelineWrites.length, 0);

        const betfairRecord = makeRecord({
            commitId: 'direct-2',
            eventId: 'event-direct-betfair',
            source: 'betfair',
            historyCompleted: true,
            timelineCompleted: false,
            historyDocument: { metadata: { eventId: 'event-direct-betfair' }, history: [] },
            timelineDocument: { metadata: { eventId: 'event-direct-betfair' }, timeline: [] }
        });

        fixture.writeJournal('direct-2', betfairRecord);

        const betfairResult = repairBetfairCommitFromJournal(betfairRecord, fixture.dependencies);
        assert.equal(betfairResult.ok, true);
        assert.equal(betfairResult.status, 'recovered');
        assert.equal(fixture.timelineWrites.length, 1);
    } finally {
        fixture.cleanup();
    }
});

finish('recovery/basic');
