import {
    isPlainObject,
    isSafeJsonValue,
    isValidCommitId
} from './recordSchema.js';

export function createJournalFileStore({
    fs,
    path,
    journalDir,
    getNowMs,
    processId,
    logSafe,
    validatePersistedRecord
}) {
    let temporarySequence = 0;

    function ensureJournalDirectory() {
        try {
            if (!fs.existsSync(journalDir)) {
                fs.mkdirSync(journalDir, { recursive: true });
            }

            return true;
        } catch (_) {
            logSafe('journal_directory_unavailable');
            return false;
        }
    }

    function getJournalFile(commitId) {
        return path.join(journalDir, `${commitId}.json`);
    }

    function readJournalFile(file, expectedCommitId = null) {
        let parsed;

        try {
            parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
        } catch (_) {
            return { record: null, reason: 'invalid_journal' };
        }

        if (!validatePersistedRecord(parsed) ||
            (expectedCommitId !== null && parsed.commitId !== expectedCommitId)) {
            return { record: null, reason: 'invalid_journal' };
        }

        return { record: parsed, reason: null };
    }

    function listJournalRecords() {
        if (!fs.existsSync(journalDir)) {
            return {
                records: [],
                invalid: [],
                reason: null
            };
        }

        let filenames;

        try {
            filenames = fs.readdirSync(journalDir);
        } catch (_) {
            logSafe('journal_directory_read_failed');
            return {
                records: [],
                invalid: [{ file: null, reason: 'write_failed' }],
                reason: 'write_failed'
            };
        }

        const records = [];
        const invalid = [];

        for (const filename of filenames
            .filter(name => typeof name === 'string' && name.endsWith('.json'))
            .sort()) {
            const file = path.join(journalDir, filename);
            const loaded = readJournalFile(file);

            if (loaded.reason !== null) {
                invalid.push({ file, reason: loaded.reason });
                continue;
            }

            const expectedFilename = `${loaded.record.commitId}.json`;

            if (filename !== expectedFilename) {
                invalid.push({ file, reason: 'invalid_journal' });
                continue;
            }

            records.push({
                file,
                record: loaded.record
            });
        }

        return {
            records,
            invalid,
            reason: invalid.length > 0 ? 'invalid_journal' : null
        };
    }

    function atomicWriteRecord(file, record) {
        const base = path.basename(file);
        const tempFile = path.join(
            journalDir,
            `.${base}.${processId}.${getNowMs()}.${temporarySequence++}.tmp`
        );

        try {
            fs.writeFileSync(tempFile, JSON.stringify(record, null, 2), 'utf8');
            fs.renameSync(tempFile, file);
            return true;
        } catch (_) {
            try {
                fs.unlinkSync(tempFile);
            } catch (_) {
            }

            logSafe('journal_write_failed');
            return false;
        }
    }

    function findRecordByCommitId(commitId) {
        const file = getJournalFile(commitId);

        if (!fs.existsSync(file)) {
            return { record: null, file, reason: 'not_found' };
        }

        const loaded = readJournalFile(file, commitId);

        return {
            record: loaded.record,
            file,
            reason: loaded.reason
        };
    }

    function readRawJournalFile(file) {
        if (!fs.existsSync(file)) {
            return { ok: false, parsed: null };
        }

        let parsed;

        try {
            parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
        } catch (_) {
            return { ok: false, parsed: null };
        }

        if (!isPlainObject(parsed) ||
            !isSafeJsonValue(parsed) ||
            !isValidCommitId(parsed.commitId)) {
            return { ok: false, parsed: null };
        }

        return { ok: true, parsed };
    }

    return {
        ensureJournalDirectory,
        getJournalFile,
        readJournalFile,
        listJournalRecords,
        atomicWriteRecord,
        findRecordByCommitId,
        readRawJournalFile
    };
}
