import {
    createCommitResult,
    isSuccessfulWrite,
    withCommitArtifacts
} from './commitResult.js';

export function markCompleted(journalStore, commitId, documentName) {
    const result = journalStore.markDocumentComplete(commitId, documentName);

    return result?.ok === true &&
        (result.status === 'updated' || result.status === 'unchanged');
}

export function cleanupCompletedResidual(eventId, source, journalStore) {
    if (!journalStore || typeof journalStore.findCompletedCommit !== 'function') {
        return { ok: true, status: 'no_residual' };
    }

    const residual = journalStore.findCompletedCommit({ eventId, source });
    if (!residual) {
        return { ok: true, status: 'no_residual' };
    }

    const cleanup = journalStore.removeCompletedCommit(residual.commitId);

    if (cleanup?.ok !== true) {
        return {
            ok: false,
            status: 'failed',
            reason: 'journal_cleanup_failed',
            commitId: residual.commitId
        };
    }

    return { ok: true, status: 'removed', commitId: residual.commitId };
}

export function repairPendingBetfairCommit(eventId, pendingCommit, dependencies, logDebug) {
    if (pendingCommit.status === 'recovery_failed') {
        return createCommitResult({
            ok: false,
            eventId,
            commitId: pendingCommit.commitId,
            status: 'failed',
            reason: 'recovery_required',
            failedDocument: 'journal'
        });
    }

    const { journalStore } = dependencies;
    const documents = pendingCommit.documents || {};
    let historyCompleted = documents.history?.completed === true;
    let timelineCompleted = documents.timeline?.completed === true;

    for (const documentName of ['history', 'timeline']) {
        const document = documents[documentName];
        const documentCompleted = documentName === 'history'
            ? historyCompleted
            : timelineCompleted;

        if (!document || documentCompleted) continue;

        const payload = document.payload || {};
        let writeResult;

        try {
            writeResult = documentName === 'history'
                ? dependencies.writeHistoryDocument(
                    eventId,
                    payload.document,
                    payload.metadata || {},
                    document.target,
                    pendingCommit.commitId
                )
                : dependencies.writeTimelineDocument(
                    'betfair',
                    eventId,
                    payload.document,
                    payload.metadata || {},
                    document.target,
                    pendingCommit.commitId
                );
        } catch (_) {
            writeResult = null;
        }

        if (!isSuccessfulWrite(writeResult, document.target, pendingCommit.commitId)) {
            return createCommitResult({
                ok: false,
                eventId,
                commitId: pendingCommit.commitId,
                status: documentName === 'timeline' && historyCompleted
                    ? 'partial'
                    : 'failed',
                reason: 'persistence_incomplete',
                failedDocument: documentName
            });
        }

        if (!markCompleted(journalStore, pendingCommit.commitId, documentName)) {
            return createCommitResult({
                ok: false,
                eventId,
                commitId: pendingCommit.commitId,
                status: 'failed',
                reason: 'journal_write_failed',
                failedDocument: 'journal'
            });
        }

        if (documentName === 'history') {
            historyCompleted = true;
        } else {
            timelineCompleted = true;
        }
    }

    const cleanupResult = journalStore.removeCompletedCommit(pendingCommit.commitId);
    if (cleanupResult?.ok !== true ||
        !['removed', 'unchanged'].includes(cleanupResult.status)) {
        return createCommitResult({
            ok: false,
            eventId,
            commitId: pendingCommit.commitId,
            status: 'failed',
            reason: 'journal_cleanup_failed',
            failedDocument: 'journal'
        });
    }

    logDebug(`[BetfairTimeline] Recovered commit eventId=${eventId} commitId=${pendingCommit.commitId}`);

    return withCommitArtifacts(
        createCommitResult({
            ok: true,
            eventId,
            commitId: pendingCommit.commitId,
            status: 'recovered'
        }),
        {
            historyDocument: documents.history?.payload?.document || null,
            timelineDocument: documents.timeline?.payload?.document || null
        }
    );
}

export function repairBetfairCommitFromJournal(record, dependencies = {}) {
    if (!record || typeof record.eventId !== 'string') {
        return createCommitResult({
            ok: false,
            eventId: null,
            commitId: record?.commitId || null,
            status: 'failed',
            reason: 'invalid_record',
            failedDocument: 'journal'
        });
    }

    return repairPendingBetfairCommit(
        record.eventId,
        record,
        dependencies,
        dependencies.logDebug || (() => {})
    );
}
