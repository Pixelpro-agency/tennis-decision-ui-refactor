const commitArtifactsByResult = new WeakMap();


export function createCommitResult({
    ok,
    eventId,
    commitId = null,
    status,
    reason = null,
    failedDocument = null,
    legacyWarning = null
}) {
    return {
        ok,
        operation: 'betfair_commit',
        source: 'betfair',
        eventId: typeof eventId === 'string' ? eventId : null,
        commitId,
        status,
        reason,
        failedDocument,
        legacyWarning
    };
}

export function withCommitArtifacts(result, artifacts) {
    commitArtifactsByResult.set(result, artifacts);
    return result;
}

export function getCommitArtifacts(result) {
    return commitArtifactsByResult.get(result) || null;
}

export function isSuccessfulWrite(result, target, expectedCommitId) {
    return result?.ok === true &&
        typeof target === 'string' &&
        result.file === target &&
        result.commitId === expectedCommitId;
}
