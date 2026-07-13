import {
    compareIntegrityRecords,
    getAffectedDocuments,
    isActiveRecord,
    isValidEventId,
    isValidSource
} from './recordSchema.js';

export function getPersistenceIntegrityStatusFromRecords(
    records,
    eventId,
    source = undefined
) {
    const requestedSource = isValidSource(source) ? source : null;

    if (!isValidEventId(eventId) ||
        (source !== undefined && source !== null && !isValidSource(source))) {
        return {
            status: 'no_known_partial',
            reason: null,
            source: requestedSource,
            commitId: null,
            affectedDocuments: []
        };
    }

    const candidates = records
        .filter(record =>
            record.eventId === eventId &&
            (requestedSource === null || record.source === requestedSource) &&
            isActiveRecord(record)
        )
        .sort(compareIntegrityRecords);

    if (candidates.length === 0) {
        return {
            status: 'no_known_partial',
            reason: null,
            source: requestedSource,
            commitId: null,
            affectedDocuments: []
        };
    }

    const selected = candidates[0];
    const affectedDocuments = getAffectedDocuments(selected);

    if (selected.status === 'recovery_failed') {
        return {
            status: 'recovery_failed',
            reason: selected.reason || 'recovery_failed',
            source: selected.source,
            commitId: selected.commitId,
            affectedDocuments
        };
    }

    return {
        status: 'partial_persistence',
        reason: 'pending_commit',
        source: selected.source,
        commitId: selected.commitId,
        affectedDocuments
    };
}
