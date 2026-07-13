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

const { runTest, finish } = createRunTestSuite('sourceIdentityGate/epochRecovery.test');

runTest('recovery after new epoch pending (recording -> pending -> recording)', () => {
    clearAllSourceIdentityGates();
    let bootstrapCount = 0;
    const fakeStore = createFakeConfirmationDependencies();

    startSourceIdentityGate('event-recovery-test', {
        hasBetfairUrl: true,
        dependencies: fakeStore,
        onOpenRecording: () => {
            bootstrapCount++;
            return { ok: true };
        }
    });

    // 1. Pending with ambiguous names
    observeSofaSourceIdentitySample('event-recovery-test', {
        snapshot: {
            players: {
                home: { name: 'John Smith' },
                away: { name: 'Peter Smith' }
            }
        }
    });
    observeBetfairSourceIdentitySample('event-recovery-test', validBetfairSamplePending, 'tennis-market-pending');
    assert.equal(getSourceIdentityGateStatus('event-recovery-test').phase, 'pending');

    // 2. First manual confirmation
    const confirm1 = confirmActiveSourceIdentityGate('event-recovery-test', {
        confirmationText: CONFIRMATION_PHRASE,
        selectedPairs: [
            { sofaPlayer: 'John Smith', betfairRunner: 'John' },
            { sofaPlayer: 'Peter Smith', betfairRunner: 'Peter' }
        ]
    });
    assert.equal(confirm1.ok, true);
    assert.equal(confirm1.phase, 'recording');
    assert.equal(bootstrapCount, 1);

    // 3. New Betfair tick with new marketId/runners (pending transition)
    const newBetfairSample = {
        runners: [
            { name: 'John', selectionId: 991 },
            { name: 'Peter', selectionId: 992 }
        ],
        market_info: { market_id: '1.9999' },
        marketKey: 'tennis-market-new'
    };
    const obsNewTick = observeBetfairSourceIdentitySample('event-recovery-test', newBetfairSample, 'tennis-market-new');
    assert.equal(obsNewTick.phase, 'pending');
    assert.equal(obsNewTick.action, 'buffered'); // no persistence for pending

    // 4. Second manual confirmation for the new epoch/marketId
    const confirm2 = confirmActiveSourceIdentityGate('event-recovery-test', {
        confirmationText: CONFIRMATION_PHRASE,
        selectedPairs: [
            { sofaPlayer: 'John Smith', betfairRunner: 'John' },
            { sofaPlayer: 'Peter Smith', betfairRunner: 'Peter' }
        ]
    });
    assert.equal(confirm2.ok, true);
    assert.equal(confirm2.phase, 'recording');
    assert.equal(bootstrapCount, 2); // Bootstrap triggered again!

    // 5. Subsequent observer -> persist-current
    const obsSofaNext = observeSofaSourceIdentitySample('event-recovery-test', {
        snapshot: {
            players: {
                home: { name: 'John Smith' },
                away: { name: 'Peter Smith' }
            }
        }
    });
    assert.equal(obsSofaNext.action, 'persist-current');
    assert.equal(bootstrapCount, 2);
});

runTest('failure in new generation bootstrap does not retry', () => {
    clearAllSourceIdentityGates();
    let bootstrapCount = 0;
    const fakeStore = createFakeConfirmationDependencies();

    startSourceIdentityGate('event-gen-fail', {
        hasBetfairUrl: true,
        dependencies: fakeStore,
        onOpenRecording: () => {
            bootstrapCount++;
            if (bootstrapCount === 2) {
                return { ok: false }; // fail second bootstrap
            }
            return { ok: true }; // succeed first
        }
    });

    const sofaSmith = {
        snapshot: {
            players: {
                home: { name: 'John Smith' },
                away: { name: 'Peter Smith' }
            }
        }
    };

    // 1. Initial manual confirmation success
    observeSofaSourceIdentitySample('event-gen-fail', sofaSmith);
    observeBetfairSourceIdentitySample('event-gen-fail', validBetfairSamplePending, 'tennis-market-pending');
    
    const confirm1 = confirmActiveSourceIdentityGate('event-gen-fail', {
        confirmationText: CONFIRMATION_PHRASE,
        selectedPairs: [
            { sofaPlayer: 'John Smith', betfairRunner: 'John' },
            { sofaPlayer: 'Peter Smith', betfairRunner: 'Peter' }
        ]
    });
    assert.equal(confirm1.ok, true);
    assert.equal(getSourceIdentityGateStatus('event-gen-fail').phase, 'recording');
    assert.equal(bootstrapCount, 1);

    // 2. recording -> pending for new context
    const ambiguousBetfair = {
        runners: [
            { name: 'John', selectionId: 991 },
            { name: 'Peter', selectionId: 992 }
        ],
        market_info: { market_id: '1.9999' },
        marketKey: 'tennis-market-new'
    };
    const obsPending = observeBetfairSourceIdentitySample('event-gen-fail', ambiguousBetfair, 'tennis-market-new');
    assert.equal(obsPending.phase, 'pending');

    // 3. Confirm manually -> bootstrap #2 fails
    const confirmRes = confirmActiveSourceIdentityGate('event-gen-fail', {
        confirmationText: CONFIRMATION_PHRASE,
        selectedPairs: [
            { sofaPlayer: 'John Smith', betfairRunner: 'John' },
            { sofaPlayer: 'Peter Smith', betfairRunner: 'Peter' }
        ]
    });
    assert.equal(confirmRes.ok, false);
    assert.equal(confirmRes.code, 'bootstrap_persistence_failed');
    assert.equal(bootstrapCount, 2);

    // 4. Subsequent observer in same generation remains buffered, doesn't retry
    const obsSofaNext = observeSofaSourceIdentitySample('event-gen-fail', sofaSmith);
    assert.equal(obsSofaNext.phase, 'pending');
    assert.equal(obsSofaNext.action, 'buffered');
    assert.equal(bootstrapCount, 2); // count stays 2
    assert.equal(getSourceIdentityGateStatus('event-gen-fail').error, 'Bootstrap persistence failed');
});

finish();
