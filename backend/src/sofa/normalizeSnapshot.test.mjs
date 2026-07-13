import assert from 'node:assert/strict';
import { normalizeSnapshot } from './normalizeSnapshot.js';
import {
    verifiedPointByPointFixture
} from './fixtures/pointByPoint.verified.fixture.mjs';

function createRawData(pbp = verifiedPointByPointFixture) {
    return {
        event: {
            id: 12345678,
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
        },
        statistics: [
            {
                period: 'ALL',
                groups: [
                    {
                        groupName: 'Serve',
                        statisticsItems: [
                            { name: 'Aces', home: 3, away: 2 },
                            {
                                key: 'pointsTotal',
                                name: 'Total points',
                                home: '38',
                                away: '52',
                                homeValue: 38,
                                awayValue: 52,
                                homeTotal: 38,
                                awayTotal: 52
                            }
                        ]
                    }
                ]
            }
        ],
        pbp
    };
}

{
    const snapshot = normalizeSnapshot(createRawData());

    assert.deepEqual(Object.keys(snapshot).sort(), [
        'eventId',
        'fetchedAt',
        'players',
        'pointByPoint',
        'score',
        'serving',
        'stats',
        'status',
        'surface'
    ]);

    assert.equal(snapshot.eventId, 12345678);
    assert.equal(snapshot.players.home.name, 'Home Player');
    assert.equal(snapshot.players.away.name, 'Away Player');
    assert.equal(snapshot.serving, 'home');
    assert.deepEqual(snapshot.score.sets, [{ home: 6, away: 4 }]);
    assert.equal(snapshot.score.point, '15-30');

    assert.deepEqual(snapshot.stats.match[1], {
        period: 'ALL',
        key: 'pointsTotal',
        label: 'Total points',
        home: '38',
        away: '52',
        homeValue: 38,
        awayValue: 52,
        homeTotal: 38,
        awayTotal: 52,
        group: 'Serve'
    });

    assert.equal(snapshot.pointByPoint.available, true);
    assert.deepEqual(snapshot.pointByPoint.semantics, {
        source: 'home-away-point-transitions',
        representation: 'after-point'
    });
    assert.deepEqual(
        snapshot.pointByPoint.sets,
        verifiedPointByPointFixture
    );
}

{
    const snapshot = normalizeSnapshot(createRawData({}));

    assert.deepEqual(snapshot.pointByPoint, {
        available: false,
        reason: 'point_by_point_unavailable',
        semantics: null,
        sets: []
    });
    assert.equal(snapshot.serving, 'home');
    assert.equal(snapshot.score.point, '15-30');
    assert.equal(snapshot.stats.match[1].key, 'pointsTotal');
}

console.log('normalizeSnapshot: OK');
