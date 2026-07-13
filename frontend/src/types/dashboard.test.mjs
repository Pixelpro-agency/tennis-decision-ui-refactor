import assert from 'node:assert/strict';
import { mapBackendDataToDashboard } from './dashboard.js';

const localContext = {
    version: 1,
    match: {
        pointShare: {
            available: true,
            homePoints: 38,
            awayPoints: 52,
            homePct: 42.2,
            awayPct: 57.8
        }
    }
};

const backendData = {
    snapshot: {
        players: {
            home: { name: 'Home Player' },
            away: { name: 'Away Player' }
        },
        score: {
            sets: [{ home: 6, away: 4 }],
            service: 'home',
            games: { home: 2, away: 1 },
            point: '15-30'
        },
        stats: {
            match: [
                { label: 'Aces', home: 2, away: 1 }
            ]
        }
    },
    localContext
};

const dashboard = mapBackendDataToDashboard(
    backendData,
    {
        serverStatus: 'ok',
        isPolling: true,
        lastUpdate: '2026-06-29T10:00:00.000Z'
    }
);

assert.ok(dashboard);
assert.equal(dashboard.localContext, localContext);
assert.equal(dashboard.players, backendData.snapshot.players);
assert.deepEqual(dashboard.mainGrid.leftCard, {
    id: 'matchContext',
    title: 'Contesto punti'
});
assert.equal(dashboard.matchOverviewBar.playersInline.homeName, 'Home Player');
assert.equal(dashboard.mainGrid.rightCard.rows.total.length, 1);
assert.equal(dashboard.mainGrid.rightCard.rows.total[0].label, 'ACES');
assert.equal(('momen' + 'tum') in dashboard, false);
assert.equal(('strateg' + 'ies') in dashboard, false);
assert.equal(dashboard.mainGrid.leftCard.homePct, undefined);
assert.equal(dashboard.mainGrid.leftCard.awayPct, undefined);

const dashboardWithoutContext = mapBackendDataToDashboard(
    { snapshot: backendData.snapshot },
    {}
);

assert.equal(dashboardWithoutContext.localContext, null);

console.log('dashboard local context mapping: OK');
