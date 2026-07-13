import {
    cloneJson,
    isPlainObject,
    isSafeJsonValue,
    isValidCommitId,
    isValidEventId,
    isValidRecoveryReason,
    isValidSource
} from './recordSchema.js';

function isIdentifiableRawRecord(record, filename) {
    return isPlainObject(record) &&
        isSafeJsonValue(record) &&
        isValidCommitId(record?.commitId) &&
        filename === `${record.commitId}.json`;
}

function sanitizeInvalidRecord(record) {
    return {
        commitId: isValidCommitId(record?.commitId) ? record.commitId : null,
        eventId: isValidEventId(record?.eventId) ? record.eventId : null,
        source: isValidSource(record?.source) ? record.source : null,
        category: 'invalid_journal_structure',
        alreadyRecoveryFailed: record?.status === 'recovery_failed' &&
            isValidRecoveryReason(record?.reason)
    };
}

function sanitizeInvalidEntry(path, filename, reason) {
    return {
        file: typeof filename === 'string' ? path.basename(filename) : null,
        category: 'invalid_journal',
        reason
    };
}

export function scanRecoveryCandidatesFromFiles({
    fs,
    path,
    journalDir,
    validatePersistedRecord
}) {
    if (!fs.existsSync(journalDir)) {
        return {
            ok: true,
            fatal: false,
            records: [],
            invalidRecords: [],
            invalidEntries: []
        };
    }

    let filenames;

    try {
        filenames = fs.readdirSync(journalDir);
    } catch (_) {
        return {
            ok: false,
            fatal: true,
            records: [],
            invalidRecords: [],
            invalidEntries: []
        };
    }

    const records = [];
    const invalidRecords = [];
    const invalidEntries = [];

    for (const filename of filenames
        .filter(name => typeof name === 'string' && name.endsWith('.json'))
        .sort()) {
        const file = path.join(journalDir, filename);
        let parsed;

        try {
            parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
        } catch (_) {
            invalidEntries.push(sanitizeInvalidEntry(path, filename, 'invalid_journal'));
            continue;
        }

        if (!isIdentifiableRawRecord(parsed, filename)) {
            invalidEntries.push(sanitizeInvalidEntry(path, filename, 'invalid_journal'));
            continue;
        }

        if (!validatePersistedRecord(parsed)) {
            invalidRecords.push(sanitizeInvalidRecord(parsed));
            continue;
        }

        records.push(cloneJson(parsed));
    }

    return {
        ok: true,
        fatal: false,
        records,
        invalidRecords,
        invalidEntries
    };
}
