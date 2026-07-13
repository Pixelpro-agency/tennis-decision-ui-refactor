import assert from 'node:assert/strict';
import { getSourceIdentityControlMode } from './sourceIdentityControlMode.js';

assert.equal(
    getSourceIdentityControlMode({
        sourceIdentityStatus: 'mismatch',
        manualConfirmationApplied: true,
        pendingIdentityIncomplete: true,
        canConfirmIdentity: true
    }),
    'hidden'
);

assert.equal(
    getSourceIdentityControlMode({
        sourceIdentityStatus: 'pending',
        manualConfirmationApplied: true,
        pendingIdentityIncomplete: true,
        canConfirmIdentity: true
    }),
    'manual-confirmed'
);

assert.equal(
    getSourceIdentityControlMode({
        sourceIdentityStatus: 'pending',
        manualConfirmationApplied: false,
        pendingIdentityIncomplete: true,
        canConfirmIdentity: true
    }),
    'pending-incomplete'
);

assert.equal(
    getSourceIdentityControlMode({
        sourceIdentityStatus: 'pending',
        manualConfirmationApplied: false,
        pendingIdentityIncomplete: false,
        canConfirmIdentity: true
    }),
    'confirm-available'
);

assert.equal(
    getSourceIdentityControlMode({
        sourceIdentityStatus: 'confirmed',
        manualConfirmationApplied: false,
        pendingIdentityIncomplete: false,
        canConfirmIdentity: false
    }),
    'hidden'
);

assert.equal(
    getSourceIdentityControlMode(),
    'hidden'
);

console.log('sourceIdentityControlMode tests passed');