import {
    assert,
    startSourceIdentityGate,
    observeSofaSourceIdentitySample,
    observeBetfairSourceIdentitySample,
    confirmActiveSourceIdentityGate,
    getSourceIdentityGateStatus,
    clearSourceIdentityGate,
    clearAllSourceIdentityGates,
    CONFIRMATION_PHRASE,
    createFakeConfirmationDependencies,
    validSofaSample,
    validBetfairSampleAligned,
    validBetfairSampleMismatch,
    validBetfairSamplePending,
    createRunTestSuite
} from './sourceIdentityGateTestFixtures.mjs';

const { runTest, finish } = createRunTestSuite('sourceIdentityGate/bootstrapFailures.test');

runTest('bootstrap failure keeps phase pending, error synthetic, action buffered, no retry', () => {
    clearAllSourceIdentityGates();
    let bootstrapAttempts = 0;

    startSourceIdentityGate('event-bootstrap-fail', {
        hasBetfairUrl: true,
        dependencies: createFakeConfirmationDependencies(),
        onOpenRecording: () => {
            bootstrapAttempts++;
            return { ok: false }; // fail bootstrap
        }
    });

    observeSofaSourceIdentitySample('event-bootstrap-fail', validSofaSample);
    const obsBetfair = observeBetfairSourceIdentitySample('event-bootstrap-fail', validBetfairSampleAligned, 'tennis-market');

    // Bootstrap failure makes phase stay pending, and action remains buffered
    assert.equal(obsBetfair.phase, 'pending');
    assert.equal(obsBetfair.action, 'buffered');
    assert.equal(bootstrapAttempts, 1);

    const status = getSourceIdentityGateStatus('event-bootstrap-fail');
    assert.equal(status.error, 'Bootstrap persistence failed');

    // Next tick doesn't retry bootstrap automatically
    const obsBetfair2 = observeBetfairSourceIdentitySample('event-bootstrap-fail', validBetfairSampleAligned, 'tennis-market');
    assert.equal(obsBetfair2.phase, 'pending');
    assert.equal(obsBetfair2.action, 'buffered');
    assert.equal(bootstrapAttempts, 1); // Still 1, no retry
});

runTest('full sofa_commit failure envelope keeps gate pending and blocks betfair bootstrap', () => {
    clearAllSourceIdentityGates();
    let bootstrapAttempts = 0;

    startSourceIdentityGate('event-full-sofa-failure', {
        hasBetfairUrl: true,
        dependencies: createFakeConfirmationDependencies(),
        onOpenRecording: () => {
            bootstrapAttempts++;
            return {
                ok: false,
                operation: 'sofa_commit',
                source: 'sofa',
                eventId: 'event-full-sofa-failure',
                commitId: null,
                status: 'failed',
                reason: 'persistence_incomplete',
                failedDocument: 'history',
                documents: {
                    history: { ok: false, status: 'failed', file: null, reason: 'write_failed' },
                    timeline: { ok: null, status: null, file: null, reason: null }
                },
                warnings: []
            };
        }
    });

    observeSofaSourceIdentitySample('event-full-sofa-failure', validSofaSample);
    const obsBetfair = observeBetfairSourceIdentitySample('event-full-sofa-failure', validBetfairSampleAligned, 'tennis-market');

    assert.equal(obsBetfair.phase, 'pending');
    assert.equal(obsBetfair.action, 'buffered');
    assert.equal(bootstrapAttempts, 1);

    const status = getSourceIdentityGateStatus('event-full-sofa-failure');
    assert.equal(status.error, 'Bootstrap persistence failed');

    // No automatic retry on next tick
    const obsBetfair2 = observeBetfairSourceIdentitySample('event-full-sofa-failure', validBetfairSampleAligned, 'tennis-market');
    assert.equal(obsBetfair2.phase, 'pending');
    assert.equal(obsBetfair2.action, 'buffered');
    assert.equal(bootstrapAttempts, 1);
});

runTest('undefined bootstrap result keeps phase pending and does not retry', () => {
    clearAllSourceIdentityGates();
    let bootstrapAttempts = 0;

    startSourceIdentityGate('event-bootstrap-undefined', {
        hasBetfairUrl: true,
        dependencies: createFakeConfirmationDependencies(),
        onOpenRecording: () => {
            bootstrapAttempts++;
            return undefined;
        }
    });

    observeSofaSourceIdentitySample(
        'event-bootstrap-undefined',
        validSofaSample
    );
    const first = observeBetfairSourceIdentitySample(
        'event-bootstrap-undefined',
        validBetfairSampleAligned,
        'tennis-market'
    );

    assert.equal(first.phase, 'pending');
    assert.equal(first.action, 'buffered');
    assert.equal(bootstrapAttempts, 1);
    assert.equal(
        getSourceIdentityGateStatus('event-bootstrap-undefined').error,
        'Bootstrap persistence failed'
    );

    const second = observeSofaSourceIdentitySample(
        'event-bootstrap-undefined',
        validSofaSample
    );
    assert.equal(second.phase, 'pending');
    assert.equal(second.action, 'buffered');
    assert.equal(bootstrapAttempts, 1);
});

runTest('manual confirmation is persisted only after successful bootstrap', () => {
    clearAllSourceIdentityGates();
    let upserts = 0;
    const dependencies = {
        ...createFakeConfirmationDependencies(),
        upsertSourceIdentityConfirmation() {
            upserts += 1;
            return { ok: true };
        }
    };
    startSourceIdentityGate('event-manual-atomic', {
        hasBetfairUrl: true,
        dependencies,
        onOpenRecording: () => ({ ok: false })
    });
    const sofa = {
        snapshot: {
            players: {
                home: { name: 'John Smith' },
                away: { name: 'Peter Smith' }
            }
        }
    };
    observeSofaSourceIdentitySample('event-manual-atomic', sofa);
    observeBetfairSourceIdentitySample(
        'event-manual-atomic', validBetfairSamplePending, 'tennis-market-pending'
    );
    const result = confirmActiveSourceIdentityGate('event-manual-atomic', {
        confirmationText: CONFIRMATION_PHRASE,
        selectedPairs: [
            { sofaPlayer: 'John Smith', betfairRunner: 'John' },
            { sofaPlayer: 'Peter Smith', betfairRunner: 'Peter' }
        ]
    });
    assert.equal(result.ok, false);
    assert.equal(result.code, 'bootstrap_persistence_failed');
    assert.equal(upserts, 0);
    assert.equal(getSourceIdentityGateStatus('event-manual-atomic').phase, 'pending');
});

runTest('confirmation persistence failure does not enter recording', () => {
    clearAllSourceIdentityGates();
    let bootstraps = 0;
    const dependencies = {
        ...createFakeConfirmationDependencies(),
        upsertSourceIdentityConfirmation: () => ({ ok: false })
    };
    startSourceIdentityGate('event-manual-store-fail', {
        hasBetfairUrl: true,
        dependencies,
        onOpenRecording: () => {
            bootstraps += 1;
            return { ok: true };
        }
    });
    const sofa = {
        snapshot: {
            players: {
                home: { name: 'John Smith' },
                away: { name: 'Peter Smith' }
            }
        }
    };
    observeSofaSourceIdentitySample('event-manual-store-fail', sofa);
    observeBetfairSourceIdentitySample(
        'event-manual-store-fail', validBetfairSamplePending, 'tennis-market-pending'
    );
    const result = confirmActiveSourceIdentityGate('event-manual-store-fail', {
        confirmationText: CONFIRMATION_PHRASE,
        selectedPairs: [
            { sofaPlayer: 'John Smith', betfairRunner: 'John' },
            { sofaPlayer: 'Peter Smith', betfairRunner: 'Peter' }
        ]
    });
    assert.equal(result.ok, false);
    assert.equal(result.code, 'persistence_failed');
    assert.equal(bootstraps, 1);
    assert.equal(getSourceIdentityGateStatus('event-manual-store-fail').phase, 'pending');
});

finish();
