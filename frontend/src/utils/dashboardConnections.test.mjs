import assert from 'node:assert/strict';
import { buildDashboardConnections } from './dashboardConnections.js';

const toggleAudioAlert = () => {};

const connected = buildDashboardConnections({
    backendData: { snapshot: {} },
    sofaLastUpdate: '2026-06-24T20:00:00.000Z',
    sofaServerStatus: 'waiting',
    betfairData: { health: { status: 'green' } },
    betfairLastUpdate: '2026-06-24T20:00:05.000Z',
    betfairHealth: { status: 'green' },
    betfairHealthTransition: { from: 'yellow', to: 'green' },
    betfairAudioAlertEnabled: true,
    onToggleBetfairAudioAlert: toggleAudioAlert
});

assert.deepEqual(connected.sofa, {
    status: 'connected',
    ok: true,
    lastUpdate: '2026-06-24T20:00:00.000Z'
});

assert.deepEqual(connected.modelTot, {
    ok: false
});

assert.equal(connected.betfair.ok, true);
assert.equal(connected.betfair.lastUpdate, '2026-06-24T20:00:05.000Z');
assert.deepEqual(connected.betfair.health, {
    status: 'green'
});
assert.deepEqual(connected.betfair.transition, {
    from: 'yellow',
    to: 'green'
});
assert.equal(connected.betfair.audioAlertEnabled, true);
assert.equal(connected.betfair.onToggleAudioAlert, toggleAudioAlert);

const serverWaiting = buildDashboardConnections({
    sofaServerStatus: 'waiting'
});

assert.deepEqual(serverWaiting.sofa, {
    status: 'waiting',
    ok: false,
    lastUpdate: undefined
});

const collectingGateWaiting = buildDashboardConnections({
    sourceIdentityGateStatus: {
        phase: 'collecting',
        persistence: 'buffering'
    }
});

assert.deepEqual(collectingGateWaiting.sofa, {
    status: 'waiting',
    ok: false,
    lastUpdate: undefined
});

const pendingGateWaiting = buildDashboardConnections({
    sourceIdentityGateStatus: {
        phase: 'pending',
        persistence: 'buffering'
    }
});

assert.deepEqual(pendingGateWaiting.sofa, {
    status: 'waiting',
    ok: false,
    lastUpdate: undefined
});

const disconnected = buildDashboardConnections({
    sourceIdentityGateStatus: {
        phase: 'recording',
        persistence: 'canonical'
    }
});

assert.deepEqual(disconnected.sofa, {
    status: 'disconnected',
    ok: false,
    lastUpdate: undefined
});

const emptyConnections = buildDashboardConnections();

assert.deepEqual(emptyConnections.sofa, {
    status: 'disconnected',
    ok: false,
    lastUpdate: undefined
});
assert.equal(emptyConnections.betfair.ok, false);
assert.equal(emptyConnections.modelTot.ok, false);

console.log('dashboardConnections tests passed');
