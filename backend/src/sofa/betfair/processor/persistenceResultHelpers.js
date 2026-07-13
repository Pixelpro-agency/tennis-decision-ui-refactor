import { createCommitResult } from './commitResult.js';

export function clearProcessedHistory(processedResult) {
    processedResult.history = {};
}

export function createUnchangedCommitResult(eventId, reason = null) {
    return createCommitResult({
        ok: true,
        eventId,
        status: 'unchanged',
        reason
    });
}

export function createPersistenceFailureResult({
    eventId,
    commitId = null,
    status = 'failed',
    reason,
    failedDocument
}) {
    return createCommitResult({
        ok: false,
        eventId,
        commitId,
        status,
        reason,
        failedDocument
    });
}

export function runLegacyCleanup(result, eventId, cleanupLegacyBetfairTimelineFn) {
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
