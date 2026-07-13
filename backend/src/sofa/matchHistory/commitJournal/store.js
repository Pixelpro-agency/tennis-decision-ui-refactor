import fsDefault from 'node:fs';
import pathDefault from 'node:path';
import { fileURLToPath } from 'node:url';
import {
    SOURCES,
    DOCUMENT_NAMES,
    FORBIDDEN_KEY_CONCEPTS,
    SENSITIVE_QUERY_PARAMS,
    NETWORK_CAPTURE_SUMMARY_FIELDS,
    hasOwn,
    isPlainObject,
    hasOnlyKeys,
    isValidEventId,
    isValidSource,
    isValidCommitId,
    isValidTarget,
    isValidRecoveryReason,
    isNonNegativeInteger,
    isValidNetworkCaptureSummary,
    isForbiddenKey,
    hasSensitiveQueryParameter,
    isSafeJsonValue,
    stableJson,
    cloneJson,
    freezeRecord,
    getAffectedDocuments,
    isActiveRecord,
    compareIntegrityRecords
} from './recordSchema.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = pathDefault.dirname(__filename);
const DEFAULT_JOURNAL_DIR = pathDefault.resolve(
    __dirname,
    '../../../../match_history/.pending_commits'
);

export function createCommitJournalStore({
    fs = fsDefault,
    path = pathDefault,
    journalDir = DEFAULT_JOURNAL_DIR,
    getNow = () => new Date(),
    getNowMs = () => Date.now(),
    processId = process.pid,
    logError = (...args) => console.error(...args),
    verifyDocumentTarget = null
} = {}) {
    let temporarySequence = 0;

    function defaultVerifyDocumentTarget(target) {
        if (typeof target !== 'string') {
            return { ok: false };
        }

        try {
            const content = fs.readFileSync(target, 'utf8');
            JSON.parse(content);
            return { ok: true };
        } catch (_) {
            return { ok: false };
        }
    }

    const resolveVerifyDocumentTarget = typeof verifyDocumentTarget === 'function'
        ? verifyDocumentTarget
        : defaultVerifyDocumentTarget;

    function logSafe(message) {
        try {
            logError(`[CommitJournal] ${message}`);
        } catch (_) {
        }
    }

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

    function createResult({
        eventId = null,
        source = null,
        commitId = null,
        status,
        reason = null,
        file = null
    }) {
        return {
            ok: status !== 'failed',
            operation: 'journal',
            eventId,
            source,
            commitId,
            status,
            reason,
            file
        };
    }

    function getJournalFile(commitId) {
        return path.join(journalDir, `${commitId}.json`);
    }

    function getCreatedAt() {
        const now = getNow();

        if (now && typeof now.toISOString === 'function') {
            return now.toISOString();
        }

        return new Date(getNowMs()).toISOString();
    }

    function validateDocument(document) {
        return isPlainObject(document) &&
            hasOnlyKeys(document, ['target', 'payload', 'completed']) &&
            isValidTarget(document.target) &&
            isPlainObject(document.payload) &&
            isSafeJsonValue(document.payload) &&
            typeof document.completed === 'boolean';
    }

    function validateIncomingRecord(record) {
        if (!isPlainObject(record) || !isSafeJsonValue(record)) {
            return 'invalid_record';
        }

        if (!isValidCommitId(record.commitId)) {
            return 'invalid_commit_id';
        }

        if (!isValidEventId(record.eventId)) {
            return 'invalid_event_id';
        }

        if (!isValidSource(record.source)) {
            return 'invalid_source';
        }

        if (!isPlainObject(record.documents) ||
            !hasOnlyKeys(record.documents, DOCUMENT_NAMES) ||
            !validateDocument(record.documents.history) ||
            !validateDocument(record.documents.timeline) ||
            record.documents.history.completed !== false ||
            record.documents.timeline.completed !== false) {
            return 'invalid_record';
        }

        return null;
    }

    function validatePersistedRecord(record) {
        if (!isPlainObject(record) ||
            !hasOnlyKeys(record, [
                'version',
                'commitId',
                'eventId',
                'source',
                'createdAt',
                'status',
                'documents',
                'reason'
            ]) ||
            !isSafeJsonValue(record) ||
            record.version !== 1 ||
            !isValidCommitId(record.commitId) ||
            !isValidEventId(record.eventId) ||
            !isValidSource(record.source) ||
            typeof record.createdAt !== 'string' ||
            !Number.isFinite(Date.parse(record.createdAt)) ||
            !isPlainObject(record.documents) ||
            !hasOnlyKeys(record.documents, DOCUMENT_NAMES) ||
            !validateDocument(record.documents.history) ||
            !validateDocument(record.documents.timeline)) {
            return false;
        }

        if (record.status === 'pending') {
            return record.reason === null;
        }

        if (record.status === 'recovery_failed') {
            return isValidRecoveryReason(record.reason);
        }

        return false;
    }

    function makePersistedRecord(record) {
        return {
            version: 1,
            commitId: record.commitId,
            eventId: record.eventId,
            source: record.source,
            createdAt: getCreatedAt(),
            status: 'pending',
            documents: {
                history: {
                    target: record.documents.history.target,
                    payload: cloneJson(record.documents.history.payload),
                    completed: false
                },
                timeline: {
                    target: record.documents.timeline.target,
                    payload: cloneJson(record.documents.timeline.payload),
                    completed: false
                }
            },
            reason: null
        };
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

    function isEquivalentInitialRecord(existing, candidate) {
        if (existing.status !== 'pending' || existing.reason !== null) {
            return false;
        }

        return stableJson({
            version: existing.version,
            commitId: existing.commitId,
            eventId: existing.eventId,
            source: existing.source,
            documents: existing.documents
        }) === stableJson({
            version: candidate.version,
            commitId: candidate.commitId,
            eventId: candidate.eventId,
            source: candidate.source,
            documents: candidate.documents
        });
    }

    function createPendingCommit(record) {
        const validationReason = validateIncomingRecord(record);

        if (validationReason !== null) {
            return createResult({
                eventId: isValidEventId(record?.eventId) ? record.eventId : null,
                source: isValidSource(record?.source) ? record.source : null,
                commitId: isValidCommitId(record?.commitId) ? record.commitId : null,
                status: 'failed',
                reason: validationReason
            });
        }

        if (!ensureJournalDirectory()) {
            return createResult({
                eventId: record.eventId,
                source: record.source,
                commitId: record.commitId,
                status: 'failed',
                reason: 'write_failed'
            });
        }

        const candidate = makePersistedRecord(record);
        const ownFile = getJournalFile(candidate.commitId);
        const existing = findRecordByCommitId(candidate.commitId);

        if (existing.reason === null) {
            const existingComplete =
                existing.record.documents.history.completed === true &&
                existing.record.documents.timeline.completed === true;

            const existingMatchesCandidate =
                existing.record.eventId === candidate.eventId &&
                existing.record.source === candidate.source;

            if (!existingComplete || !existingMatchesCandidate) {
                if (isEquivalentInitialRecord(existing.record, candidate)) {
                    return createResult({
                        eventId: existing.record.eventId,
                        source: existing.record.source,
                        commitId: existing.record.commitId,
                        status: "unchanged",
                        file: existing.file
                    });
                }

                return createResult({
                    eventId: existing.record.eventId,
                    source: existing.record.source,
                    commitId: existing.record.commitId,
                    status: "failed",
                    reason: "pending_exists"
                });
            }
        }

        if (existing.reason === 'invalid_journal') {
            return createResult({
                eventId: candidate.eventId,
                source: candidate.source,
                commitId: candidate.commitId,
                status: 'failed',
                reason: 'invalid_journal'
            });
        }

        const current = listJournalRecords();

        if (current.reason === 'write_failed') {
            return createResult({
                eventId: candidate.eventId,
                source: candidate.source,
                commitId: candidate.commitId,
                status: 'failed',
                reason: 'write_failed'
            });
        }

        const matching = current.records.filter(entry =>
            entry.record.eventId === candidate.eventId &&
            entry.record.source === candidate.source
        );

        const active = matching.find(entry => isActiveRecord(entry.record));

        if (active) {
            return createResult({
                eventId: candidate.eventId,
                source: candidate.source,
                commitId: candidate.commitId,
                status: "failed",
                reason: "pending_exists"
            });
        }

        const completed = matching.filter(entry =>
            entry.record.documents.history.completed === true &&
            entry.record.documents.timeline.completed === true
        );

        for (const entry of completed) {
            const historyVerified = resolveVerifyDocumentTarget(
                entry.record.documents.history.target
            );
            const timelineVerified = resolveVerifyDocumentTarget(
                entry.record.documents.timeline.target
            );

            if (historyVerified.ok && timelineVerified.ok) {
                const cleanup = removeCompletedCommit(entry.record.commitId);

                if (cleanup?.ok !== true) {
                    return createResult({
                        eventId: candidate.eventId,
                        source: candidate.source,
                        commitId: candidate.commitId,
                        status: "failed",
                        reason: cleanup?.reason || "write_failed"
                    });
                }

                continue;
            }

            const documentsToReopen = [];
            if (!historyVerified.ok) documentsToReopen.push('history');
            if (!timelineVerified.ok) documentsToReopen.push('timeline');

            for (const documentName of documentsToReopen) {
                const marked = markDocumentIncomplete(
                    entry.record.commitId,
                    documentName
                );

                if (!marked?.ok) {
                    return createResult({
                        eventId: candidate.eventId,
                        source: candidate.source,
                        commitId: candidate.commitId,
                        status: "failed",
                        reason: marked?.reason || "write_failed"
                    });
                }
            }

            return createResult({
                eventId: candidate.eventId,
                source: candidate.source,
                commitId: candidate.commitId,
                status: "failed",
                reason: "pending_exists"
            });
        }

        if (!atomicWriteRecord(ownFile, candidate)) {
            return createResult({
                eventId: candidate.eventId,
                source: candidate.source,
                commitId: candidate.commitId,
                status: 'failed',
                reason: 'write_failed'
            });
        }

        return createResult({
            eventId: candidate.eventId,
            source: candidate.source,
            commitId: candidate.commitId,
            status: 'created',
            file: ownFile
        });
    }

    function getPendingCommit(commitId) {
        if (!isValidCommitId(commitId)) {
            return null;
        }

        const loaded = findRecordByCommitId(commitId);

        if (loaded.reason !== null) {
            return null;
        }

        return freezeRecord(cloneJson(loaded.record));
    }

    function findPendingCommit({ eventId, source } = {}) {
        if (!isValidEventId(eventId) || !isValidSource(source)) {
            return null;
        }

        const journal = listJournalRecords();
        const matches = journal.records
            .map(entry => entry.record)
            .filter(record =>
                record.eventId === eventId &&
                record.source === source &&
                isActiveRecord(record)
            )
            .sort(compareIntegrityRecords);

        return matches.length > 0
            ? freezeRecord(cloneJson(matches[0]))
            : null;
    }

    function findCompletedCommit({ eventId, source } = {}) {
        if (!isValidEventId(eventId) || !isValidSource(source)) {
            return null;
        }

        const journal = listJournalRecords();
        const matches = journal.records
            .map(entry => entry.record)
            .filter(record =>
                record.eventId === eventId &&
                record.source === source &&
                record.documents.history.completed === true &&
                record.documents.timeline.completed === true
            )
            .sort(compareIntegrityRecords);

        return matches.length > 0
            ? freezeRecord(cloneJson(matches[0]))
            : null;
    }

    function markDocumentComplete(commitId, documentName) {
        if (!isValidCommitId(commitId)) {
            return createResult({
                status: 'failed',
                reason: 'invalid_commit_id'
            });
        }

        if (!DOCUMENT_NAMES.includes(documentName)) {
            return createResult({
                commitId,
                status: 'failed',
                reason: 'invalid_document'
            });
        }

        const loaded = findRecordByCommitId(commitId);

        if (loaded.reason !== null) {
            return createResult({
                commitId,
                status: 'failed',
                reason: loaded.reason
            });
        }

        const record = loaded.record;

        if (record.documents[documentName].completed === true) {
            return createResult({
                eventId: record.eventId,
                source: record.source,
                commitId,
                status: 'unchanged',
                file: loaded.file
            });
        }

        const updated = cloneJson(record);
        updated.documents[documentName].completed = true;

        if (!atomicWriteRecord(loaded.file, updated)) {
            return createResult({
                eventId: record.eventId,
                source: record.source,
                commitId,
                status: 'failed',
                reason: 'write_failed'
            });
        }

        return createResult({
            eventId: record.eventId,
            source: record.source,
            commitId,
            status: 'updated',
            file: loaded.file
        });
    }

    function markDocumentIncomplete(commitId, documentName) {
        if (!isValidCommitId(commitId)) {
            return createResult({
                status: 'failed',
                reason: 'invalid_commit_id'
            });
        }

        if (!DOCUMENT_NAMES.includes(documentName)) {
            return createResult({
                commitId,
                status: 'failed',
                reason: 'invalid_document'
            });
        }

        const loaded = findRecordByCommitId(commitId);

        if (loaded.reason !== null) {
            return createResult({
                commitId,
                status: 'failed',
                reason: loaded.reason
            });
        }

        const record = loaded.record;

        if (record.documents[documentName].completed === false) {
            return createResult({
                eventId: record.eventId,
                source: record.source,
                commitId,
                status: 'unchanged',
                file: loaded.file
            });
        }

        const updated = cloneJson(record);
        updated.documents[documentName].completed = false;

        if (!atomicWriteRecord(loaded.file, updated)) {
            return createResult({
                eventId: record.eventId,
                source: record.source,
                commitId,
                status: 'failed',
                reason: 'write_failed'
            });
        }

        return createResult({
            eventId: record.eventId,
            source: record.source,
            commitId,
            status: 'updated',
            file: loaded.file
        });
    }

    function markRecoveryFailed(commitId, reason) {
        if (!isValidCommitId(commitId)) {
            return createResult({
                status: 'failed',
                reason: 'invalid_commit_id'
            });
        }

        if (!isValidRecoveryReason(reason)) {
            return createResult({
                commitId,
                status: 'failed',
                reason: 'invalid_record'
            });
        }

        let loaded = findRecordByCommitId(commitId);
        let record = loaded.record;

        let isRawInvalid = false;

        if (loaded.reason === 'invalid_journal') {
            const raw = readRawJournalFile(loaded.file);

            if (!raw.ok || raw.parsed?.commitId !== commitId) {
                return createResult({
                    commitId,
                    status: 'failed',
                    reason: 'invalid_journal'
                });
            }

            record = raw.parsed;
            isRawInvalid = true;
        } else if (loaded.reason !== null) {
            return createResult({
                commitId,
                status: 'failed',
                reason: loaded.reason
            });
        }

        const isCompleted = !isRawInvalid &&
            record.documents?.history?.completed === true &&
            record.documents?.timeline?.completed === true;

        if (isCompleted ||
            (record.status === 'recovery_failed' && record.reason === reason)) {
            return createResult({
                eventId: record.eventId,
                source: record.source,
                commitId,
                status: 'unchanged',
                file: loaded.file
            });
        }

        const updated = cloneJson(record);
        updated.status = 'recovery_failed';
        updated.reason = reason;

        if (!atomicWriteRecord(loaded.file, updated)) {
            return createResult({
                eventId: record.eventId,
                source: record.source,
                commitId,
                status: 'failed',
                reason: 'write_failed'
            });
        }

        return createResult({
            eventId: record.eventId,
            source: record.source,
            commitId,
            status: 'updated',
            file: loaded.file
        });
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

    function removeCompletedCommit(commitId) {
        if (!isValidCommitId(commitId)) {
            return createResult({
                status: 'failed',
                reason: 'invalid_commit_id'
            });
        }

        const loaded = findRecordByCommitId(commitId);

        if (loaded.reason === 'not_found') {
            return createResult({
                commitId,
                status: 'unchanged'
            });
        }

        if (loaded.reason !== null) {
            return createResult({
                commitId,
                status: 'failed',
                reason: loaded.reason
            });
        }

        const record = loaded.record;
        const isCompleted = record.documents.history.completed === true &&
            record.documents.timeline.completed === true;

        if (!isCompleted) {
            return createResult({
                eventId: record.eventId,
                source: record.source,
                commitId,
                status: 'failed',
                reason: 'not_completed'
            });
        }

        try {
            fs.unlinkSync(loaded.file);
        } catch (_) {
            logSafe('journal_remove_failed');
            return createResult({
                eventId: record.eventId,
                source: record.source,
                commitId,
                status: 'failed',
                reason: 'write_failed'
            });
        }

        return createResult({
            eventId: record.eventId,
            source: record.source,
            commitId,
            status: 'removed',
            file: loaded.file
        });
    }

    function listPendingCommits() {
        const journal = listJournalRecords();
        const response = {
            ok: journal.reason === null,
            records: journal.records
                .map(entry => cloneJson(entry.record))
                .sort(compareIntegrityRecords),
            invalid: journal.invalid.map(entry => ({ ...entry })),
            reason: journal.reason
        };

        return freezeRecord(response);
    }

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

    function sanitizeInvalidEntry(filename, reason) {
        return {
            file: typeof filename === 'string' ? path.basename(filename) : null,
            category: 'invalid_journal',
            reason
        };
    }

    function scanRecoveryCandidates() {
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
                invalidEntries.push(sanitizeInvalidEntry(filename, 'invalid_journal'));
                continue;
            }

            if (!isIdentifiableRawRecord(parsed, filename)) {
                invalidEntries.push(sanitizeInvalidEntry(filename, 'invalid_journal'));
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

    function getPersistenceIntegrityStatus(eventId, source = undefined) {
        const requestedSource = isValidSource(source) ? source : null;

        if (!isValidEventId(eventId) ||
            (source !== undefined && source !== null && !isValidSource(source))) {
            return {
                status: 'no_known_partial',
                reason: null,
                source: requestedSource,
                commitId: null,
                affectedDocuments: []
            };
        }

        const journal = listJournalRecords();
        const candidates = journal.records
            .map(entry => entry.record)
            .filter(record =>
                record.eventId === eventId &&
                (requestedSource === null || record.source === requestedSource) &&
                isActiveRecord(record)
            )
            .sort(compareIntegrityRecords);

        if (candidates.length === 0) {
            return {
                status: 'no_known_partial',
                reason: null,
                source: requestedSource,
                commitId: null,
                affectedDocuments: []
            };
        }

        const selected = candidates[0];
        const affectedDocuments = getAffectedDocuments(selected);

        if (selected.status === 'recovery_failed') {
            return {
                status: 'recovery_failed',
                reason: selected.reason || 'recovery_failed',
                source: selected.source,
                commitId: selected.commitId,
                affectedDocuments
            };
        }

        return {
            status: 'partial_persistence',
            reason: 'pending_commit',
            source: selected.source,
            commitId: selected.commitId,
            affectedDocuments
        };
    }

    return {
        createPendingCommit,
        getPendingCommit,
        findPendingCommit,
        findCompletedCommit,
        markDocumentComplete,
        markDocumentIncomplete,
        markRecoveryFailed,
        removeCompletedCommit,
        listPendingCommits,
        scanRecoveryCandidates,
        getPersistenceIntegrityStatus
    };
}
