import assert from 'node:assert/strict';
import { canCompleteDashboardBootstrap } from './useDashboardBootstrapState.js';

const base = {
    backendData: { snapshot: true },
    sessionActive: true,
    trackingSessionId: 'session-new',
    bootstrapSessionId: 'session-new',
    sawDashboardReset: true
};

assert.equal(canCompleteDashboardBootstrap(base), true);
assert.equal(canCompleteDashboardBootstrap({ ...base, bootstrapSessionId: 'session-old' }), false);
assert.equal(canCompleteDashboardBootstrap({ ...base, sawDashboardReset: false }), false);
assert.equal(canCompleteDashboardBootstrap({ ...base, sessionActive: false }), false);
assert.equal(canCompleteDashboardBootstrap({ ...base, backendData: null }), false);

console.log('useDashboardBootstrapState session isolation tests passed');
