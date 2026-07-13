import fsDefault from 'node:fs';
import pathDefault from 'node:path';
import { fileURLToPath } from 'node:url';
import {
    DOCUMENT_NAMES,
    isValidEventId,
    isValidSource,
    isValidCommitId,
    isValidRecoveryReason,
    cloneJson,
    freezeRecord,
    isActiveRecord,
    compareIntegrityRecords
} from './recordSchema.js';
import { createJournalFileStore } from './filesystemStore.js';
import { getPersistenceIntegrityStatusFromRecords } from './integrity.js';
import {
    isEquivalentInitialRecord,
    makePersistedRecord
} from './recordFactory.js';
import {
    validateIncomingRecord,
    validatePersistedRecord
} from './recordValidation.js';
import { scanRecoveryCandidatesFromFiles } from './recoveryScanner.js';
import {
    createResult,
    createSafeLogger
} from './results.js';

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

    const logSafe = createSafeLogger(logError);
    const fileStore = createJournalFileStore({
        fs,
        path,
        journalDir,
        getNowMs,
        processId,
        logSafe,
        validatePersistedRecord
    });
    const {
        ensureJournalDirectory,
        getJournalFile,
        listJournalRecords,
        atomicWriteRecord,
        findRecordByCommitId,
        readRawJournalFile
    } = fileStore;

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

        const candidate = makePersistedRecord(record, { getNow, getNowMs });
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

    function scanRecoveryCandidates() {
        return scanRecoveryCandidatesFromFiles({
            fs,
            path,
            journalDir,
            validatePersistedRecord
        });
    }

    function getPersistenceIntegrityStatus(eventId, source = undefined) {
        const journal = listJournalRecords();
        return getPersistenceIntegrityStatusFromRecords(
            journal.records.map(entry => entry.record),
            eventId,
            source
        );
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
