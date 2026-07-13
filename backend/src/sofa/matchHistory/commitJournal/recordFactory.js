import {
    cloneJson,
    stableJson
} from './recordSchema.js';

export function getCreatedAt({ getNow, getNowMs }) {
    const now = getNow();

    if (now && typeof now.toISOString === 'function') {
        return now.toISOString();
    }

    return new Date(getNowMs()).toISOString();
}

export function makePersistedRecord(record, clock) {
    return {
        version: 1,
        commitId: record.commitId,
        eventId: record.eventId,
        source: record.source,
        createdAt: getCreatedAt(clock),
        status: 'pending',
        documents: {
            history: {
                target: record.documents.history.target,
                payload: cloneJson(record.documents.history.payload),
                completed: false
            },
            timeline: {
                target: record.documents.timeline.target,
                payload: cloneJson(record.documents.timeline.payload),
                completed: false
            }
        },
        reason: null
    };
}

export function isEquivalentInitialRecord(existing, candidate) {
    if (existing.status !== 'pending' || existing.reason !== null) {
        return false;
    }

    return stableJson({
        version: existing.version,
        commitId: existing.commitId,
        eventId: existing.eventId,
        source: existing.source,
        documents: existing.documents
    }) === stableJson({
        version: candidate.version,
        commitId: candidate.commitId,
        eventId: candidate.eventId,
        source: candidate.source,
        documents: candidate.documents
    });
}
