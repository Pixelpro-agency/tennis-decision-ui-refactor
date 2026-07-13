import assert from 'node:assert/strict';
import { buildSofaAnalysis } from './buildSofaAnalysis.js';

const eventId = '12345678';
const endpoints = {
    event: `/api/v1/event/${eventId}`,
    statistics: `/api/v1/event/${eventId}/statistics`,
    pbp: `/api/v1/event/${eventId}/point-by-point`
};

const eventData = {
    event: {
        id: Number(eventId),
        homeTeam: { name: 'Home Player' },
        awayTeam: { name: 'Away Player' }
    }
};

const statistics = { periods: [] };
const pointByPoint = { points: [] };
const dataMap = {
    [endpoints.event]: eventData,
    [endpoints.statistics]: { statistics },
    [endpoints.pbp]: { pointByPoint }
};

const snapshot = { players: { home: { name: 'Home Player' } } };
const localContext = { version: 1, available: true };

let normalizedInput = null;
let contextInput = null;

const result = await buildSofaAnalysis(eventId, {
    loadSofaPayloadFn: async receivedEventId => {
        assert.equal(receivedEventId, eventId);
        return { endpoints, dataMap };
    },
    normalizeSnapshotFn: input => {
        normalizedInput = input;
        return snapshot;
    },
    buildLocalContextFn: receivedSnapshot => {
        contextInput = receivedSnapshot;
        return localContext;
    }
});

assert.deepEqual(Object.keys(result).sort(), [
    'dataMap',
    'endpoints',
    'eventData',
    'eventId',
    'localContext',
    'snapshot'
]);

assert.equal(result.snapshot, snapshot);
assert.equal(result.localContext, localContext);
assert.equal(contextInput, snapshot);

const omittedKeys = ['momen' + 'tum', 'strateg' + 'ies'];

assert.equal(
    omittedKeys.every(key => !(key in result)),
    true
);

assert.deepEqual(normalizedInput, {
    event: eventData.event,
    statistics,
    pbp: pointByPoint
});

await assert.rejects(
    () => buildSofaAnalysis(eventId, {
        loadSofaPayloadFn: async () => ({
            endpoints,
            dataMap: {
                [endpoints.event]: {
                    error: { message: 'Event unavailable' }
                }
            }
        }),
        normalizeSnapshotFn: () => {
            throw new Error('must not normalize an invalid event');
        },
        buildLocalContextFn: () => {
            throw new Error('must not build local context for an invalid event');
        }
    }),
    /Event unavailable/
);

console.log('buildSofaAnalysis local context: OK');

{
    const {
        verifiedHomeLeadingPointByPointFixture
    } = await import('./fixtures/pointByPoint.verified.fixture.mjs');

    const integrationEvent = {
        id: Number(eventId),
        homeTeam: { name: 'Home Player' },
        awayTeam: { name: 'Away Player' },
        status: {
            type: 'inprogress',
            description: 'In progress'
        },
        groundType: 'Clay',
        homeScore: {
            display: 1,
            period1: 6,
            point: 15,
            serving: true
        },
        awayScore: {
            display: 0,
            period1: 4,
            point: 30
        }
    };

    const integrationResult = await buildSofaAnalysis(eventId, {
        loadSofaPayloadFn: async () => ({
            endpoints,
            dataMap: {
                [endpoints.event]: { event: integrationEvent },
                [endpoints.statistics]: {
                    statistics: [
                        {
                            period: 'ALL',
                            groups: [
                                {
                                    groupName: 'Points',
                                    statisticsItems: [
                                        {
                                            key: 'pointsTotal',
                                            name: 'Total points',
                                            homeValue: 38,
                                            awayValue: 52
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                },
                [endpoints.pbp]: {
                    pointByPoint: verifiedHomeLeadingPointByPointFixture
                }
            }
        })
    });

    assert.equal(integrationResult.snapshot.pointByPoint.available, true);
    assert.equal(integrationResult.localContext.recent.available, true);
    assert.deepEqual(integrationResult.localContext.recent.window.games, [
        { set: 3, game: 6 },
        { set: 3, game: 7 },
        { set: 3, game: 8 }
    ]);
    assert.equal(
        integrationResult.localContext.comparison.observedShift,
        true
    );
    assert.deepEqual(integrationResult.localContext.dataQuality, {
        level: 'complete',
        sources: {
            statistics: true,
            pointByPoint: true
        },
        reasons: []
    });
}
