import {
    loadHistory as loadHistoryDefault,
    getMatchPersistenceIntegrity as getIntegrityDefault
} from '../../sofa/matchHistory.js';
import { loadTimeline as loadTimelineDefault } from '../../sofa/timelineStore.js';

const VALID_INTEGRITY_STATUSES = new Set([
    'no_known_partial',
    'partial_persistence',
    'recovery_failed'
]);

const VALID_AFFECTED_DOCUMENTS = new Set(['history', 'timeline']);

function normalizeAffectedDocuments(value) {
    return Array.isArray(value)
        ? value.filter(name => VALID_AFFECTED_DOCUMENTS.has(name))
        : [];
}

export function buildDebugLastResponse(lastDebugData) {
    return lastDebugData || {
        error: 'No data captured yet'
    };
}

export function normalizeIntegrity(raw) {
    if (!raw || typeof raw !== 'object') {
        return {
            status: 'no_known_partial',
            reason: null,
            source: null,
            commitId: null,
            affectedDocuments: []
        };
    }

    return {
        status: VALID_INTEGRITY_STATUSES.has(raw.status)
            ? raw.status
            : 'no_known_partial',
        reason: typeof raw.reason === 'string' ? raw.reason : null,
        source: raw.source === 'sofa' ? 'sofa' : null,
        commitId: typeof raw.commitId === 'string' ? raw.commitId : null,
        affectedDocuments: normalizeAffectedDocuments(raw.affectedDocuments)
    };
}

export function withIntegrity(document, integrity) {
    const clone = JSON.parse(JSON.stringify(document));
    clone.integrity = normalizeIntegrity(integrity);
    return clone;
}

export function isMissingIntegrityConflict(integrity) {
    return integrity?.status === 'partial_persistence' ||
        integrity?.status === 'recovery_failed';
}

export function buildMissingResponse(integrity, notFoundBody) {
    const normalized = normalizeIntegrity(integrity);

    if (isMissingIntegrityConflict(normalized)) {
        return {
            httpStatus: 409,
            body: {
                error: 'persistence_integrity',
                integrity: normalized
            }
        };
    }

    return {
        httpStatus: 404,
        body: notFoundBody
    };
}

export function buildMatchHistoryResponse(
    eventId,
    dependencies = {}
) {
    const loadHistory = typeof dependencies.loadHistory === 'function'
        ? dependencies.loadHistory
        : loadHistoryDefault;
    const getIntegrity = typeof dependencies.getMatchPersistenceIntegrity === 'function'
        ? dependencies.getMatchPersistenceIntegrity
        : getIntegrityDefault;

    const historyObj = loadHistory(eventId);
    const integrity = getIntegrity(eventId, 'sofa');

    if (!historyObj) {
        return buildMissingResponse(
            integrity,
            { error: 'History not found for this event' }
        );
    }

    return {
        httpStatus: 200,
        body: withIntegrity(historyObj, integrity)
    };

}

export function buildSofaTimelineResponse(
    eventId,
    dependencies = {}
) {
    const loadTimeline = typeof dependencies.loadTimeline === 'function'
        ? dependencies.loadTimeline
        : loadTimelineDefault;
    const getIntegrity = typeof dependencies.getMatchPersistenceIntegrity === 'function'
        ? dependencies.getMatchPersistenceIntegrity
        : getIntegrityDefault;

    const timeline = loadTimeline('sofa', eventId);
    const integrity = getIntegrity(eventId, 'sofa');

    if (!timeline) {
        return buildMissingResponse(
            integrity,
            { error: 'SofaScore JSON timeline not found for this event' }
        );
    }

    return {
        httpStatus: 200,
        body: withIntegrity(timeline, integrity)
    };

}
