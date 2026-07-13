import {
    cloneJson,
    isPlainObject,
    hasSuccessfulResult,
    isValidTarget,
    isValidCommitId,
    isValidEventId,
    emptyDocuments,
    createCommitResult,
    unchangedResult,
    journalFailure,
    persistenceFailure,
    matchesJournalTarget
} from './commitResult.js';

export function repairSofaCommitFromJournal(record, dependencies = {}, options = {}) {
    const successStatus = options.successStatus || 'recovered';
    const {
        writeHistoryDocument: repairWriteHistory,
        writeTimelineDocument: repairWriteTimeline,
        journalStore: repairJournalStore
    } = dependencies;

    const eventId = record?.eventId;
    const commitId = record?.commitId;
    const source = record?.source;

    if (!isValidEventId(eventId) ||
        !isValidCommitId(commitId) ||
        source !== 'sofa' ||
        !isPlainObject(record.documents) ||
        !isPlainObject(record.documents.history) ||
        !isPlainObject(record.documents.timeline)) {
        return createCommitResult({
            eventId: typeof eventId === 'string' ? eventId : null,
            commitId: typeof commitId === 'string' ? commitId : null,
            ok: false,
            status: 'failed',
            reason: 'invalid_record',
            failedDocument: 'journal',
            documents: emptyDocuments()
        });
    }

    const documents = emptyDocuments();
    let historyCompleted = record.documents.history.completed === true;
    let timelineCompleted = record.documents.timeline.completed === true;

    if (!historyCompleted) {
        const history = record.documents.history;
        if (!isValidTarget(history.target) || !isPlainObject(history.payload)) {
            return createCommitResult({
                eventId,
                commitId,
                ok: false,
                status: 'failed',
                reason: 'invalid_record',
                failedDocument: 'history',
                documents
            });
        }

        const writeResult = repairWriteHistory(
            eventId,
            history.payload.document,
            history.payload.metadata,
            history.target,
            commitId
        );

        documents.history = {
            ok: writeResult?.ok ?? null,
            status: writeResult?.status ?? null,
            file: writeResult?.file ?? null,
            reason: writeResult?.reason ?? null
        };

        if (!matchesJournalTarget(writeResult, history.target, commitId)) {
            return persistenceFailure({
                eventId,
                commitId,
                documentName: 'history',
                status: 'failed',
                documents
            });
        }

        const marked = repairJournalStore.markDocumentComplete(commitId, 'history');

        if (!hasSuccessfulResult(marked)) {
            return journalFailure({
                eventId,
                commitId,
                status: 'partial',
                documents
            });
        }

        historyCompleted = true;
    } else {
        documents.history = {
            ok: true,
            status: 'written',
            file: record.documents.history.target,
            reason: null
        };
    }

    if (!timelineCompleted) {
        const timeline = record.documents.timeline;
        if (!isValidTarget(timeline.target) || !isPlainObject(timeline.payload)) {
            return createCommitResult({
                eventId,
                commitId,
                ok: false,
                status: 'failed',
                reason: 'invalid_record',
                failedDocument: 'timeline',
                documents
            });
        }

        const writeResult = repairWriteTimeline(
            'sofa',
            eventId,
            timeline.payload.document,
            timeline.payload.metadata,
            timeline.target,
            commitId
        );

        documents.timeline = {
            ok: writeResult?.ok ?? null,
            status: writeResult?.status ?? null,
            file: writeResult?.file ?? null,
            reason: writeResult?.reason ?? null
        };

        if (!matchesJournalTarget(writeResult, timeline.target, commitId)) {
            return persistenceFailure({
                eventId,
                commitId,
                documentName: 'timeline',
                status: historyCompleted ? 'partial' : 'failed',
                documents
            });
        }

        const marked = repairJournalStore.markDocumentComplete(commitId, 'timeline');

        if (!hasSuccessfulResult(marked)) {
            return journalFailure({
                eventId,
                commitId,
                status: 'partial',
                documents
            });
        }

        timelineCompleted = true;
    } else {
        documents.timeline = {
            ok: true,
            status: 'written',
            file: record.documents.timeline.target,
            reason: null
        };
    }

    if (!historyCompleted || !timelineCompleted) {
        return journalFailure({
            eventId,
            commitId,
            status: historyCompleted ? 'partial' : 'failed',
            documents
        });
    }

    const cleanup = repairJournalStore.removeCompletedCommit(commitId);

    if (!hasSuccessfulResult(cleanup)) {
        return createCommitResult({
            eventId,
            commitId,
            ok: false,
            status: 'failed',
            reason: 'journal_cleanup_failed',
            failedDocument: 'journal',
            documents
        });
    }

    return createCommitResult({
        eventId,
        commitId,
        ok: true,
        status: successStatus,
        reason: null,
        failedDocument: null,
        documents
    });
}
