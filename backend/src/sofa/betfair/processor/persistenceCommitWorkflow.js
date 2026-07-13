import {
    createCommitResult,
    isSuccessfulWrite,
    withCommitArtifacts
} from './commitResult.js';
import { markCompleted } from './journalRecovery.js';

export function commitBetfairPersistenceDocuments({
    eventId,
    commitId,
    documents,
    dependencies
}) {
    const {
        historyDocument,
        historyMetadata,
        historyTarget,
        timelineDocument,
        timelineMetadata,
        timelineTarget
    } = documents;

    const createResult = dependencies.journalStore.createPendingCommit({
        commitId,
        eventId,
        source: 'betfair',
        documents: {
            history: {
                target: historyTarget,
                payload: {
                    document: historyDocument,
                    metadata: historyMetadata
                },
                completed: false
            },
            timeline: {
                target: timelineTarget,
                payload: {
                    document: timelineDocument,
                    metadata: timelineMetadata
                },
                completed: false
            }
        }
    });

    if (createResult?.ok !== true ||
        !['created', 'unchanged'].includes(createResult.status)) {
        return createCommitResult({
            ok: false,
            eventId,
            commitId,
            status: 'failed',
            reason: 'journal_write_failed',
            failedDocument: 'journal'
        });
    }

    const persistedCommit = dependencies.journalStore.getPendingCommit(commitId);
    if (!persistedCommit) {
        return createCommitResult({
            ok: false,
            eventId,
            commitId,
            status: 'failed',
            reason: 'journal_write_failed',
            failedDocument: 'journal'
        });
    }

    const historyWriteResult = dependencies.writeHistoryDocument(
        eventId,
        historyDocument,
        historyMetadata,
        historyTarget,
        commitId
    );

    if (!isSuccessfulWrite(historyWriteResult, historyTarget, commitId)) {
        return createCommitResult({
            ok: false,
            eventId,
            commitId,
            status: 'failed',
            reason: 'persistence_incomplete',
            failedDocument: 'history'
        });
    }

    if (!markCompleted(dependencies.journalStore, commitId, 'history')) {
        return createCommitResult({
            ok: false,
            eventId,
            commitId,
            status: 'failed',
            reason: 'journal_write_failed',
            failedDocument: 'journal'
        });
    }

    const timelineWriteResult = dependencies.writeTimelineDocument(
        'betfair',
        eventId,
        timelineDocument,
        timelineMetadata,
        timelineTarget,
        commitId
    );

    if (!isSuccessfulWrite(timelineWriteResult, timelineTarget, commitId)) {
        return createCommitResult({
            ok: false,
            eventId,
            commitId,
            status: 'partial',
            reason: 'persistence_incomplete',
            failedDocument: 'timeline'
        });
    }

    if (!markCompleted(dependencies.journalStore, commitId, 'timeline')) {
        return createCommitResult({
            ok: false,
            eventId,
            commitId,
            status: 'failed',
            reason: 'journal_write_failed',
            failedDocument: 'journal'
        });
    }

    const cleanupResult = dependencies.journalStore.removeCompletedCommit(commitId);
    if (cleanupResult?.ok !== true ||
        !['removed', 'unchanged'].includes(cleanupResult.status)) {
        return createCommitResult({
            ok: false,
            eventId,
            commitId,
            status: 'failed',
            reason: 'journal_cleanup_failed',
            failedDocument: 'journal'
        });
    }

    return withCommitArtifacts(
        createCommitResult({
            ok: true,
            eventId,
            commitId,
            status: 'complete'
        }),
        { historyDocument, timelineDocument }
    );
}
