function isPlainObject(value) {
    return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function cloneJson(value) {
    return JSON.parse(JSON.stringify(value));
}

export function isGraphLoginStatusOnlySample(processedResult, lastTick) {
    const graphRowsTotal = Number(
        processedResult?.graph_diagnostics?.graphRowsTotal || 0
    );

    return Boolean(lastTick) &&
        processedResult?.diagnostics?.graphLoginRequired === true &&
        graphRowsTotal === 0 &&
        processedResult?.timelineIntegrity?.accepted === false;
}

function isCanonicalBetfairEntry(entry) {
    return entry &&
        entry.data &&
        entry.data.source === 'betfair' &&
        Number.isFinite(entry.data.seq) &&
        Array.isArray(entry.data.runners);
}

export function toCanonicalTimelineView(timelineDocument) {
    if (!timelineDocument || !Array.isArray(timelineDocument.timeline)) {
        return { metadata: {}, timeline: [] };
    }

    const view = { ...timelineDocument, timeline: timelineDocument.timeline.filter(isCanonicalBetfairEntry) };
    delete view.latest;
    return view;
}

export function createTimelineDocument(canonicalTimeline, eventId, tick, metadata) {
    const timelineDocument = canonicalTimeline
        ? cloneJson(canonicalTimeline)
        : {
            metadata: {},
            timeline: []
        };

    delete timelineDocument.latest;

    if (!Array.isArray(timelineDocument.timeline)) {
        timelineDocument.timeline = [];
    }

    const existingMetadata = isPlainObject(timelineDocument.metadata)
        ? timelineDocument.metadata
        : {};
    timelineDocument.metadata = {
        ...existingMetadata,
        ...metadata,
        eventId,
        source: 'betfair',
        players: {
            ...(existingMetadata.players || {}),
            ...(metadata.players || {})
        }
    };

    const firstTimestamp = timelineDocument.timeline[0]?.timestamp || tick.timestamp;
    const elapsedSeconds = Math.max(
        0,
        Math.floor(
            (new Date(tick.timestamp).getTime() - new Date(firstTimestamp).getTime()) /
            1000
        )
    );

    timelineDocument.updatedAt = tick.timestamp;
    timelineDocument.timeline.push({
        timestamp: tick.timestamp,
        elapsedSeconds,
        data: tick
    });

    return timelineDocument;
}

export function getTimelineTick(timelineDocument) {
    const timeline = timelineDocument?.timeline;
    const lastEntry = Array.isArray(timeline)
        ? timeline[timeline.length - 1]
        : null;

    return lastEntry?.data?.source === 'betfair'
        ? lastEntry.data
        : null;
}

export function applyRecoveredTick(processedResult, tick) {
    if (!tick || !Array.isArray(tick.runners)) return;

    const runnersBySelectionId = new Map(
        tick.runners
            .filter(runner => runner?.selectionId !== null && runner?.selectionId !== undefined)
            .map(runner => [String(runner.selectionId), runner])
    );

    processedResult.runners = (processedResult.runners || []).map(runner => {
        const canonical = runnersBySelectionId.get(String(runner?.selectionId));

        if (!canonical) return runner;

        return {
            ...runner,
            name: canonical.name,
            selectionId: canonical.selectionId,
            matchedTotal: canonical.matchedTotal,
            totalMatchedOnSelection: canonical.totalMatchedOnSelection,
            state: {
                ...(runner.state || {}),
                lastPriceTraded: canonical.lastTradedPrice,
                totalMatched: canonical.matchedTotal
            },
            back: (canonical.bookBack || []).map(level => ({
                price: level.price,
                vol: level.size
            })),
            lay: (canonical.bookLay || []).map(level => ({
                price: level.price,
                vol: level.size
            })),
            ladder: (canonical.ladder || []).map(level => ({
                price: level.price,
                back_available: level.back,
                lay_available: level.lay,
                traded: level.traded
            })),
            ladderSource: canonical.ladderSource,
            moneyFlow: canonical.moneyFlow
        };
    });

    processedResult.market_info = {
        ...(processedResult.market_info || {}),
        market_id: tick.market?.marketId || processedResult.market_info?.market_id,
        total_matched: tick.market?.totalMatched ?? processedResult.market_info?.total_matched
    };
    processedResult.event_status = tick.event_status || processedResult.event_status;
}
