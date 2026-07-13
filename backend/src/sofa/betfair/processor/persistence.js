import {
    getBetfairCommitDependencies,
    prepareBetfairHistory
} from '../../matchHistory.js';
import { loadTimeline } from '../../timelineStore.js';
import { createCanonicalCommitId } from '../../matchHistory/commitId.js';
import { sanitizeBetfairPayloadForHistory } from '../payload.js';
import { compileBetfairHistory } from '../history.js';
import {
    buildBetfairTimelineTick,
    findLastAlgorithmicTick,
    getNextBetfairSeq,
    isDuplicateBetfairTick,
    isRegressiveBetfairTick
} from '../timeline.js';
import { classifyBetfairTechnicalSample } from './technicalSample.js';
import {
    applyRecoveredTick,
    createTimelineDocument,
    getTimelineTick,
    isGraphLoginStatusOnlySample,
    toCanonicalTimelineView
} from './canonicalTimeline.js';
import {
    createCommitResult,
    getCommitArtifacts,
    isSuccessfulWrite,
    withCommitArtifacts
} from './commitResult.js';
import {
    cleanupCompletedResidual,
    markCompleted,
    repairPendingBetfairCommit
} from './journalRecovery.js';

function getDependencies(options) {
    const wired = getBetfairCommitDependencies();

    return {
        prepareBetfairHistory:
            options.prepareBetfairHistory || prepareBetfairHistory,
        resolveHistoryFile:
            options.resolveHistoryFile || wired.resolveHistoryFile,
        writeHistoryDocument:
            options.writeHistoryDocument || wired.writeHistoryDocument,
        getTimelineFile:
            options.getTimelineFile || wired.getTimelineFile,
        writeTimelineDocument:
            options.writeTimelineDocument || wired.writeTimelineDocument,
        journalStore:
            options.journalStore || wired.journalStore,
        loadTimeline:
            options.loadTimeline || loadTimeline,
        createCommitId:
            options.createCommitId || (() => createCanonicalCommitId('betfair'))
    };
}

function runLegacyCleanup(result, eventId, cleanupLegacyBetfairTimelineFn) {
    try {
        const legacyResult = cleanupLegacyBetfairTimelineFn(eventId);

        if (legacyResult?.ok === false) {
            result.legacyWarning = {
                code: legacyResult.code === 'legacy_write_failed'
                    ? 'legacy_write_failed'
                    : 'legacy_cleanup_failed'
            };
        }
    } catch (_) {
        result.legacyWarning = { code: 'legacy_cleanup_failed' };
    }

    return result;
}

export function persistBetfairProcessedResult(sofaEventId, processedResult, key, options = {}) {
    const logDebug = options.logDebug || (() => {});
    const dependencies = getDependencies(options);
    const cleanupLegacyBetfairTimelineFn =
        options.cleanupLegacyBetfairTimeline || (() => {});

    try {
        const pendingCommit = dependencies.journalStore.findPendingCommit({
            eventId: sofaEventId,
            source: 'betfair'
        });

        if (pendingCommit) {
            const recoveryResult = repairPendingBetfairCommit(
                sofaEventId,
                pendingCommit,
                dependencies,
                logDebug
            );

            if (recoveryResult.ok) {
                const recoveredArtifacts = getCommitArtifacts(recoveryResult);
                const recoveredHistory = recoveredArtifacts?.historyDocument || null;
                const recoveredTimeline = recoveredArtifacts?.timelineDocument || null;

                processedResult.history = Array.isArray(recoveredHistory?.history)
                    ? compileBetfairHistory(recoveredHistory)
                    : {};
                applyRecoveredTick(
                    processedResult,
                    getTimelineTick(recoveredTimeline)
                );

                return runLegacyCleanup(
                    recoveryResult,
                    sofaEventId,
                    cleanupLegacyBetfairTimelineFn
                );
            }

            processedResult.history = {};
            return recoveryResult;
        }

        if (options.repairOnly === true) {
            processedResult.history = {};
            return createCommitResult({
                ok: true,
                eventId: sofaEventId,
                status: 'unchanged'
            });
        }

        const residualCleanup = cleanupCompletedResidual(
            sofaEventId,
            'betfair',
            dependencies.journalStore
        );

        if (!residualCleanup.ok) {
            processedResult.history = {};
            return createCommitResult({
                ok: false,
                eventId: sofaEventId,
                commitId: residualCleanup.commitId,
                status: 'failed',
                reason: 'journal_cleanup_failed',
                failedDocument: 'journal'
            });
        }

        const technicalSample = classifyBetfairTechnicalSample(processedResult);

        if (!technicalSample.usable) {
            processedResult.history = {};
            return createCommitResult({
                ok: true,
                eventId: sofaEventId,
                status: 'unchanged'
            });
        }

        const existingTimeline = dependencies.loadTimeline('betfair', sofaEventId);
        const canonicalTimeline = toCanonicalTimelineView(existingTimeline);
        const lastTick = findLastAlgorithmicTick(canonicalTimeline);
        const newTick = buildBetfairTimelineTick(
            processedResult,
            key,
            canonicalTimeline
        );
        const graphLoginStatusOnly = isGraphLoginStatusOnlySample(
            processedResult,
            lastTick
        );

        if (processedResult.timelineIntegrity?.accepted === false &&
            !graphLoginStatusOnly) {
            processedResult.history = {};
            return createCommitResult({
                ok: true,
                eventId: sofaEventId,
                status: 'unchanged',
                reason: 'regressive_tick'
            });
        }

        if (isRegressiveBetfairTick(lastTick, newTick)) {
            processedResult.history = {};
            return createCommitResult({
                ok: true,
                eventId: sofaEventId,
                status: 'unchanged',
                reason: 'regressive_tick'
            });
        }

        if (isDuplicateBetfairTick(lastTick, newTick)) {
            processedResult.history = {};
            return createCommitResult({
                ok: true,
                eventId: sofaEventId,
                status: 'unchanged',
                reason: 'duplicate_tick'
            });
        }

        const commitId = dependencies.createCommitId(sofaEventId);
        newTick.seq = getNextBetfairSeq(canonicalTimeline);
        newTick.commitId = commitId;

        const historyPreparation = dependencies.prepareBetfairHistory(
            sofaEventId,
            sanitizeBetfairPayloadForHistory(processedResult),
            key,
            { append: !graphLoginStatusOnly, commitId }
        );

        if (historyPreparation?.ok !== true ||
            !historyPreparation.document ||
            !historyPreparation.metadata) {
            processedResult.history = {};
            return createCommitResult({
                ok: false,
                eventId: sofaEventId,
                status: 'failed',
                reason: 'persistence_incomplete',
                failedDocument: 'history'
            });
        }

        const historyDocument = historyPreparation.document;
        const historyMetadata = historyPreparation.metadata;
        const timelineMetadata = {
            date: historyMetadata.date,
            tournament: historyMetadata.tournament,
            players: historyMetadata.players,
            sofaUrl: historyMetadata.sofaUrl || '',
            betfairUrl: key || historyMetadata.betfairUrl || ''
        };
        const timelineDocument = createTimelineDocument(
            canonicalTimeline,
            sofaEventId,
            newTick,
            timelineMetadata
        );

        const historyTarget = dependencies.resolveHistoryFile(
            sofaEventId,
            historyMetadata
        );
        const timelineTarget = dependencies.getTimelineFile(
            'betfair',
            sofaEventId,
            timelineMetadata
        );

        const createResult = dependencies.journalStore.createPendingCommit({
            commitId,
            eventId: sofaEventId,
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
            processedResult.history = {};
            return createCommitResult({
                ok: false,
                eventId: sofaEventId,
                commitId,
                status: 'failed',
                reason: 'journal_write_failed',
                failedDocument: 'journal'
            });
        }

        const persistedCommit = dependencies.journalStore.getPendingCommit(commitId);
        if (!persistedCommit) {
            processedResult.history = {};
            return createCommitResult({
                ok: false,
                eventId: sofaEventId,
                commitId,
                status: 'failed',
                reason: 'journal_write_failed',
                failedDocument: 'journal'
            });
        }

        const historyWriteResult = dependencies.writeHistoryDocument(
            sofaEventId,
            historyDocument,
            historyMetadata,
            historyTarget,
            commitId
        );

        if (!isSuccessfulWrite(historyWriteResult, historyTarget, commitId)) {
            processedResult.history = {};
            return createCommitResult({
                ok: false,
                eventId: sofaEventId,
                commitId,
                status: 'failed',
                reason: 'persistence_incomplete',
                failedDocument: 'history'
            });
        }

        if (!markCompleted(dependencies.journalStore, commitId, 'history')) {
            processedResult.history = {};
            return createCommitResult({
                ok: false,
                eventId: sofaEventId,
                commitId,
                status: 'failed',
                reason: 'journal_write_failed',
                failedDocument: 'journal'
            });
        }

        const timelineWriteResult = dependencies.writeTimelineDocument(
            'betfair',
            sofaEventId,
            timelineDocument,
            timelineMetadata,
            timelineTarget,
            commitId
        );

        if (!isSuccessfulWrite(timelineWriteResult, timelineTarget, commitId)) {
            processedResult.history = {};
            return createCommitResult({
                ok: false,
                eventId: sofaEventId,
                commitId,
                status: 'partial',
                reason: 'persistence_incomplete',
                failedDocument: 'timeline'
            });
        }

        if (!markCompleted(dependencies.journalStore, commitId, 'timeline')) {
            processedResult.history = {};
            return createCommitResult({
                ok: false,
                eventId: sofaEventId,
                commitId,
                status: 'failed',
                reason: 'journal_write_failed',
                failedDocument: 'journal'
            });
        }

        const cleanupResult = dependencies.journalStore.removeCompletedCommit(commitId);
        if (cleanupResult?.ok !== true ||
            !['removed', 'unchanged'].includes(cleanupResult.status)) {
            processedResult.history = {};
            return createCommitResult({
                ok: false,
                eventId: sofaEventId,
                commitId,
                status: 'failed',
                reason: 'journal_cleanup_failed',
                failedDocument: 'journal'
            });
        }

        processedResult.history = Array.isArray(historyDocument.history)
            ? compileBetfairHistory(historyDocument)
            : {};

        const completeResult = withCommitArtifacts(
            createCommitResult({
                ok: true,
                eventId: sofaEventId,
                commitId,
                status: 'complete'
            }),
            { historyDocument, timelineDocument }
        );

        logDebug(
            `[BetfairTimeline] Committed eventId=${sofaEventId} ` +
            `commitId=${commitId} seq=${newTick.seq} ` +
            `runners=${newTick.runners.length}`
        );

        return runLegacyCleanup(
            completeResult,
            sofaEventId,
            cleanupLegacyBetfairTimelineFn
        );
    } catch (error) {
        logDebug(`[BetfairFetch] Betfair commit error: ${error?.message || 'unknown'}`);
        processedResult.history = {};

        return createCommitResult({
            ok: false,
            eventId: sofaEventId,
            status: 'failed',
            reason: 'journal_write_failed',
            failedDocument: 'journal'
        });
    }
}
