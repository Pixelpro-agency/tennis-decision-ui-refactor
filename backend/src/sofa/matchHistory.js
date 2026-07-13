import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
    loadTimeline,
    getTimelineFile,
    writeTimelineDocument
} from './timelineStore.js';
import { createSofaUpdateHandler } from './matchHistory/sofaUpdates.js';
import { createBetfairUpdateHandler } from './matchHistory/betfairUpdates.js';
import { createHistoryStorage } from './matchHistory/storage.js';
import { createCommitJournalStore } from './matchHistory/commitJournal.js';
import { createCanonicalCommitId } from './matchHistory/commitId.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const HISTORY_DIR = path.join(__dirname, '../../match_history');

const historyStorage = createHistoryStorage({
    fs,
    path,
    historyDir: HISTORY_DIR
});

const {
    getHistoryFile: getHistoryFileWithStorage,
    resolveHistoryFile: resolveHistoryFileWithStorage,
    loadHistory: loadHistoryWithStorage,
    loadHistoryResult: loadHistoryResultWithStorage,
    saveHistory: saveHistoryWithStorage,
    writeHistoryDocument: writeHistoryDocumentWithStorage
} = historyStorage;

export function getHistoryFile(eventId) {
    return getHistoryFileWithStorage(eventId);
}

export function loadHistory(eventId) {
    return loadHistoryWithStorage(eventId);
}

export function loadHistoryResult(eventId) {
    return loadHistoryResultWithStorage(eventId);
}

export function saveHistory(eventId, historyData, metadata = {}, commitId = null) {
    return saveHistoryWithStorage(eventId, historyData, metadata, commitId);
}

const latestSofaState = new Map();
const latestBetfairState = new Map();

const journalStore = createCommitJournalStore({
    fs,
    path,
    journalDir: path.join(HISTORY_DIR, '.pending_commits')
});

const addSofaUpdateWithState = createSofaUpdateHandler({
    latestSofaState,
    latestBetfairState,
    loadHistory,
    loadHistoryResult,
    resolveHistoryFile: resolveHistoryFileWithStorage,
    writeHistoryDocument: writeHistoryDocumentWithStorage,
    loadTimeline,
    getTimelineFile,
    writeTimelineDocument,
    journalStore,
    createCommitId: () => createCanonicalCommitId('sofa')
});

export function addSofaUpdate(eventId, sofaData, tournamentName, date, timelineData = null) {
    return addSofaUpdateWithState(eventId, sofaData, tournamentName, date, timelineData);
}

const prepareBetfairHistoryWithState = createBetfairUpdateHandler({
    latestSofaState,
    latestBetfairState,
    loadHistory,
    loadHistoryResult
});

export function prepareBetfairHistory(
    eventId,
    betfairData,
    marketUrl = '',
    options = {}
) {
    return prepareBetfairHistoryWithState(
        eventId,
        betfairData,
        marketUrl,
        options
    );
}

// Compatibility façade: it now prepares a document only. The processor owns
// the sole journalized canonical write of history plus Betfair timeline.
export function addBetfairUpdate(eventId, betfairData, marketUrl = '') {
    return prepareBetfairHistory(eventId, betfairData, marketUrl);
}

export function getBetfairCommitDependencies() {
    return {
        resolveHistoryFile: resolveHistoryFileWithStorage,
        writeHistoryDocument: writeHistoryDocumentWithStorage,
        getTimelineFile,
        writeTimelineDocument,
        journalStore
    };
}

export function getCommitRecoveryDependencies() {
    return {
        journalStore,
        writeHistoryDocument: writeHistoryDocumentWithStorage,
        writeTimelineDocument,
        logError: (message) => {
            try {
                console.error(`[Recovery] ${message}`);
            } catch (_) {
            }
        }
    };
}

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

export function getMatchPersistenceIntegrity(eventId, source = 'sofa') {
    const canonicalSource = source === 'sofa' || source === 'betfair'
        ? source
        : null;

    if (!journalStore ||
        typeof journalStore.getPersistenceIntegrityStatus !== 'function') {
        return {
            status: 'no_known_partial',
            reason: null,
            source: canonicalSource,
            commitId: null,
            affectedDocuments: []
        };
    }

    const raw = journalStore.getPersistenceIntegrityStatus(eventId, source);

    if (!raw || typeof raw !== 'object') {
        return {
            status: 'no_known_partial',
            reason: null,
            source: canonicalSource,
            commitId: null,
            affectedDocuments: []
        };
    }

    return {
        status: VALID_INTEGRITY_STATUSES.has(raw.status)
            ? raw.status
            : 'no_known_partial',
        reason: typeof raw.reason === 'string' ? raw.reason : null,
        source: raw.source === 'sofa' || raw.source === 'betfair'
            ? raw.source
            : null,
        commitId: typeof raw.commitId === 'string' ? raw.commitId : null,
        affectedDocuments: normalizeAffectedDocuments(raw.affectedDocuments)
    };
}
