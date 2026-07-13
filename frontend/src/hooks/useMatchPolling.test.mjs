import assert from 'node:assert/strict';
import {
    classifySofaTimelineHttpStatus,
    normalizeSofaTimelinePayload
} from './useMatchPolling.js';

assert.deepEqual(
    classifySofaTimelineHttpStatus(404),
    {
        serverStatus: 'waiting',
        expected: true
    }
);

assert.deepEqual(
    classifySofaTimelineHttpStatus(500),
    {
        serverStatus: 'error',
        expected: false
    }
);

assert.deepEqual(
    classifySofaTimelineHttpStatus(400),
    {
        serverStatus: 'error',
        expected: false
    }
);

assert.deepEqual(
    classifySofaTimelineHttpStatus(409, {
        persistenceIntegrity: true,
        integrity: { status: 'partial_persistence' }
    }),
    {
        serverStatus: 'partial_persistence',
        expected: true
    }
);

assert.deepEqual(
    classifySofaTimelineHttpStatus(409, {
        persistenceIntegrity: true,
        integrity: { status: 'recovery_failed' }
    }),
    {
        serverStatus: 'recovery_failed',
        expected: true
    }
);

assert.deepEqual(
    classifySofaTimelineHttpStatus(409),
    {
        serverStatus: 'error',
        expected: false
    }
);

assert.deepEqual(
    normalizeSofaTimelinePayload({
        timeline: [{ data: { snapshot: 'sofa-snapshot' } }],
        integrity: { status: 'partial_persistence', source: 'sofa' }
    }),
    {
        snapshot: 'sofa-snapshot',
        localContext: null,
        timeline: { data: { snapshot: 'sofa-snapshot' } },
        integrity: { status: 'partial_persistence', source: 'sofa' }
    }
);

assert.deepEqual(
    normalizeSofaTimelinePayload({
        timeline: [{ data: { snapshot: 'sofa-snapshot' } }]
    }).integrity,
    null
);

console.log('useMatchPolling tests passed');
