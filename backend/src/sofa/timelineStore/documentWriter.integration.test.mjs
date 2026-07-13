import {
    saveTimeline,
    loadTimeline,
    writeTimelineDocument,
    getTimelineFile
} from '../timelineStore.js';
import {
    fs,
    path,
    DATA_DIR,
    cleanupFixture,
    countTmpFiles,
    createAssertionSuite
} from './timelineStoreTestFixtures.mjs';

const { assert, finish } = createAssertionSuite('timelineStore/documentWriter.integration.test');

{
        const eventId = `test_fixture_5_${process.pid}_${Date.now()}`;
        try {
            const metadata = {
                date: '2026-06-26',
                tournament: 'Test Tournament',
                players: { home: 'Player A', away: 'Player B' }
            };
            const entryData1 = { score: '1-0', point: '15-0' };
            const entryData2 = { score: '1-0', point: '30-0' };

            saveTimeline('sofa', eventId, entryData1, metadata);

            const doc = loadTimeline('sofa', eventId);
            assert('TC5-doc-loaded', !!doc);
            assert(
                'TC5-doc-has-timeline',
                Array.isArray(doc?.timeline) && doc.timeline.length === 1
            );

            doc.timeline.push({
                timestamp: new Date().toISOString(),
                elapsedSeconds: 10,
                data: entryData2
            });

            const result = writeTimelineDocument('sofa', eventId, doc, metadata);

            assert(
                'TC5-write-returns-structured-written',
                result?.ok === true &&
                    result.operation === 'timeline' &&
                    result.source === 'sofa' &&
                    result.eventId === eventId &&
                    result.status === 'written' &&
                    result.reason === null &&
                    typeof result.file === 'string'
            );

            if (result?.ok === true) {
                assert('TC5-file-exists', fs.existsSync(result.file));

                const fileContent = JSON.parse(fs.readFileSync(result.file, 'utf8'));
                assert('TC5-timeline-has-new-tick', fileContent.timeline.length === 2);
                assert(
                    'TC5-new-tick-matches',
                    JSON.stringify(fileContent.timeline[1].data) === JSON.stringify(entryData2)
                );
            } else {
                assert('TC5-file-exists', false);
                assert('TC5-timeline-has-new-tick', false);
                assert('TC5-new-tick-matches', false);
            }

            assert('TC5-no-tmp-residuo', countTmpFiles(eventId) === 0);
        } finally {
            cleanupFixture(eventId);
        }
    }

{
        const eventId = `test_fixture_6_${process.pid}_${Date.now()}`;
        const originalRenameSync = fs.renameSync;
        const originalConsoleError = console.error;

        try {
            const metadata = {
                date: '2026-06-26',
                tournament: 'Test Tournament',
                players: { home: 'Player A', away: 'Player B' }
            };

            const initialResult = saveTimeline(
                'sofa',
                eventId,
                { score: '1-0', point: '15-0' },
                metadata
            );
            assert('TC6-initial-write-succeeds', initialResult?.ok === true);

            if (initialResult?.ok !== true) {
                assert('TC6-direct-writer-returns-failed-result', false);
                assert('TC6-canonical-file-remains-unaltered', false);
                assert('TC6-tmp-is-removed', false);
            } else {
                const canonicalBefore = fs.readFileSync(initialResult.file, 'utf8');
                const doc = loadTimeline('sofa', eventId);

                doc.timeline.push({
                    timestamp: new Date().toISOString(),
                    elapsedSeconds: 10,
                    data: { score: '2-0', point: '30-0' }
                });

                console.error = () => {};
                fs.renameSync = (oldPath, newPath) => {
                    if (newPath.includes(eventId)) {
                        throw new Error('Simulated direct writer rename error');
                    }
                    return originalRenameSync(oldPath, newPath);
                };

                const result = writeTimelineDocument('sofa', eventId, doc, metadata);

                assert(
                    'TC6-direct-writer-returns-failed-result',
                    result?.ok === false &&
                        result.operation === 'timeline' &&
                        result.source === 'sofa' &&
                        result.eventId === eventId &&
                        result.status === 'failed' &&
                        result.reason === 'write_failed' &&
                        result.file === null
                );
                assert(
                    'TC6-canonical-file-remains-unaltered',
                    fs.readFileSync(initialResult.file, 'utf8') === canonicalBefore
                );
                assert('TC6-tmp-is-removed', countTmpFiles(eventId) === 0);
            }
        } finally {
            fs.renameSync = originalRenameSync;
            console.error = originalConsoleError;
            cleanupFixture(eventId);
        }
    }

{
        const result = writeTimelineDocument('sofa', '', { timeline: [] });

        assert(
            'TC7-direct-writer-invalid-event-returns-failed-result',
            result?.ok === false &&
                result.operation === 'timeline' &&
                result.source === 'sofa' &&
                result.eventId === '' &&
                result.status === 'failed' &&
                result.reason === 'invalid_event_id' &&
                result.file === null
        );
    }

{
    const eventId = `test_fixture_commit_id_${process.pid}_${Date.now()}`;
    try {
        const metadata = {
            date: '2026-06-26',
            tournament: 'CommitId Tournament',
            players: { home: 'Player A', away: 'Player B' }
        };
        const document = { metadata: { eventId, source: 'sofa' }, timeline: [] };
        const result = writeTimelineDocument('sofa', eventId, document, metadata, null, null);

        assert(
            'TC14-writer-without-commitId-has-null',
            result?.ok === true && result.commitId === null
        );
    } finally {
        cleanupFixture(eventId);
    }
}

{
    const eventId = `test_fixture_commit_id_passed_${process.pid}_${Date.now()}`;
    try {
        const metadata = {
            date: '2026-06-26',
            tournament: 'CommitId Tournament',
            players: { home: 'Player A', away: 'Player B' }
        };
        const target = getTimelineFile('sofa', eventId, metadata);
        const document = { metadata: { eventId, source: 'sofa' }, timeline: [] };
        const result = writeTimelineDocument('sofa', eventId, document, metadata, target, 'sofa-abc-123');

        assert(
            'TC15-writer-with-commitId-returns-same-commitId',
            result?.ok === true && result.commitId === 'sofa-abc-123'
        );
    } finally {
        cleanupFixture(eventId);
    }
}

{
    const eventId = `test_fixture_commit_id_fail_${process.pid}_${Date.now()}`;
    const originalRenameSync = fs.renameSync;
    const originalConsoleError = console.error;
    try {
        const metadata = {
            date: '2026-06-26',
            tournament: 'CommitId Tournament',
            players: { home: 'Player A', away: 'Player B' }
        };
        const target = getTimelineFile('sofa', eventId, metadata);
        const document = { metadata: { eventId, source: 'sofa' }, timeline: [] };

        console.error = () => {};
        fs.renameSync = () => { throw new Error('Simulated rename error'); };

        const result = writeTimelineDocument('sofa', eventId, document, metadata, target, 'sofa-fail-123');

        assert(
            'TC16-writer-failure-preserves-commitId',
            result?.ok === false &&
                result.status === 'failed' &&
                result.commitId === 'sofa-fail-123'
        );
    } finally {
        fs.renameSync = originalRenameSync;
        console.error = originalConsoleError;
        cleanupFixture(eventId);
    }
}

finish();
