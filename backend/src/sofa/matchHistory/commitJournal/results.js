export function createSafeLogger(logError) {
    return function logSafe(message) {
        try {
            logError(`[CommitJournal] ${message}`);
        } catch (_) {
        }
    };
}

export function createResult({
    eventId = null,
    source = null,
    commitId = null,
    status,
    reason = null,
    file = null
}) {
    return {
        ok: status !== 'failed',
        operation: 'journal',
        eventId,
        source,
        commitId,
        status,
        reason,
        file
    };
}
