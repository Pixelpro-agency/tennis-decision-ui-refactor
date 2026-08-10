import assert from 'node:assert/strict';
import { buildHealthResponse, buildPublicPythonProcessSnapshot } from './healthResponse.js';

const snapshot = buildPublicPythonProcessSnapshot({
    active: 99,
    ownerToken: 'secret',
    entries: [
        {
            executionId: 'exec-1', role: 'sofa_tracking', pid: null,
            status: 'spawn_pending', startedAt: '2026-08-01T00:00:00.000Z',
            ownerToken: 'secret', cdpUrl: 'http://secret', args: ['secret']
        },
        {
            executionId: 'exec-2', role: 'betfair_tracking', pid: 42,
            status: 'force_stopping', startedAt: '2026-08-01T00:00:01.000Z',
            profileDir: 'C:/secret'
        },
        { executionId: 'bad', role: 'private_role', pid: 10, status: 'running' }
    ]
});

assert.equal(snapshot.active, 2);
assert.equal(snapshot.stopping, 1);
assert.equal(snapshot.byRole.sofa_tracking, 1);
assert.equal(snapshot.byRole.betfair_tracking, 1);
assert.equal(snapshot.byRole.betfair_login, 0);
assert.equal(snapshot.entries[0].pid, null);
for (const privateField of ['ownerToken', 'cdpUrl', 'args', 'profileDir', 'private_role']) {
    assert.equal(JSON.stringify(snapshot).includes(privateField), false, privateField);
}

const response = buildHealthResponse({
    instanceId: 'instance', pid: 123, startedAt: 'start', timestamp: 'now', pythonSnapshot: null
});
assert.equal(response.ok, true);
assert.equal(response.project, 'tennis-decision-ui');
assert.equal(response.pythonProcesses.active, 0);

console.log('HEALTH_RESPONSE_ASSERTIONS_OK');

