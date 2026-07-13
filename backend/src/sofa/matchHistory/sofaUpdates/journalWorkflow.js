import {
    hasSuccessfulResult,
    emptyDocuments,
    createCommitResult
} from './commitResult.js';
import { repairSofaCommitFromJournal } from './recovery.js';

export function cleanupCompletedResidual(journalStore, eventId, source) {
    if (!journalStore || typeof journalStore.findCompletedCommit !== 'function') {
        return null;
    }

    const residual = journalStore.findCompletedCommit({ eventId, source });
    if (!residual) {
        return null;
    }

    const cleanup = journalStore.removeCompletedCommit(residual.commitId);

    if (!hasSuccessfulResult(cleanup)) {
        return createCommitResult({
            eventId,
            commitId: residual.commitId,
            ok: false,
            status: 'failed',
            reason: 'journal_cleanup_failed',
            failedDocument: 'journal',
            documents: emptyDocuments()
        });
    }

    return null;
}

export function resumePendingSofaCommit(
    pending,
    {
        writeHistoryDocument,
        writeTimelineDocument,
        journalStore
    }
) {
    const { eventId, commitId } = pending;
    const documents = emptyDocuments();

    if (pending.status === 'recovery_failed') {
        return createCommitResult({
            eventId,
            commitId,
            ok: false,
            status: 'failed',
            reason: 'recovery_required',
            failedDocument: 'journal',
            documents
        });
    }

    return repairSofaCommitFromJournal(pending, {
        writeHistoryDocument,
        writeTimelineDocument,
        journalStore
    }, { successStatus: 'complete' });
}
