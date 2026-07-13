import {
    cloneJson,
    isPlainObject
} from './commitResult.js';
import { getPersistedBetfairTotalMatched } from './changeDetection.js';

export function buildHistoryDocument({
    eventId,
    sofaData,
    tournamentName,
    date,
    now,
    loadHistoryResult
}) {
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

export function appendHistoryRow(historyObj, sofaData, latestBetfair, now, commitId) {
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
