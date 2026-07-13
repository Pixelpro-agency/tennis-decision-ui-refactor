export function cloneJson(value) {
    return JSON.parse(JSON.stringify(value));
}

export function isPlainObject(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function hasSuccessfulResult(result) {
    return result?.ok === true;
}

export function isValidTarget(target) {
    return typeof target === 'string' && target.trim().length > 0;
}

export function isValidCommitId(commitId) {
    return typeof commitId === 'string' &&
        /^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/.test(commitId);
}

export function isValidEventId(eventId) {
    return typeof eventId === 'string' && eventId.trim().length > 0;
}

export function emptyDocuments() {
    return {
        history: { ok: null, status: null, file: null, reason: null },
        timeline: { ok: null, status: null, file: null, reason: null }
    };
}

export function createCommitResult({
    eventId = null,
    commitId = null,
    ok,
    status,
    reason = null,
    failedDocument = null,
    documents = emptyDocuments(),
    warnings = []
}) {
    return {
        ok,
        operation: 'sofa_commit',
        source: 'sofa',
        eventId: typeof eventId === 'string' ? eventId : null,
        commitId: typeof commitId === 'string' ? commitId : null,
        status,
        reason,
        failedDocument,
        documents,
        warnings
    };
}

export function unchangedResult(eventId) {
    return createCommitResult({
        eventId,
        ok: true,
        status: 'unchanged'
    });
}

export function journalFailure({
    eventId,
    commitId = null,
    status = 'failed',
    reason = 'journal_write_failed',
    documents = emptyDocuments(),
    warnings = []
}) {
    return createCommitResult({
        eventId,
        commitId,
        ok: false,
        status,
        reason,
        failedDocument: 'journal',
        documents,
        warnings
    });
}

export function persistenceFailure({
    eventId,
    commitId,
    documentName,
    status,
    documents = emptyDocuments(),
    warnings = []
}) {
    return createCommitResult({
        eventId,
        commitId,
        ok: false,
        status,
        reason: 'persistence_incomplete',
        failedDocument: documentName,
        documents,
        warnings
    });
}

export function matchesJournalTarget(result, target, expectedCommitId) {
    return hasSuccessfulResult(result) &&
        result.file === target &&
        result.commitId === expectedCommitId;
}
