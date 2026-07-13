import assert from 'node:assert/strict';
import {
    MANUAL_CONFIRMATION_APPLIED_REASON,
    getIdentityStateKey,
    getSourceIdentityConfirmationState
} from './sourceIdentityConfirmationState.js';

const completePendingIdentity = {
    status: 'pending',
    sofaPlayers: ['Player One', 'Player Two'],
    betfairRunners: ['Runner One', 'Runner Two'],
    reasons: []
};

const confirmableState = getSourceIdentityConfirmationState(
    '12345',
    completePendingIdentity
);

assert.deepEqual(confirmableState.sofaPlayers, ['Player One', 'Player Two']);
assert.deepEqual(confirmableState.betfairRunners, ['Runner One', 'Runner Two']);
assert.equal(confirmableState.canConfirmIdentity, true);
assert.equal(confirmableState.pendingIdentityIncomplete, false);
assert.equal(confirmableState.manualConfirmationApplied, false);
assert.equal(
    confirmableState.identityStateKey,
    '12345\u001fpending\u001fPlayer One\u001fPlayer Two\u001fRunner One\u001fRunner Two'
);

const incompletePendingState = getSourceIdentityConfirmationState('12345', {
    status: 'pending',
    sofaPlayers: ['Player One', 'Player Two'],
    betfairRunners: null,
    reasons: null
});

assert.deepEqual(incompletePendingState.sofaPlayers, ['Player One', 'Player Two']);
assert.deepEqual(incompletePendingState.betfairRunners, []);
assert.equal(incompletePendingState.canConfirmIdentity, false);
assert.equal(incompletePendingState.pendingIdentityIncomplete, true);
assert.equal(incompletePendingState.manualConfirmationApplied, false);

const manuallyConfirmedState = getSourceIdentityConfirmationState('12345', {
    status: 'confirmed',
    sofaPlayers: ['Player One', 'Player Two'],
    betfairRunners: ['Runner One', 'Runner Two'],
    reasons: [MANUAL_CONFIRMATION_APPLIED_REASON]
});

assert.equal(manuallyConfirmedState.canConfirmIdentity, false);
assert.equal(manuallyConfirmedState.pendingIdentityIncomplete, false);
assert.equal(manuallyConfirmedState.manualConfirmationApplied, true);

const mismatchState = getSourceIdentityConfirmationState('12345', {
    status: 'mismatch',
    sofaPlayers: ['Player One', 'Player Two'],
    betfairRunners: ['Runner One', 'Runner Two'],
    reasons: [MANUAL_CONFIRMATION_APPLIED_REASON]
});

assert.equal(mismatchState.manualConfirmationApplied, false);

const missingIdentityState = getSourceIdentityConfirmationState('12345', null);

assert.deepEqual(missingIdentityState.sofaPlayers, []);
assert.deepEqual(missingIdentityState.betfairRunners, []);
assert.equal(missingIdentityState.canConfirmIdentity, false);
assert.equal(missingIdentityState.pendingIdentityIncomplete, false);
assert.equal(missingIdentityState.manualConfirmationApplied, false);
assert.equal(missingIdentityState.identityStateKey, '12345');

assert.equal(
    getIdentityStateKey('12345', completePendingIdentity),
    confirmableState.identityStateKey
);

console.log('sourceIdentityConfirmationState tests passed');