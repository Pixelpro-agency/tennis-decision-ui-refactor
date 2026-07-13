import assert from 'node:assert/strict';
import { buildSourceIdentityStatusResponse } from './sourceIdentityStatusResponse.js';
import { startSourceIdentityGate, clearAllSourceIdentityGates, observeSofaSourceIdentitySample, observeBetfairSourceIdentitySample } from '../../sofa/sourceIdentityGate.js';

let passed = 0;
let failed = 0;

function runTest(name, callback) {
    try {
        callback();
        console.log(`PASS ${name}`);
        passed++;
    } catch (error) {
        console.error(`FAIL ${name}`);
        console.error(error);
        failed++;
        process.exitCode = 1;
    }
}

function createFakeConfirmationDependencies() {
    return {
        findApplicableSourceIdentityConfirmation() {
            return {
                ok: true,
                confirmation: null
            };
        },
        upsertSourceIdentityConfirmation() {
            return {
                ok: true
            };
        }
    };
}

const validSofaSample = {
    snapshot: {
        players: {
            home: { name: 'Lorenzo Sonego' },
            away: { name: 'Miomir Kecmanovic' }
        }
    }
};

const validBetfairSampleMismatch = {
    runners: [
        { name: 'Jan-Lennard Struff', selectionId: 21 },
        { name: 'Nuno Borges', selectionId: 22 }
    ],
    market_info: {
        market_id: '1.200'
    },
    marketKey: 'tennis-market-mismatch'
};

const validBetfairSampleAligned = {
    runners: [
        { name: 'Sonego', selectionId: 11 },
        { name: 'Kecmanovic', selectionId: 12 }
    ],
    market_info: {
        market_id: '1.100'
    },
    marketKey: 'tennis-market'
};

console.log('\n=== sourceIdentityStatusResponse.test.mjs ===\n');

runTest('returns 400 for a missing eventId', () => {
    const res = buildSourceIdentityStatusResponse('');
    assert.equal(res.httpStatus, 400);
    assert.equal(res.body.ok, false);
    assert.match(res.body.error, /Missing or invalid/i);
});

runTest('returns 400 for whitespace-only eventId', () => {
    const res = buildSourceIdentityStatusResponse('   ');
    assert.equal(res.httpStatus, 400);
});

runTest('returns 404 for eventId without active gate session', () => {
    clearAllSourceIdentityGates();
    const res = buildSourceIdentityStatusResponse('non-existent-event');
    assert.equal(res.httpStatus, 404);
    assert.equal(res.body.ok, false);
    assert.match(res.body.error, /No active source identity/i);
});

runTest('returns 200 with collecting details when gate is active but lacks samples', () => {
    clearAllSourceIdentityGates();
    startSourceIdentityGate('event-status-1', {
        hasBetfairUrl: true,
        dependencies: createFakeConfirmationDependencies()
    });
    
    const res = buildSourceIdentityStatusResponse('event-status-1');
    assert.equal(res.httpStatus, 200);
    assert.equal(res.body.ok, true);
    assert.equal(res.body.phase, 'collecting');
    assert.equal(res.body.persistence, 'buffering');
    assert.equal(res.body.sourceIdentity, null);
});

runTest('returns 200 with pending details when samples are present but not aligned', () => {
    clearAllSourceIdentityGates();
    startSourceIdentityGate('event-status-2', {
        hasBetfairUrl: true,
        dependencies: createFakeConfirmationDependencies()
    });
    
    // Send SofaScore sample
    observeSofaSourceIdentitySample('event-status-2', {
        snapshot: {
            players: {
                home: { name: 'Andrew Fenty' },
                away: { name: 'Anders Fenty' }
            }
        }
    });
    
    // Send ambiguous Betfair sample to force pending phase
    observeBetfairSourceIdentitySample('event-status-2', {
        runners: [
            { name: 'And Fenty', selectionId: 41 },
            { name: 'Fenty', selectionId: 42 }
        ],
        market_info: { market_id: '1.300' },
        marketKey: 'tennis-market-pending'
    }, 'tennis-market-pending');
    
    const res = buildSourceIdentityStatusResponse('event-status-2');
    assert.equal(res.httpStatus, 200);
    assert.equal(res.body.ok, true);
    assert.equal(res.body.phase, 'pending');
    assert.equal(res.body.persistence, 'buffering');
    
    const identity = res.body.sourceIdentity;
    assert.ok(identity);
    assert.equal(identity.status, 'pending');
    assert.deepEqual(identity.sofaPlayers, ['Andrew Fenty', 'Anders Fenty']);
    assert.deepEqual(identity.betfairRunners, ['And Fenty', 'Fenty']);
    assert.ok(identity.reasons.length > 0);
});

runTest('returns 200 with mismatch details (active:false, persistence:blocked)', () => {
    clearAllSourceIdentityGates();
    startSourceIdentityGate('event-status-mismatch', {
        hasBetfairUrl: true,
        dependencies: createFakeConfirmationDependencies()
    });
    
    observeSofaSourceIdentitySample('event-status-mismatch', validSofaSample);
    observeBetfairSourceIdentitySample('event-status-mismatch', validBetfairSampleMismatch, 'tennis-market-mismatch');
    
    const res = buildSourceIdentityStatusResponse('event-status-mismatch');
    assert.equal(res.httpStatus, 200);
    assert.equal(res.body.ok, true);
    assert.equal(res.body.active, false);
    assert.equal(res.body.phase, 'mismatch');
    assert.equal(res.body.persistence, 'blocked');
});

runTest('includes safe bootstrap error when bootstrap fails', () => {
    clearAllSourceIdentityGates();
    startSourceIdentityGate('event-status-bootfail', {
        hasBetfairUrl: true,
        dependencies: createFakeConfirmationDependencies(),
        onOpenRecording: () => ({ ok: false })
    });
    
    observeSofaSourceIdentitySample('event-status-bootfail', validSofaSample);
    observeBetfairSourceIdentitySample('event-status-bootfail', validBetfairSampleAligned, 'tennis-market');
    
    const res = buildSourceIdentityStatusResponse('event-status-bootfail');
    assert.equal(res.httpStatus, 200);
    assert.equal(res.body.phase, 'pending');
    assert.equal(res.body.error, 'Bootstrap persistence failed');
});

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);
if (failed > 0) {
    throw new Error('Some sourceIdentityStatusResponse tests failed');
}
