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

const { assert, finish } = createAssertionSuite('timelineStore/saveTimeline.integration.test');

{
    const eventId = `test_fixture_1_${process.pid}_${Date.now()}`;
    try {
        const metadata = {
            date: '2026-06-26',
            tournament: 'Test Tournament',
            players: { home: 'Player A', away: 'Player B' }
        };
        const entryData = { score: '1-0', point: '15-0' };
        
        const result = saveTimeline('sofa', eventId, entryData, metadata);
        
        assert(
            'TC1-result-is-structured-written',
            result?.ok === true &&
                result.operation === 'timeline' &&
                result.source === 'sofa' &&
                result.eventId === eventId &&
                result.status === 'written' &&
                result.reason === null &&
                typeof result.file === 'string'
        );
        
        const filepath = getTimelineFile('sofa', eventId, metadata);
        assert('TC1-file-exists', fs.existsSync(filepath));
        
        const fileContent = JSON.parse(fs.readFileSync(filepath, 'utf8'));
        assert('TC1-valid-json-metadata', fileContent.metadata.eventId === eventId && fileContent.metadata.tournament === 'Test Tournament');
        assert('TC1-first-tick-present', fileContent.timeline.length === 1 && JSON.stringify(fileContent.timeline[0].data) === JSON.stringify(entryData));
        assert('TC1-no-tmp-residuo', countTmpFiles(eventId) === 0);
    } finally {
        cleanupFixture(eventId);
    }
}

{
    const eventId = `test_fixture_2_${process.pid}_${Date.now()}`;
    try {
        const metadata = {
            date: '2026-06-26',
            tournament: 'Test Tournament',
            players: { home: 'Player A', away: 'Player B' }
        };
        const entryData1 = { score: '1-0', point: '15-0' };
        const entryData2 = { score: '1-0', point: '30-0' };
        
        saveTimeline('sofa', eventId, entryData1, metadata);
        const result = saveTimeline('sofa', eventId, entryData2, metadata);
        
        assert(
            'TC2-result-is-structured-written',
            result?.ok === true &&
                result.operation === 'timeline' &&
                result.source === 'sofa' &&
                result.eventId === eventId &&
                result.status === 'written' &&
                result.reason === null &&
                typeof result.file === 'string'
        );
        
        const filepath = getTimelineFile('sofa', eventId, metadata);
        const fileContent = JSON.parse(fs.readFileSync(filepath, 'utf8'));
        
        assert('TC2-two-ticks-present', fileContent.timeline.length === 2);
        assert('TC2-last-tick-matches', JSON.stringify(fileContent.timeline[1].data) === JSON.stringify(entryData2));
        assert('TC2-no-tmp-residuo', countTmpFiles(eventId) === 0);
    } finally {
        cleanupFixture(eventId);
    }
}

{
    const eventId = `test_fixture_3_${process.pid}_${Date.now()}`;
    try {
        const metadata = {
            date: '2026-06-26',
            tournament: 'Test Tournament',
            players: { home: 'Player A', away: 'Player B' }
        };
        const entryData = { score: '1-0', point: '15-0' };
        
        saveTimeline('sofa', eventId, entryData, metadata);
        
        const filepath = getTimelineFile('sofa', eventId, metadata);
        const contentBefore = fs.readFileSync(filepath, 'utf8');
        
        const result = saveTimeline('sofa', eventId, entryData, metadata);
        
        const contentAfter = fs.readFileSync(filepath, 'utf8');
        const fileContent = JSON.parse(contentAfter);
        
        assert(
            'TC3-result-is-structured-unchanged',
            result?.ok === true &&
                result.operation === 'timeline' &&
                result.source === 'sofa' &&
                result.eventId === eventId &&
                result.status === 'unchanged' &&
                result.reason === null &&
                typeof result.file === 'string'
        );
        assert('TC3-no-tick-added', fileContent.timeline.length === 1);
        assert('TC3-content-unchanged', contentBefore === contentAfter);
        assert('TC3-no-tmp-residuo', countTmpFiles(eventId) === 0);
    } finally {
        cleanupFixture(eventId);
    }
}

{
    const eventId = `test_fixture_4_${process.pid}_${Date.now()}`;
    const originalRenameSync = fs.renameSync;
    const originalConsoleError = console.error;
    try {
        const metadata = {
            date: '2026-06-26',
            tournament: 'Test Tournament',
            players: { home: 'Player A', away: 'Player B' }
        };
        const entryData1 = { score: '1-0', point: '15-0' };
        
        saveTimeline('sofa', eventId, entryData1, metadata);
        
        const filepath = getTimelineFile('sofa', eventId, metadata);
        assert('TC4-canonical-file-exists', fs.existsSync(filepath));
        const contentBefore = fs.readFileSync(filepath, 'utf8');
        
        console.error = () => {};
        
        fs.renameSync = (oldPath, newPath) => {
            if (newPath.includes(eventId)) {
                throw new Error('Simulated rename error');
            }
            return originalRenameSync(oldPath, newPath);
        };
        
        const entryData2 = { score: '1-0', point: '30-0' };
        
        const result = saveTimeline('sofa', eventId, entryData2, metadata);
        assert(
            'TC4-returns-failed-result-without-false-success',
            result?.ok === false &&
                result.operation === 'timeline' &&
                result.source === 'sofa' &&
                result.eventId === eventId &&
                result.status === 'failed' &&
                result.reason === 'write_failed' &&
                result.file === null
        );
        
        const contentAfter = fs.readFileSync(filepath, 'utf8');
        assert('TC4-file-remains-unaltered', contentBefore === contentAfter);
        assert('TC4-tmp-is-removed', countTmpFiles(eventId) === 0);
        
    } finally {
        fs.renameSync = originalRenameSync;
        console.error = originalConsoleError;
        cleanupFixture(eventId);
    }
}

{
        const result = saveTimeline('sofa', '', { score: 'invalid' });

        assert(
            'TC8-invalid-event-returns-failed-result',
            result?.ok === false &&
                result.operation === 'timeline' &&
                result.source === 'sofa' &&
                result.eventId === '' &&
                result.status === 'failed' &&
                result.reason === 'invalid_event_id' &&
                result.file === null
        );
    }

finish();
