import { compileBetfairHistory } from '../history.js';
import {
    applyRecoveredTick,
    getTimelineTick
} from './canonicalTimeline.js';
import {
    createCommitResult,
    getCommitArtifacts
} from './commitResult.js';
import {
    cleanupCompletedResidual,
    repairPendingBetfairCommit
} from './journalRecovery.js';
import { getBetfairPersistenceDependencies } from './persistenceDependencies.js';
import { evaluateBetfairPersistenceDecision } from './persistenceDecision.js';
import { prepareBetfairPersistenceDocuments } from './persistenceDocuments.js';
import { commitBetfairPersistenceDocuments } from './persistenceCommitWorkflow.js';
import {
    clearProcessedHistory,
    createPersistenceFailureResult,
    createUnchangedCommitResult,
    runLegacyCleanup
} from './persistenceResultHelpers.js';

export function persistBetfairProcessedResult(sofaEventId, processedResult, key, options = {}) {
    const logDebug = options.logDebug || (() => {});
    const dependencies = getBetfairPersistenceDependencies(options);
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
            clearProcessedHistory(processedResult);
            return createUnchangedCommitResult(sofaEventId);
        }

        const residualCleanup = cleanupCompletedResidual(
            sofaEventId,
            'betfair',
            dependencies.journalStore
        );

        if (!residualCleanup.ok) {
            clearProcessedHistory(processedResult);
            return createPersistenceFailureResult({
                eventId: sofaEventId,
                commitId: residualCleanup.commitId,
                status: 'failed',
                reason: 'journal_cleanup_failed',
                failedDocument: 'journal'
            });
        }

        const decision = evaluateBetfairPersistenceDecision({
            eventId: sofaEventId,
            processedResult,
            marketKey: key,
            dependencies
        });

        if (decision.action === 'unchanged') {
            clearProcessedHistory(processedResult);
            return createUnchangedCommitResult(sofaEventId, decision.reason);
        }

        const commitId = dependencies.createCommitId(sofaEventId);
        const documents = prepareBetfairPersistenceDocuments({
            eventId: sofaEventId,
            processedResult,
            marketKey: key,
            commitId,
            canonicalTimeline: decision.canonicalTimeline,
            graphLoginStatusOnly: decision.graphLoginStatusOnly,
            newTick: decision.newTick,
            dependencies
        });

        if (!documents.ok) {
            clearProcessedHistory(processedResult);
            return createPersistenceFailureResult({
                eventId: sofaEventId,
                status: 'failed',
                reason: 'persistence_incomplete',
                failedDocument: 'history'
            });
        }

        const commitResult = commitBetfairPersistenceDocuments({
            eventId: sofaEventId,
            commitId,
            documents,
            dependencies
        });

        if (commitResult.ok !== true) {
            clearProcessedHistory(processedResult);
            return commitResult;
        }

        processedResult.history = Array.isArray(documents.historyDocument.history)
            ? compileBetfairHistory(documents.historyDocument)
            : {};

        logDebug(
            `[BetfairTimeline] Committed eventId=${sofaEventId} ` +
            `commitId=${commitId} seq=${decision.newTick.seq} ` +
            `runners=${decision.newTick.runners.length}`
        );

        return runLegacyCleanup(
            commitResult,
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
