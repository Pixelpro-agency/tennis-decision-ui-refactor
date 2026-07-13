import assert from 'node:assert/strict';

export const fakePayload = {
    endpoints: {
        event: 'evt',
        statistics: 'stats',
        pbp: 'pbp'
    },
    dataMap: {
        evt: {
            event: {
                tournament: { name: 'Fake Open' },
                startTimestamp: 1719446400
            }
        },
        stats: { statistics: {} },
        pbp: { pointByPoint: [] }
    }
};

export const snapshot = {
    players: {
        home: { name: 'Home' },
        away: { name: 'Away' }
    }
};

export const localContext = {
    version: 1,
    available: true,
    recent: {
        available: true,
        reason: null,
        window: {
            kind: "completed-games",
            requestedGames: 3,
            includedGames: 3,
            excludedCurrentGame: true,
            games: [
                { set: 2, game: 7 },
                { set: 2, game: 8 },
                { set: 2, game: 9 }
            ]
        },
        pointShare: {
            available: true,
            homePoints: 5,
            awayPoints: 10,
            totalPoints: 15,
            homePct: 33.3,
            awayPct: 66.7,
            leadingSide: "away"
        }
    }
};

export function completeSofaSuccessEnvelope(eventId, commitId = null) {
    return {
        ok: true,
        operation: 'sofa_commit',
        source: 'sofa',
        eventId,
        commitId,
        status: 'complete',
        reason: null,
        failedDocument: null,
        documents: {
            history: { ok: true, status: 'written', file: `/history/${eventId}.json`, reason: null },
            timeline: { ok: true, status: 'written', file: `/timeline/sofa_${eventId}.json`, reason: null }
        },
        warnings: []
    };
}

export function createDependencies(overrides = {}) {
    return {
        loadSofaPayload: async () => fakePayload,
        normalizeSnapshot: () => snapshot,
        buildLocalContext: receivedSnapshot => {
            assert.equal(receivedSnapshot, snapshot);
            return localContext;
        },
        observeSofaSourceIdentitySample: () => ({ action: 'no-gate' }),
        persistSofaTrackingSample: () => completeSofaSuccessEnvelope('event-test'),
        ...overrides
    };
}
