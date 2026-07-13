import {
    getBetfairCommitDependencies,
    prepareBetfairHistory
} from '../../matchHistory.js';
import { loadTimeline } from '../../timelineStore.js';
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
        createCommitId:
            options.createCommitId || (() => createCanonicalCommitId('betfair'))
    };
}
