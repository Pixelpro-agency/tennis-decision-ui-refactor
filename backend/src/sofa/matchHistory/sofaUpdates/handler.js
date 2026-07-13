import { createCanonicalCommitId } from '../commitId.js';
import {
    cloneJson,
    isPlainObject,
    hasSuccessfulResult,
    isValidTarget,
    isValidCommitId,
    isValidEventId,
    emptyDocuments,
    createCommitResult,
    unchangedResult,
    journalFailure,
    persistenceFailure,
    matchesJournalTarget
} from './commitResult.js';
import { repairSofaCommitFromJournal } from './recovery.js';

export function createSofaUpdateHandler({
    latestSofaState,
    latestBetfairState,
    loadHistory,
    loadHistoryResult,
    resolveHistoryFile,
    writeHistoryDocument,
    loadTimeline,
    getTimelineFile,
    writeTimelineDocument,
    journalStore,
    createCommitId = () => createCanonicalCommitId('sofa'),
    getNow = () => new Date()
}) {
    const equal = (a, b) => {
        if (typeof a !== typeof b) return false;
        if (typeof a === 'number' && typeof b === 'number') {
            return Number.isInteger(a) && Number.isInteger(b)
                ? a === b
                : Math.abs(a - b) < 0.1;
        }
        if (typeof a === 'string' && typeof b === 'string') {
            return a.trim().localeCompare(
                b.trim(),
                undefined,
                { numeric: true, sensitivity: 'base' }
            ) === 0;
        }
        return a === b || (a == null && b == null);
    };

    const getPersistedBetfairTotalMatched = (betfair, fromHistory = false) => {
        if (!isPlainObject(betfair)) return null;

        const value = fromHistory
            ? betfair.totalMatched
            : betfair.market_info?.total_matched;

        if (typeof value === 'number' && Number.isFinite(value)) return value;
        if (typeof value === 'string' && value.trim().length > 0) return value;
        return '0 €';
    };

    const normalizeBetfairForHistory = (betfair, fromHistory = false) => {
        if (!isPlainObject(betfair)) return null;

        const normalizeComparableTotalMatched = value => {
            if (typeof value === "string") return value;
            if (typeof value === "number" && Number.isFinite(value)) {
                return String(value);
            }
            return null;
        };

        const normalizeText = value =>
            typeof value === 'string' ? value : null;
        const normalizeNumber = value => {
            const number = Number(value);
            return Number.isFinite(number) ? number : 0;
        };
        const runners = Array.isArray(betfair.runners)
            ? betfair.runners
            : [];

        return {
            totalMatched: normalizeComparableTotalMatched(
                getPersistedBetfairTotalMatched(betfair, fromHistory)
            ),
            runners: runners.map(runner => ({
                name: normalizeText(runner?.name),
                wom: normalizeText(runner?.wom),
                moneyFlow: {
                    back: normalizeNumber(runner?.moneyFlow?.back),
                    lay: normalizeNumber(runner?.moneyFlow?.lay)
                }
            }))
        };
    };

    const betfairHistoryStatesDiffer = (
        latestBetfair,
        previousHistoryBetfair
    ) => {
        const currentComparable = normalizeBetfairForHistory(latestBetfair);
        const previousComparable = normalizeBetfairForHistory(
            previousHistoryBetfair,
            true
        );

        if (currentComparable === null || previousComparable === null) {
            return currentComparable !== previousComparable;
        }

        return JSON.stringify(currentComparable) !==
            JSON.stringify(previousComparable);
    };

    function buildSofaTimelineTick(
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

    function prepareTimelineDocument({
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

    function buildHistoryDocument(eventId, sofaData, tournamentName, date, now) {
        const readResult = loadHistoryResult(eventId);

        if (readResult.status === 'failed') {
            return { ok: false, reason: readResult.reason };
        }

        const historyObj = readResult.status === 'found'
            ? cloneJson(readResult.history)
            : {
                metadata: {
                    eventId,
                    date: date || now.toISOString().split('T')[0],
                    tournament: tournamentName || 'unknown_tournament',
                    players: {
                        home: sofaData?.players?.home?.name || 'Home',
                        away: sofaData?.players?.away?.name || 'Away'
                    },
                    sofaUrl: sofaData?.url || '',
                    betfairUrl: ''
                },
                history: []
            };

        historyObj.metadata = isPlainObject(historyObj.metadata)
            ? historyObj.metadata
            : {};
        historyObj.history = Array.isArray(historyObj.history)
            ? historyObj.history
            : [];

        if (tournamentName) historyObj.metadata.tournament = tournamentName;
        if (date) historyObj.metadata.date = date;
        historyObj.metadata.eventId = eventId;
        historyObj.metadata.players = {
            ...(isPlainObject(historyObj.metadata.players)
                ? historyObj.metadata.players
                : {}),
            home: sofaData?.players?.home?.name ||
                historyObj.metadata.players?.home ||
                'Home',
            away: sofaData?.players?.away?.name ||
                historyObj.metadata.players?.away ||
                'Away'
        };
        if (sofaData?.url) {
            historyObj.metadata.sofaUrl = sofaData.url;
        }

        return { ok: true, history: historyObj };
    }

    function appendHistoryRow(historyObj, sofaData, latestBetfair, now, commitId) {
        const runners = Array.isArray(latestBetfair?.runners)
            ? latestBetfair.runners
            : [];

        historyObj.history.push({
            timestamp: now.toISOString(),
            commitId,
            sofa: {
                score: sofaData?.score,
                serving: sofaData?.serving,
                stats: sofaData?.stats,
                status: sofaData?.status,
                surface: sofaData?.surface
            },
            betfair: latestBetfair ? {
                totalMatched: getPersistedBetfairTotalMatched(latestBetfair),
                runners: runners.map(runner => ({
                    name: runner.name,
                    wom: runner.wom,
                    backPrice: runner.back?.[0]?.price || null,
                    layPrice: runner.lay?.[0]?.price || null,
                    moneyFlow: runner.moneyFlow || { back: 0, lay: 0 }
                }))
            } : null
        });
    }

    function cleanupCompletedResidual(eventId, source) {
        if (!journalStore || typeof journalStore.findCompletedCommit !== 'function') {
            return null;
        }

        const residual = journalStore.findCompletedCommit({ eventId, source });
        if (!residual) {
            return null;
        }

        const cleanup = journalStore.removeCompletedCommit(residual.commitId);

        if (!hasSuccessfulResult(cleanup)) {
            return createCommitResult({
                eventId,
                commitId: residual.commitId,
                ok: false,
                status: 'failed',
                reason: 'journal_cleanup_failed',
                failedDocument: 'journal',
                documents: emptyDocuments()
            });
        }

        return null;
    }

    function resumePendingCommit(pending) {
        const { eventId, commitId } = pending;
        const documents = emptyDocuments();

        if (pending.status === 'recovery_failed') {
            return createCommitResult({
                eventId,
                commitId,
                ok: false,
                status: 'failed',
                reason: 'recovery_required',
                failedDocument: 'journal',
                documents
            });
        }

        return repairSofaCommitFromJournal(pending, {
            writeHistoryDocument,
            writeTimelineDocument,
            journalStore
        }, { successStatus: 'complete' });
    }

    function addSofaUpdate(eventId, sofaData, tournamentName, date, timelineData = null) {
        if (typeof eventId !== 'string' || eventId.trim().length === 0) {
            return persistenceFailure({
                eventId: null,
                commitId: null,
                documentName: 'history',
                status: 'failed'
            });
        }

        latestSofaState.set(eventId, sofaData);

        if (!journalStore ||
            typeof journalStore.findPendingCommit !== 'function' ||
            typeof journalStore.createPendingCommit !== 'function' ||
            typeof journalStore.markDocumentComplete !== 'function' ||
            typeof journalStore.removeCompletedCommit !== 'function' ||
            typeof writeHistoryDocument !== 'function' ||
            typeof writeTimelineDocument !== 'function' ||
            typeof resolveHistoryFile !== 'function' ||
            typeof getTimelineFile !== 'function') {
            return journalFailure({ eventId });
        }

        const pending = journalStore.findPendingCommit({
            eventId,
            source: 'sofa'
        });

        if (pending) {
            return resumePendingCommit(pending);
        }

        const residualFailure = cleanupCompletedResidual(eventId, 'sofa');
        if (residualFailure) {
            return residualFailure;
        }

        const now = getNow();
        const historyBuild = buildHistoryDocument(
            eventId,
            sofaData,
            tournamentName,
            date,
            now
        );

        if (!historyBuild.ok) {
            return persistenceFailure({
                eventId,
                commitId: null,
                documentName: 'history',
                status: 'failed'
            });
        }

        const historyObj = historyBuild.history;
        const latestBetfair = latestBetfairState.get(eventId) || null;
        const lastRow = historyObj.history[historyObj.history.length - 1];
        const shouldSkip =
            lastRow &&
            JSON.stringify(lastRow.sofa?.score) === JSON.stringify(sofaData?.score) &&
            equal(lastRow.sofa?.serving, sofaData?.serving) &&
            JSON.stringify(lastRow.sofa?.stats) === JSON.stringify(sofaData?.stats) &&
            JSON.stringify(lastRow.sofa?.status) === JSON.stringify(sofaData?.status) &&
            JSON.stringify(lastRow.sofa?.surface) === JSON.stringify(sofaData?.surface) &&
            !betfairHistoryStatesDiffer(latestBetfair, lastRow.betfair);

        if (shouldSkip) {
            return unchangedResult(eventId);
        }

        const commitId = createCommitId(eventId);

        if (typeof commitId !== 'string' || commitId.trim().length === 0) {
            return journalFailure({ eventId });
        }

        appendHistoryRow(historyObj, sofaData, latestBetfair, now, commitId);

        const timelineSnapshot = timelineData?.snapshot || sofaData;
        const localContext = timelineData?.localContext ?? null;
        const timelineMetadata = {
            eventId,
            date: date || historyObj.metadata.date,
            tournament: historyObj.metadata.tournament,
            players: historyObj.metadata.players,
            sofaUrl: sofaData?.url || historyObj.metadata.sofaUrl || ''
        };
        const existingTimeline = loadTimeline('sofa', eventId);
        const timelineObj = prepareTimelineDocument({
            eventId,
            snapshot: timelineSnapshot,
            localContext,
            existingTimeline,
            metadata: timelineMetadata,
            now,
            commitId
        });
        const historyTarget = resolveHistoryFile(eventId, historyObj.metadata);
        const timelineTarget = getTimelineFile('sofa', eventId, timelineMetadata);

        if (!isValidTarget(historyTarget) || !isValidTarget(timelineTarget)) {
            return journalFailure({ eventId, commitId });
        }

        const createResult = journalStore.createPendingCommit({
            commitId,
            eventId,
            source: 'sofa',
            documents: {
                history: {
                    target: historyTarget,
                    payload: {
                        document: historyObj,
                        metadata: historyObj.metadata
                    },
                    completed: false
                },
                timeline: {
                    target: timelineTarget,
                    payload: {
                        document: timelineObj,
                        metadata: timelineMetadata
                    },
                    completed: false
                }
            }
        });

        if (!hasSuccessfulResult(createResult)) {
            return journalFailure({
                eventId,
                commitId,
                reason: 'journal_write_failed'
            });
        }

        const created = typeof journalStore.getPendingCommit === 'function'
            ? journalStore.getPendingCommit(commitId)
            : null;

        if (!created) {
            return journalFailure({ eventId, commitId });
        }

        return resumePendingCommit(created);
    }

    return addSofaUpdate;
}
