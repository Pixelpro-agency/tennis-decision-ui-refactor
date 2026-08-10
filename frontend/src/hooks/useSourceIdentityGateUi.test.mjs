import assert from 'node:assert/strict';
import { isRecordingAlignedForSession } from './useSourceIdentityGateUi.js';

const aligned = {
    phase: 'recording',
    trackingSessionId: 'session-new',
    sourceIdentity: { status: 'aligned' }
};

assert.equal(isRecordingAlignedForSession(aligned, 'session-new'), true);
assert.equal(isRecordingAlignedForSession(aligned, 'session-old'), false);
assert.equal(isRecordingAlignedForSession({ ...aligned, phase: 'pending_confirmation' }, 'session-new'), false);
assert.equal(isRecordingAlignedForSession({ ...aligned, sourceIdentity: { status: 'pending' } }, 'session-new'), false);

console.log('useSourceIdentityGateUi confirmation verification tests passed');
