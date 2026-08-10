import {
    getBetfairCommitDependencies,
    prepareBetfairHistory
} from '../../matchHistory.js';
import { loadTimeline, loadTimelineResult } from '../../timelineStore.js';
import { createCanonicalCommitId } from '../../matchHistory/commitId.js';

export function getBetfairPersistenceDependencies(options) {
    const wired = getBetfairCommitDependencies();

    return {
        prepareBetfairHistory:
            options.prepareBetfairHistory || prepareBetfairHistory,
        resolveHistoryFile:
            options.resolveHistoryFile || wired.resolveHistoryFile,
        writeHistoryDocument:
            options.writeHistoryDocument || wired.writeHistoryDocument,
        getTimelineFile:
            options.getTimelineFile || wired.getTimelineFile,
        writeTimelineDocument:
            options.writeTimelineDocument || wired.writeTimelineDocument,
        journalStore:
            options.journalStore || wired.journalStore,
        loadTimeline:
            options.loadTimeline || loadTimeline,
        loadTimelineResult: options.loadTimelineResult || (
            options.loadTimeline
                ? ((source, eventId) => {
                    const timeline = options.loadTimeline(source, eventId);
                    return {
                        ok: true,
                        status: timeline ? 'found' : 'missing',
                        timeline,
                        reason: null
                    };
                })
                : loadTimelineResult
        ),
        commitBetfairState:
            options.commitBetfairState || wired.commitBetfairState,
        createCommitId:
            options.createCommitId || (() => createCanonicalCommitId('betfair'))
    };
}
