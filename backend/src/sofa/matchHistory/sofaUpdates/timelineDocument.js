import {
    cloneJson,
    isPlainObject
} from './commitResult.js';

export function buildSofaTimelineTick(
    snapshot,
    localContext,
    eventId,
    existingTimeline,
    now,
    commitId
) {
    const lastSeq = Array.isArray(existingTimeline?.timeline)
        ? existingTimeline.timeline.reduce((max, entry) => {
            const seq = entry?.data?.seq;
            return typeof seq === 'number' && seq > max ? seq : max;
        }, 0)
        : 0;
    const statsMatch = Array.isArray(snapshot?.stats?.match)
        ? snapshot.stats.match
        : [];

    return {
        source: 'sofa',
        snapshot,
        localContext: localContext ?? null,
        timestamp: now.toISOString(),
        ts: now.getTime(),
        seq: lastSeq + 1,
        eventId: snapshot?.eventId || eventId,
        players: snapshot?.players || {},
        score: snapshot?.score || {},
        status: snapshot?.status || {},
        serving: snapshot?.serving || null,
        stats: snapshot?.stats || { match: [] },
        diagnostics: {
            hasSnapshot: !!snapshot,
            hasPlayers: !!snapshot?.players,
            hasScore: !!snapshot?.score,
            hasStatus: !!snapshot?.status,
            hasStats: statsMatch.length > 0,
            statsCount: statsMatch.length
        },
        commitId
    };
}

export function prepareTimelineDocument({
    eventId,
    snapshot,
    localContext,
    existingTimeline,
    metadata,
    now,
    commitId
}) {
    const timelineObj = existingTimeline
        ? cloneJson(existingTimeline)
        : {
            metadata: {},
            timeline: []
        };
    delete timelineObj.latest;

    const existingMetadata = isPlainObject(timelineObj.metadata)
        ? timelineObj.metadata
        : {};
    const existingPlayers = isPlainObject(existingMetadata.players)
        ? existingMetadata.players
        : {};
    const incomingPlayers = isPlainObject(metadata.players)
        ? metadata.players
        : {};

    timelineObj.metadata = {
        ...existingMetadata,
        ...metadata,
        source: 'sofa',
        eventId,
        players: {
            ...existingPlayers,
            ...incomingPlayers
        },
        updatedAt: now.toISOString()
    };
    timelineObj.updatedAt = now.toISOString();
    timelineObj.timeline = Array.isArray(timelineObj.timeline)
        ? timelineObj.timeline
        : [];

    const tick = buildSofaTimelineTick(
        snapshot,
        localContext,
        eventId,
        timelineObj,
        now,
        commitId
    );
    const firstTimestamp = timelineObj.timeline[0]?.timestamp || now.toISOString();
    const firstMs = Date.parse(firstTimestamp);
    const elapsedSeconds = Number.isFinite(firstMs)
        ? Math.max(0, Math.floor((now.getTime() - firstMs) / 1000))
        : 0;

    timelineObj.timeline.push({
        timestamp: now.toISOString(),
        elapsedSeconds,
        data: tick
    });

    return timelineObj;
}
