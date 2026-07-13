import { loadSofaPayload } from './loadSofaAnalysis.js';
import { normalizeSnapshot } from './normalizeSnapshot.js';
import { buildLocalContext } from './localContext.js';
import { addSofaUpdate } from './matchHistory.js';
import {
    observeSofaSourceIdentitySample,
    getSourceIdentityGateStatus
} from './sourceIdentityGate.js';

function emptyCommitDocuments() {
    return {
        history: { ok: null, status: null, file: null, reason: null },
        timeline: { ok: null, status: null, file: null, reason: null }
    };
}

function createSofaCommitFailure(eventId) {
    return {
        ok: false,
        operation: 'sofa_commit',
        source: 'sofa',
        eventId: typeof eventId === 'string' ? eventId : null,
        commitId: null,
        status: 'failed',
        reason: 'persistence_incomplete',
        failedDocument: null,
        documents: emptyCommitDocuments(),
        warnings: []
    };
}

const ALLOWED_STATUSES = new Set(['complete', 'unchanged', 'partial', 'failed']);
const ALLOWED_FAILED_DOCUMENTS = new Set(['history', 'timeline', 'journal']);

function isValidDocumentState(value) {
    return value !== null &&
        typeof value === 'object' &&
        !Array.isArray(value) &&
        (value.ok === null || typeof value.ok === 'boolean') &&
        (value.status === null || typeof value.status === 'string') &&
        (value.file === null || typeof value.file === 'string') &&
        (value.reason === null || typeof value.reason === 'string');
}

function isValidSofaCommitEnvelope(result, expectedEventId) {
    if (!result || typeof result !== 'object' || Array.isArray(result) || typeof result.ok !== 'boolean') {
        return false;
    }

    if (result.operation !== 'sofa_commit' || result.source !== 'sofa') {
        return false;
    }

    if (result.eventId !== null && typeof result.eventId !== 'string') return false;
    if (result.commitId !== null && typeof result.commitId !== 'string') return false;
    if (!ALLOWED_STATUSES.has(result.status)) return false;
    if (result.reason !== null && typeof result.reason !== 'string') return false;
    if (result.failedDocument !== null && !ALLOWED_FAILED_DOCUMENTS.has(result.failedDocument)) {
        return false;
    }

    if (!result.documents || typeof result.documents !== 'object' || Array.isArray(result.documents)) {
        return false;
    }

    if (!isValidDocumentState(result.documents.history)) return false;
    if (!isValidDocumentState(result.documents.timeline)) return false;

    if (!Array.isArray(result.warnings)) return false;

    if (result.ok === true) {
        if (result.status !== 'complete' && result.status !== 'unchanged') return false;
        if (result.reason !== null) return false;
        if (result.failedDocument !== null) return false;
    } else {
        if (result.status !== 'partial' && result.status !== 'failed') return false;
        if (typeof result.reason !== 'string' || result.reason.trim().length === 0) return false;
    }

    if (typeof expectedEventId === 'string' && expectedEventId.trim().length > 0) {
        if (result.eventId !== expectedEventId) {
            return false;
        }
    }

    return true;
}

export function normalizeSofaCommitResult(result, eventId) {
    if (isValidSofaCommitEnvelope(result, eventId)) {
        return result;
    }

    return createSofaCommitFailure(eventId);
}

export function persistSofaTrackingSample(
    eventId,
    snapshot,
    tournamentName,
    dateStr,
    timelineData = {},
    dependencies = {}
) {
    const addSofaUpdateFn = dependencies.addSofaUpdate || addSofaUpdate;
    const buildLocalContextFn =
        dependencies.buildLocalContext || buildLocalContext;

    const incomingTimelineData =
        timelineData && typeof timelineData === 'object'
            ? timelineData
            : {};

    const effectiveTimelineData = {
        ...incomingTimelineData,
        snapshot: incomingTimelineData.snapshot ?? snapshot,
        localContext:
            incomingTimelineData.localContext ??
            buildLocalContextFn(snapshot)
    };

    const persistenceResult = addSofaUpdateFn(
        eventId,
        snapshot,
        tournamentName,
        dateStr,
        effectiveTimelineData
    );

    return normalizeSofaCommitResult(persistenceResult, eventId);
}

export async function updateSofa(eventId, info, dependencies = {}) {
    const loadPayloadFn = dependencies.loadSofaPayload || loadSofaPayload;
    const normalizeSnapshotFn = dependencies.normalizeSnapshot || normalizeSnapshot;
    const buildLocalContextFn = dependencies.buildLocalContext || buildLocalContext;
    const observeFn = dependencies.observeSofaSourceIdentitySample || observeSofaSourceIdentitySample;
    const persistFn = dependencies.persistSofaTrackingSample || persistSofaTrackingSample;

    const { endpoints, dataMap } = await loadPayloadFn(eventId);

    const eventData = dataMap[endpoints.event];
    const statsData = dataMap[endpoints.statistics];
    const pbpData = dataMap[endpoints.pbp];

    if (!eventData || eventData.error || !eventData.event) {
        throw new Error(eventData?.error?.message || "Event not found or blocked");
    }

    const snapshotRaw = {
        event: eventData.event,
        statistics: statsData && !statsData.error ? statsData.statistics : null,
        pbp: pbpData && !pbpData.error ? pbpData.pointByPoint : null
    };

    const snapshot = normalizeSnapshotFn(snapshotRaw);
    const localContext = buildLocalContextFn(snapshot);

    const tournamentName = eventData?.event?.tournament?.name || 'unknown_tournament';
    const dateStr = eventData?.event?.startTimestamp
        ? new Date(eventData.event.startTimestamp * 1000).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0];

    const sample = {
        snapshot,
        tournamentName,
        dateStr
    };

    // Observe sample for gate evaluation
    const observation = observeFn(eventId, sample, { localContext });
    const action = observation?.action || 'no-gate';

    if (action === 'persist-current' || action === 'no-gate') {
        const persistenceResult = persistFn(eventId, snapshot, tournamentName, dateStr, {
            snapshot,
            localContext
        });
        return normalizeSofaCommitResult(persistenceResult, eventId);
    }

    return {
        ok: true,
        operation: 'sofa_commit',
        source: 'sofa',
        eventId: typeof eventId === 'string' ? eventId : null,
        commitId: null,
        status: 'unchanged',
        reason: null,
        failedDocument: null,
        documents: emptyCommitDocuments(),
        warnings: [`source_identity_gate:${action}`]
    };
}
