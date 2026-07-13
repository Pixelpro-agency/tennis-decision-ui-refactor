import { createCanonicalCommitId } from '../commitId.js';
import {
    hasSuccessfulResult,
    isValidTarget,
    unchangedResult,
    journalFailure,
    persistenceFailure
} from './commitResult.js';
import { shouldSkipSofaHistoryRow } from './changeDetection.js';
import {
    appendHistoryRow,
    buildHistoryDocument
} from './historyDocument.js';
import {
    cleanupCompletedResidual,
    resumePendingSofaCommit
} from './journalWorkflow.js';
import { prepareTimelineDocument } from './timelineDocument.js';

export function createSofaUpdateHandler({
    latestSofaState,
    latestBetfairState,
    loadHistory,
    loadHistoryResult,
    resolveHistoryFile,
    writeHistoryDocument,
    loadTimeline,
    getTimelineFile,
    writeTimelineDocument,
    journalStore,
    createCommitId = () => createCanonicalCommitId('sofa'),
    getNow = () => new Date()
}) {
    function resumePendingCommit(pending) {
        return resumePendingSofaCommit(pending, {
            writeHistoryDocument,
            writeTimelineDocument,
            journalStore
        });
    }

    function addSofaUpdate(eventId, sofaData, tournamentName, date, timelineData = null) {
        if (typeof eventId !== 'string' || eventId.trim().length === 0) {
            return persistenceFailure({
                eventId: null,
                commitId: null,
                documentName: 'history',
                status: 'failed'
            });
        }

        latestSofaState.set(eventId, sofaData);

        if (!journalStore ||
            typeof journalStore.findPendingCommit !== 'function' ||
            typeof journalStore.createPendingCommit !== 'function' ||
            typeof journalStore.markDocumentComplete !== 'function' ||
            typeof journalStore.removeCompletedCommit !== 'function' ||
            typeof writeHistoryDocument !== 'function' ||
            typeof writeTimelineDocument !== 'function' ||
            typeof resolveHistoryFile !== 'function' ||
            typeof getTimelineFile !== 'function') {
            return journalFailure({ eventId });
        }

        const pending = journalStore.findPendingCommit({
            eventId,
            source: 'sofa'
        });

        if (pending) {
            return resumePendingCommit(pending);
        }

        const residualFailure = cleanupCompletedResidual(journalStore, eventId, 'sofa');
        if (residualFailure) {
            return residualFailure;
        }

        const now = getNow();
        const historyBuild = buildHistoryDocument({
            eventId,
            sofaData,
            tournamentName,
            date,
            now,
            loadHistoryResult
        });

        if (!historyBuild.ok) {
            return persistenceFailure({
                eventId,
                commitId: null,
                documentName: 'history',
                status: 'failed'
            });
        }

        const historyObj = historyBuild.history;
        const latestBetfair = latestBetfairState.get(eventId) || null;
        const lastRow = historyObj.history[historyObj.history.length - 1];

        if (shouldSkipSofaHistoryRow(lastRow, sofaData, latestBetfair)) {
            return unchangedResult(eventId);
        }

        const commitId = createCommitId(eventId);

        if (typeof commitId !== 'string' || commitId.trim().length === 0) {
            return journalFailure({ eventId });
        }

        appendHistoryRow(historyObj, sofaData, latestBetfair, now, commitId);

        const timelineSnapshot = timelineData?.snapshot || sofaData;
        const localContext = timelineData?.localContext ?? null;
        const timelineMetadata = {
            eventId,
            date: date || historyObj.metadata.date,
            tournament: historyObj.metadata.tournament,
            players: historyObj.metadata.players,
            sofaUrl: sofaData?.url || historyObj.metadata.sofaUrl || ''
        };
        const existingTimeline = loadTimeline('sofa', eventId);
        const timelineObj = prepareTimelineDocument({
            eventId,
            snapshot: timelineSnapshot,
            localContext,
            existingTimeline,
            metadata: timelineMetadata,
            now,
            commitId
        });
        const historyTarget = resolveHistoryFile(eventId, historyObj.metadata);
        const timelineTarget = getTimelineFile('sofa', eventId, timelineMetadata);

        if (!isValidTarget(historyTarget) || !isValidTarget(timelineTarget)) {
            return journalFailure({ eventId, commitId });
        }

        const createResult = journalStore.createPendingCommit({
            commitId,
            eventId,
            source: 'sofa',
            documents: {
                history: {
                    target: historyTarget,
                    payload: {
                        document: historyObj,
                        metadata: historyObj.metadata
                    },
                    completed: false
                },
                timeline: {
                    target: timelineTarget,
                    payload: {
                        document: timelineObj,
                        metadata: timelineMetadata
                    },
                    completed: false
                }
            }
        });

        if (!hasSuccessfulResult(createResult)) {
            return journalFailure({
                eventId,
                commitId,
                reason: 'journal_write_failed'
            });
        }

        const created = typeof journalStore.getPendingCommit === 'function'
            ? journalStore.getPendingCommit(commitId)
            : null;

        if (!created) {
            return journalFailure({ eventId, commitId });
        }

        return resumePendingCommit(created);
    }

    return addSofaUpdate;
}
