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

const { assert, finish } = createAssertionSuite('timelineStore/targetResolution.integration.test');

{
        const eventId = `test_fixture_9_${process.pid}_${Date.now()}`;
        try {
            const metadata = {
                date: '2026-06-26',
                tournament: 'Test Tournament',
                players: { home: 'Player A', away: 'Player B' }
            };
            const target = getTimelineFile('sofa', eventId, metadata);
            const document = {
                metadata: { eventId, source: 'sofa' },
                timeline: []
            };
            const writeResult = writeTimelineDocument('sofa', eventId, document, metadata, target);
            const writesAfterCanonicalTarget = fs.readdirSync(DATA_DIR).length;
            const rejectedResult = writeTimelineDocument(
                'sofa',
                eventId,
                { metadata: { eventId, source: 'sofa' }, timeline: [{ timestamp: 't' }] },
                metadata,
                path.join(DATA_DIR, `wrong_${eventId}.json`)
            );

            assert(
                'TC9-direct-writer-persists-canonical-target',
                writeResult?.ok === true && writeResult.file === target && fs.existsSync(target)
            );
            assert(
                'TC10-direct-writer-rejects-noncanonical-target',
                rejectedResult?.ok === false &&
                    rejectedResult.reason === 'write_failed' &&
                    rejectedResult.file === null &&
                    fs.readdirSync(DATA_DIR).length === writesAfterCanonicalTarget
            );
        } finally {
            cleanupFixture(eventId);
        }
    }

{
    const eventId = "test_fixture_11_" + process.pid + "_" + Date.now();
    const metadata = { date: "2026-06-26", tournament: "Resolver Tournament", players: { home: "Player A", away: "Player B" } };
    const candidateNames = [
        "sofa_2026-06-25_A_Open_Player_A_vs_Player_B_" + eventId + ".json",
        "sofa_2026-06-26_Z_Open_Player_A_vs_Player_B_" + eventId + ".json"
    ].sort();
    const canonicalTarget = path.join(DATA_DIR, candidateNames[0]);
    const alternateTarget = path.join(DATA_DIR, candidateNames[1]);
    const originalReaddirSync = fs.readdirSync;

    try {
        const seedDocument = { metadata: { eventId, source: "sofa" }, timeline: [] };
        fs.writeFileSync(canonicalTarget, JSON.stringify(seedDocument), "utf8");
        fs.writeFileSync(alternateTarget, JSON.stringify(seedDocument), "utf8");

        let reverseCandidates = false;
        fs.readdirSync = (directory, ...args) => {
            const names = originalReaddirSync.call(fs, directory, ...args);
            if (path.resolve(directory) !== DATA_DIR) return names;
            reverseCandidates = !reverseCandidates;
            const candidates = names.filter(name => candidateNames.includes(name));
            const others = names.filter(name => !candidateNames.includes(name));
            return [...others, ...(reverseCandidates ? candidates.reverse() : candidates)];
        };

        const firstResolved = getTimelineFile("sofa", eventId, metadata);
        const secondResolved = getTimelineFile("sofa", eventId, metadata);
        assert("TC11-resolver-is-lexicographically-stable", firstResolved === canonicalTarget && secondResolved === canonicalTarget);

        const document = { metadata: { eventId, source: "sofa" }, timeline: [{ timestamp: "2026-06-26T12:00:00.000Z", data: { score: "1-0" } }] };
        const canonicalWrite = writeTimelineDocument("sofa", eventId, document, metadata, canonicalTarget);
        assert("TC12-direct-writer-accepts-stable-canonical-target", canonicalWrite?.ok === true && canonicalWrite.file === canonicalTarget && fs.existsSync(canonicalTarget));

        const filesBeforeRejectedTarget = originalReaddirSync.call(fs, DATA_DIR).filter(name => name.includes(eventId)).sort();
        const rejectedWrite = writeTimelineDocument("sofa", eventId, document, metadata, path.join(DATA_DIR, "wrong_" + eventId + ".json"));
        const filesAfterRejectedTarget = originalReaddirSync.call(fs, DATA_DIR).filter(name => name.includes(eventId)).sort();
        assert("TC13-direct-writer-rejects-noncanonical-stable-target", rejectedWrite?.ok === false && rejectedWrite.reason === "write_failed" && rejectedWrite.file === null && JSON.stringify(filesAfterRejectedTarget) === JSON.stringify(filesBeforeRejectedTarget) && countTmpFiles(eventId) === 0);
    } finally {
        fs.readdirSync = originalReaddirSync;
        cleanupFixture(eventId);
    }
}

finish();
