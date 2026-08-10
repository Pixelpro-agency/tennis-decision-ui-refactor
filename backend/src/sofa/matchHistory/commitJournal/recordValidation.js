import {
    DOCUMENT_NAMES,
    hasOnlyKeys,
    isPlainObject,
    isSafeJsonValue,
    isValidCommitId,
    isValidEventId,
    isValidRecoveryReason,
    isValidSource,
    isValidTarget
} from './recordSchema.js';

export function validateDocument(document) {
    return isPlainObject(document) &&
        hasOnlyKeys(document, ['target', 'payload', 'completed']) &&
        isValidTarget(document.target) &&
        isPlainObject(document.payload) &&
        isSafeJsonValue(document.payload) &&
        typeof document.completed === 'boolean';
}

export function validateRepairPayload(record, documentName) {
    const descriptor = record?.documents?.[documentName];
    const document = descriptor?.payload?.document;
    const metadata = document?.metadata;
    const rows = documentName === 'history' ? document?.history : document?.timeline;
    if (!isPlainObject(document) || !isPlainObject(metadata) || !Array.isArray(rows)) return 'invalid_payload_shape';
    if (metadata.eventId != null && metadata.eventId !== record.eventId) return 'payload_event_mismatch';
    if (documentName === 'timeline' && metadata.source != null && metadata.source !== record.source) return 'payload_source_mismatch';
    return null;
}

export function validateIncomingRecord(record) {
    if (!isPlainObject(record) || !isSafeJsonValue(record)) {
        return 'invalid_record';
    }

    if (!isValidCommitId(record.commitId)) {
        return 'invalid_commit_id';
    }

    if (!isValidEventId(record.eventId)) {
        return 'invalid_event_id';
    }

    if (!isValidSource(record.source)) {
        return 'invalid_source';
    }

    if (!isPlainObject(record.documents) ||
        !hasOnlyKeys(record.documents, DOCUMENT_NAMES) ||
        !validateDocument(record.documents.history) ||
        !validateDocument(record.documents.timeline) ||
        record.documents.history.completed !== false ||
        record.documents.timeline.completed !== false) {
        return 'invalid_record';
    }

    return null;
}

export function validatePersistedRecord(record) {
    if (!isPlainObject(record) ||
        !hasOnlyKeys(record, [
            'version',
            'commitId',
            'eventId',
            'source',
            'createdAt',
            'status',
            'documents',
            'reason'
        ]) ||
        !isSafeJsonValue(record) ||
        record.version !== 1 ||
        !isValidCommitId(record.commitId) ||
        !isValidEventId(record.eventId) ||
        !isValidSource(record.source) ||
        typeof record.createdAt !== 'string' ||
        !Number.isFinite(Date.parse(record.createdAt)) ||
        !isPlainObject(record.documents) ||
        !hasOnlyKeys(record.documents, DOCUMENT_NAMES) ||
        !validateDocument(record.documents.history) ||
        !validateDocument(record.documents.timeline)) {
        return false;
    }

    if (record.status === 'pending') {
        return record.reason === null;
    }

    if (record.status === 'recovery_failed') {
        return isValidRecoveryReason(record.reason);
    }

    return false;
}
