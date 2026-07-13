import assert from 'node:assert/strict';
import { buildMatchAnalysisResponse } from './analysisResponse.js';

const fixedNow = new Date('2026-06-24T12:00:00.000Z');

const missingUrlResult = await buildMatchAnalysisResponse(
    {},
    {
        extractEventId: () => 'unused',
        buildSofaAnalysis: async () => {
            throw new Error('must not run');
        },
        logDebug: () => {},
        logError: () => {},
        now: fixedNow
    }
);

assert.equal(missingUrlResult.httpStatus, 400);
assert.equal(missingUrlResult.body.error, 'URL mancante');

const invalidUrlResult = await buildMatchAnalysisResponse(
    { url: 'not-a-sofa-url' },
    {
        extractEventId: () => null,
        buildSofaAnalysis: async () => {
            throw new Error('must not run');
        },
        logDebug: () => {},
        logError: () => {},
        now: fixedNow
    }
);

assert.equal(invalidUrlResult.httpStatus, 400);
assert.equal(
    invalidUrlResult.body.error,
    'URL non valido o eventId non trovato'
);

const snapshot = {
    players: {
        home: { name: 'Player A' },
        away: { name: 'Player B' }
    }
};

const localContext = {
    version: 1,
    available: true,
    match: {
        pointShare: {
            homePoints: 38,
            awayPoints: 52
        }
    },
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

let savedHistory = null;

const successResult = await buildMatchAnalysisResponse(
    { url: 'https://www.sofascore.com/tennis/match/test/123' },
    {
        extractEventId: () => '123',
        buildSofaAnalysis: async () => ({
            eventData: {
                event: {
                    tournament: { name: 'Test Open' },
                    startTimestamp: new Date(
                        '2026-06-24T09:30:00.000Z'
                    ).getTime() / 1000
                }
            },
            snapshot,
            localContext
        }),
        addSofaUpdate: (
            eventId,
            receivedSnapshot,
            tournamentName,
            dateStr,
            timelineData
        ) => {
            savedHistory = {
                eventId,
                receivedSnapshot,
                tournamentName,
                dateStr,
                timelineData
            };
            return { ok: true, status: 'written' };
        },
        logDebug: () => {},
        logError: () => {},
        now: fixedNow
    }
);

assert.equal(successResult.httpStatus, 200);
assert.deepEqual(Object.keys(successResult.body).sort(), [
    'localContext',
    'snapshot'
]);

assert.equal(successResult.body.snapshot, snapshot);
assert.equal(successResult.body.localContext, localContext);
assert.equal(successResult.body.localContext.recent.available, true);
assert.deepEqual(
    successResult.body.localContext.recent.window.games,
    [
        { set: 2, game: 7 },
        { set: 2, game: 8 },
        { set: 2, game: 9 }
    ]
);

const omittedKeys = ['momen' + 'tum', 'strateg' + 'ies'];

assert.equal(
    omittedKeys.every(key => !(key in successResult.body)),
    true
);

assert.equal(savedHistory.eventId, '123');
assert.equal(savedHistory.receivedSnapshot, snapshot);
assert.equal(savedHistory.tournamentName, 'Test Open');
assert.equal(savedHistory.dateStr, '2026-06-24');

assert.deepEqual(savedHistory.timelineData, {
    snapshot,
    localContext
});

for (const writerResult of [
    { ok: false, status: 'failed', reason: 'write_failed' },
    undefined
]) {
    const debugLogs = [];
    const result = await buildMatchAnalysisResponse(
        { url: 'https://www.sofascore.com/tennis/match/test/123' },
        {
            extractEventId: () => '123',
            buildSofaAnalysis: async () => ({
                eventData: {
                    event: {
                        tournament: { name: 'Test Open' },
                        startTimestamp: new Date('2026-06-24T09:30:00.000Z').getTime() / 1000
                    }
                },
                snapshot,
                localContext
            }),
            addSofaUpdate: () => writerResult,
            logDebug: message => debugLogs.push(String(message)),
            logError: () => {},
            now: fixedNow
        }
    );

    assert.equal(result.httpStatus, 200);
    assert.deepEqual(Object.keys(result.body).sort(), ['localContext', 'snapshot']);
    assert.equal(result.body.snapshot, snapshot);
    assert.equal(result.body.localContext, localContext);
    assert.equal(
        debugLogs.some(message =>
            message.includes('Match History Save Failed') &&
            message.includes('eventId=123') &&
            message.includes('reason=write_failed')
        ),
        true
    );
}

const notFoundResult = await buildMatchAnalysisResponse(
    { url: 'https://www.sofascore.com/tennis/match/test/404' },
    {
        extractEventId: () => '404',
        buildSofaAnalysis: async () => {
            throw new Error('event not found 404');
        },
        logDebug: () => {},
        logError: () => {},
        now: fixedNow
    }
);

assert.equal(notFoundResult.httpStatus, 404);
assert.equal(notFoundResult.body.error, 'event not found 404');

console.log('analysisResponse local context: OK');
