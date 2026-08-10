import assert from 'node:assert/strict';
import { readTrackingSessionAuthority } from './useLiveTrackingActions.js';

assert.equal(readTrackingSessionAuthority({ trackingSessionId: ' tracking-42 ' }), 'tracking-42');
assert.equal(readTrackingSessionAuthority({ trackingSessionId: '' }), null);
assert.equal(readTrackingSessionAuthority({ ok: true }), null);

console.log('useLiveTrackingActions session authority tests passed');
