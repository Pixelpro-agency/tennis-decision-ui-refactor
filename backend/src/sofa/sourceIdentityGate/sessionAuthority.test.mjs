import assert from 'node:assert/strict';
import {
    clearAllSourceIdentityGates,
    confirmActiveSourceIdentityGate,
    observeBetfairSourceIdentitySample,
    observeSofaSourceIdentitySample,
    startSourceIdentityGate
} from '../sourceIdentityGate.js';

const sofaSample = {
    snapshot: { event: { homeTeam: { name: 'A' }, awayTeam: { name: 'B' } } }
};

try {
    startSourceIdentityGate('same-event', {
        hasBetfairUrl: true,
        trackingSessionId: 'session-new'
    });

    assert.deepEqual(
        observeSofaSourceIdentitySample('same-event', sofaSample, null, {
            trackingSessionId: 'session-old',
            hasBetfairUrl: true
        }),
        {
            ok: false,
            phaseBefore: null,
            phase: null,
            action: 'blocked',
            reason: 'stale_tracking_session'
        }
    );

    assert.equal(
        observeBetfairSourceIdentitySample('same-event', {}, 'key', {
            trackingSessionId: 'session-old'
        }).reason,
        'stale_tracking_session'
    );

    assert.equal(
        confirmActiveSourceIdentityGate('same-event', {
            trackingSessionId: 'session-old',
            selectedPairs: [],
            confirmationText: 'OK'
        }).code,
        'stale_session'
    );

    clearAllSourceIdentityGates();
    assert.equal(
        observeSofaSourceIdentitySample('missing', sofaSample, null, {
            trackingSessionId: 'session-x',
            hasBetfairUrl: true
        }).reason,
        'gate_unavailable'
    );
    assert.equal(
        observeBetfairSourceIdentitySample('missing', {}, 'key', {
            trackingSessionId: 'session-x'
        }).action,
        'blocked'
    );
    assert.equal(
        observeSofaSourceIdentitySample('sofa-only', sofaSample, null, {
            hasBetfairUrl: false
        }).action,
        'persist-current'
    );

    console.log('sourceIdentityGate/sessionAuthority.test: OK');
} finally {
    clearAllSourceIdentityGates();
}
