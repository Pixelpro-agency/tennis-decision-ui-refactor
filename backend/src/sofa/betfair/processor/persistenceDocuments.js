import { getNextBetfairSeq } from '../timeline.js';
import { sanitizeBetfairPayloadForHistory } from '../payload.js';
import { createTimelineDocument } from './canonicalTimeline.js';

export function prepareBetfairPersistenceDocuments({
    eventId,
    processedResult,
    marketKey,
    commitId,
    canonicalTimeline,
    graphLoginStatusOnly,
    newTick,
    dependencies
}) {
    newTick.seq = getNextBetfairSeq(canonicalTimeline);
    newTick.commitId = commitId;

    const historyPreparation = dependencies.prepareBetfairHistory(
        eventId,
        sanitizeBetfairPayloadForHistory(processedResult),
        marketKey,
        { append: !graphLoginStatusOnly, commitId }
    );

    if (historyPreparation?.ok !== true ||
        !historyPreparation.document ||
        !historyPreparation.metadata) {
        return { ok: false };
    }

    const historyDocument = historyPreparation.document;
    const historyMetadata = historyPreparation.metadata;
    const timelineMetadata = {
        date: historyMetadata.date,
        tournament: historyMetadata.tournament,
        players: historyMetadata.players,
        sofaUrl: historyMetadata.sofaUrl || '',
        betfairUrl: marketKey || historyMetadata.betfairUrl || ''
    };
    const timelineDocument = createTimelineDocument(
        canonicalTimeline,
        eventId,
        newTick,
        timelineMetadata
    );
    const historyTarget = dependencies.resolveHistoryFile(
        eventId,
        historyMetadata
    );
    const timelineTarget = dependencies.getTimelineFile(
        'betfair',
        eventId,
        timelineMetadata
    );

    return {
        ok: true,
        historyDocument,
        historyMetadata,
        historyTarget,
        timelineDocument,
        timelineMetadata,
        timelineTarget
    };
}
