import assert from 'node:assert/strict';
import { buildPersistenceViewState } from './persistenceViewState.js';

assert.equal(buildPersistenceViewState().status, 'inactive');
assert.equal(buildPersistenceViewState({ sessionActive: true }).status, 'waiting');
assert.equal(buildPersistenceViewState({ sessionActive: true, dashboardReady: true }).status, 'current');
assert.equal(buildPersistenceViewState({
    sessionActive: true,
    dashboardReady: true,
    sofaIntegrity: { status: 'partial_persistence' }
}).status, 'degraded');
assert.equal(buildPersistenceViewState({ sessionActive: true, sofaError: 'failed' }).status, 'error');
assert.equal(buildPersistenceViewState({ sessionActive: true, evidenceError: 'failed' }).status, 'error');
assert.equal(buildPersistenceViewState({
    sessionActive: true,
    dashboardReady: true,
    evidencePersistenceComplete: false
}).status, 'degraded');

console.log('persistenceViewState tests passed');
