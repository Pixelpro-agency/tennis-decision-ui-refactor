import { loadSofaPayload } from './loadSofaAnalysis.js';
import { normalizeSnapshot } from './normalizeSnapshot.js';
import { buildLocalContext } from './localContext.js';

export async function buildSofaAnalysis(
    eventId,
    {
        loadSofaPayloadFn = loadSofaPayload,
        normalizeSnapshotFn = normalizeSnapshot,
        buildLocalContextFn = buildLocalContext
    } = {}
) {
    const { endpoints, dataMap } = await loadSofaPayloadFn(eventId);

    const eventData = dataMap[endpoints.event];
    const statsData = dataMap[endpoints.statistics];
    const pbpData = dataMap[endpoints.pbp];

    if (!eventData || eventData.error || !eventData.event) {
        throw new Error(
            eventData?.error?.message || 'Event not found or blocked'
        );
    }

    const snapshotRaw = {
        event: eventData.event,
        statistics: statsData && !statsData.error
            ? statsData.statistics
            : null,
        pbp: pbpData && !pbpData.error
            ? pbpData.pointByPoint
            : null
    };

    const snapshot = normalizeSnapshotFn(snapshotRaw);
    const localContext = buildLocalContextFn(snapshot);

    return {
        eventId,
        endpoints,
        dataMap,
        eventData,
        snapshot,
        localContext
    };
}
