import fs from 'node:fs';
import { repairSofaCommitFromJournal } from './sofaUpdates.js';
import { repairBetfairCommitFromJournal } from '../betfair/processor.js';

const SOURCES = new Set(['sofa', 'betfair']);
const DOCUMENT_NAMES = ['history', 'timeline'];

function isPlainObject(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isValidCommitId(commitId) {
    return typeof commitId === 'string' &&
        /^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/.test(commitId);
}

function isValidEventId(eventId) {
    return typeof eventId === 'string' && eventId.trim().length > 0;
}

function isValidTarget(target) {
    return typeof target === 'string' && target.trim().length > 0;
}

function createSummary(overrides = {}) {
    return {
        ok: true,
        fatal: false,
        scanned: 0,
        recovered: 0,
        cleaned: 0,
        retryablePending: 0,
        recoveryFailed: 0,
        alreadyRecoveryFailed: 0,
        invalidJournal: 0,
        outcomes: [],
        ...overrides
    };
}

function addOutcome(summary, outcome) {
    summary.outcomes.push({
        source: null,
        eventId: null,
        commitId: null,
        category: 'unknown',
        reason: null,
        failedDocument: null,
        ...outcome
    });
}

function isRecordStructurallyRecoverable(record) {
    if (!isPlainObject(record) ||
        !SOURCES.has(record.source) ||
        !isValidCommitId(record.commitId) ||
        !isValidEventId(record.eventId)) {
        return false;
    }

    if (!isPlainObject(record.documents)) {
        return false;
    }

    for (const name of DOCUMENT_NAMES) {
        const doc = record.documents[name];
        if (!isPlainObject(doc)) return false;
        if (typeof doc.completed !== 'boolean') return false;
        if (!isValidTarget(doc.target)) return false;
        if (!isPlainObject(doc.payload)) return false;
    }

    return true;
}

function verifyDocumentTargetDefault(target) {
    try {
        const content = fs.readFileSync(target, 'utf8');
        JSON.parse(content);
        return { ok: true, reason: null };
    } catch (error) {
        return {
            ok: false,
            reason: error.code === 'ENOENT' ? 'missing' : 'invalid_json'
        };
    }
}

function verifyDocumentTarget(dependencies, target) {
    if (typeof dependencies.verifyDocumentTarget === 'function') {
        return dependencies.verifyDocumentTarget(target);
    }
    return verifyDocumentTargetDefault(target);
}

async function runRepairForRecord(record, dependencies) {
    let repairResult;

    try {
        if (record.source === 'sofa') {
            repairResult = repairSofaCommitFromJournal(record, dependencies);
        } else {
            repairResult = repairBetfairCommitFromJournal(record, dependencies);
        }
    } catch (_) {
        repairResult = {
            ok: false,
            status: 'failed',
            reason: 'repair_exception',
            failedDocument: null
        };
    }

    return repairResult;
}

export async function runPendingCommitRecovery(dependencies = {}) {
    const journalStore = dependencies.journalStore;

    if (!journalStore || typeof journalStore.scanRecoveryCandidates !== 'function') {
        return createSummary({ ok: false, fatal: true });
    }

    const scan = journalStore.scanRecoveryCandidates();

    if (scan?.fatal === true || scan?.ok === false) {
        return createSummary({ ok: false, fatal: true });
    }

    const summary = createSummary();
    const records = Array.isArray(scan.records) ? scan.records : [];
    const invalidRecords = Array.isArray(scan.invalidRecords) ? scan.invalidRecords : [];
    const invalidEntries = Array.isArray(scan.invalidEntries) ? scan.invalidEntries : [];

    summary.scanned = records.length + invalidRecords.length;
    summary.invalidJournal = invalidEntries.length;

    for (const entry of invalidEntries) {
        addOutcome(summary, {
            source: null,
            eventId: null,
            commitId: null,
            category: 'invalid_journal',
            reason: entry?.reason || 'invalid_journal',
            failedDocument: null
        });
    }

    for (const entry of invalidRecords) {
        if (entry.alreadyRecoveryFailed) {
            summary.alreadyRecoveryFailed += 1;
            addOutcome(summary, {
                source: entry.source,
                eventId: entry.eventId,
                commitId: entry.commitId,
                category: 'already_recovery_failed',
                reason: 'invalid_journal_structure',
                failedDocument: null
            });
            continue;
        }

        const mark = journalStore.markRecoveryFailed(
            entry.commitId,
            'invalid_journal_structure'
        );

        if (mark?.ok === true) {
            summary.recoveryFailed += 1;
            addOutcome(summary, {
                source: entry.source,
                eventId: entry.eventId,
                commitId: entry.commitId,
                category: 'recovery_failed',
                reason: 'invalid_journal_structure',
                failedDocument: 'journal'
            });
        } else {
            summary.retryablePending += 1;
            addOutcome(summary, {
                source: entry.source,
                eventId: entry.eventId,
                commitId: entry.commitId,
                category: 'retryable_pending',
                reason: mark?.reason || 'journal_write_failed',
                failedDocument: 'journal'
            });
        }
    }

    for (const record of records) {
        if (!isRecordStructurallyRecoverable(record)) {
            summary.retryablePending += 1;
            addOutcome(summary, {
                source: record.source || null,
                eventId: record.eventId || null,
                commitId: record.commitId || null,
                category: 'retryable_pending',
                reason: 'unexpected_invalid_record',
                failedDocument: 'journal'
            });
            continue;
        }

        if (record.status === 'recovery_failed') {
            summary.alreadyRecoveryFailed += 1;
            addOutcome(summary, {
                source: record.source,
                eventId: record.eventId,
                commitId: record.commitId,
                category: 'already_recovery_failed',
                reason: record.reason || 'recovery_failed',
                failedDocument: null
            });
            continue;
        }

        if (record.status !== 'pending' || record.reason !== null) {
            summary.retryablePending += 1;
            addOutcome(summary, {
                source: record.source,
                eventId: record.eventId,
                commitId: record.commitId,
                category: 'retryable_pending',
                reason: 'unexpected_record_state',
                failedDocument: 'journal'
            });
            continue;
        }

        const historyCompleted = record.documents.history.completed === true;
        const timelineCompleted = record.documents.timeline.completed === true;

        if (historyCompleted && timelineCompleted) {
            const historyVerified = verifyDocumentTarget(
                dependencies,
                record.documents.history.target
            );
            const timelineVerified = verifyDocumentTarget(
                dependencies,
                record.documents.timeline.target
            );

            if (historyVerified.ok && timelineVerified.ok) {
                const cleanup = journalStore.removeCompletedCommit(record.commitId);

                if (cleanup?.ok === true) {
                    summary.cleaned += 1;
                    addOutcome(summary, {
                        source: record.source,
                        eventId: record.eventId,
                        commitId: record.commitId,
                        category: 'cleaned',
                        reason: 'completed_residual_removed',
                        failedDocument: null
                    });
                } else {
                    summary.retryablePending += 1;
                    addOutcome(summary, {
                        source: record.source,
                        eventId: record.eventId,
                        commitId: record.commitId,
                        category: 'retryable_pending',
                        reason: cleanup?.reason || 'cleanup_failed',
                        failedDocument: 'journal'
                    });
                }

                continue;
            }

            const documentsToReopen = [];
            if (!historyVerified.ok) documentsToReopen.push('history');
            if (!timelineVerified.ok) documentsToReopen.push('timeline');

            let reopenFailed = false;

            for (const documentName of documentsToReopen) {
                const marked = journalStore.markDocumentIncomplete(
                    record.commitId,
                    documentName
                );

                if (!marked?.ok) {
                    reopenFailed = true;
                    summary.retryablePending += 1;
                    addOutcome(summary, {
                        source: record.source,
                        eventId: record.eventId,
                        commitId: record.commitId,
                        category: 'retryable_pending',
                        reason: marked?.reason || 'journal_write_failed',
                        failedDocument: 'journal'
                    });
                    break;
                }
            }

            if (reopenFailed) {
                continue;
            }

            const reloaded = journalStore.getPendingCommit(record.commitId);

            if (!reloaded) {
                summary.retryablePending += 1;
                addOutcome(summary, {
                    source: record.source,
                    eventId: record.eventId,
                    commitId: record.commitId,
                    category: 'retryable_pending',
                    reason: 'journal_reload_failed',
                    failedDocument: 'journal'
                });
                continue;
            }

            const repairResult = await runRepairForRecord(reloaded, dependencies);

            if (repairResult?.ok === true) {
                summary.recovered += 1;
                addOutcome(summary, {
                    source: record.source,
                    eventId: record.eventId,
                    commitId: record.commitId,
                    category: 'recovered',
                    reason: repairResult.status || 'recovered',
                    failedDocument: null
                });
            } else {
                summary.retryablePending += 1;
                addOutcome(summary, {
                    source: record.source,
                    eventId: record.eventId,
                    commitId: record.commitId,
                    category: 'retryable_pending',
                    reason: repairResult?.reason || 'repair_failed',
                    failedDocument: repairResult?.failedDocument || null
                });
            }

            continue;
        }

        const repairResult = await runRepairForRecord(record, dependencies);

        if (repairResult?.ok === true) {
            summary.recovered += 1;
            addOutcome(summary, {
                source: record.source,
                eventId: record.eventId,
                commitId: record.commitId,
                category: 'recovered',
                reason: repairResult.status || 'recovered',
                failedDocument: null
            });
        } else {
            summary.retryablePending += 1;
            addOutcome(summary, {
                source: record.source,
                eventId: record.eventId,
                commitId: record.commitId,
                category: 'retryable_pending',
                reason: repairResult?.reason || 'repair_failed',
                failedDocument: repairResult?.failedDocument || null
            });
        }
    }

    return summary;
}
