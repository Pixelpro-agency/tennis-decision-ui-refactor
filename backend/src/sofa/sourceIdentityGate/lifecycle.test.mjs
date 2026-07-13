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

const { runTest, finish } = createRunTestSuite('sourceIdentityGate/lifecycle.test');

runTest('automatic aligned lifecycle and action mapping', () => {
    clearAllSourceIdentityGates();
    let bootstrapCount = 0;
    
    startSourceIdentityGate('event-auto-aligned', {
        hasBetfairUrl: true,
        dependencies: createFakeConfirmationDependencies(),
        onOpenRecording: () => {
            bootstrapCount++;
            return { ok: true };
        }
    });

    // Sofa observe on collecting -> buffered
    const obsSofa = observeSofaSourceIdentitySample('event-auto-aligned', validSofaSample);
    assert.equal(obsSofa.action, 'buffered');
    assert.equal(obsSofa.phase, 'collecting');

    // Betfair observe on aligned -> bootstrapped
    const obsBetfair = observeBetfairSourceIdentitySample('event-auto-aligned', validBetfairSampleAligned, 'tennis-market');
    assert.equal(obsBetfair.action, 'bootstrapped');
    assert.equal(obsBetfair.phase, 'recording');
    assert.equal(bootstrapCount, 1);

    // Subsequent Betfair tick -> persist-current
    const obsBetfair2 = observeBetfairSourceIdentitySample('event-auto-aligned', validBetfairSampleAligned, 'tennis-market');
    assert.equal(obsBetfair2.action, 'persist-current');
    assert.equal(obsBetfair2.phase, 'recording');
    assert.equal(bootstrapCount, 1); // Callback not triggered again
});

runTest('manual confirmation only bootstraps once and does not repeat', () => {
    clearAllSourceIdentityGates();
    let bootstrapCount = 0;

    const fakeStore = createFakeConfirmationDependencies();

    startSourceIdentityGate('event-manual', {
        hasBetfairUrl: true,
        dependencies: fakeStore,
        onOpenRecording: () => {
            bootstrapCount++;
            return { ok: true };
        }
    });

    observeSofaSourceIdentitySample('event-manual', {
        snapshot: {
            players: {
                home: { name: 'John Smith' },
                away: { name: 'Peter Smith' }
            }
        }
    });
    observeBetfairSourceIdentitySample('event-manual', validBetfairSamplePending, 'tennis-market-pending');

    // Currently pending
    const statusBefore = getSourceIdentityGateStatus('event-manual');
    assert.equal(statusBefore.phase, 'pending');

    const confirmRes = confirmActiveSourceIdentityGate('event-manual', {
        confirmationText: CONFIRMATION_PHRASE,
        selectedPairs: [
            { sofaPlayer: 'John Smith', betfairRunner: 'John' },
            { sofaPlayer: 'Peter Smith', betfairRunner: 'Peter' }
        ]
    });

    assert.equal(confirmRes.ok, true);
    assert.equal(confirmRes.phase, 'recording');
    assert.equal(bootstrapCount, 1);

    // Tick after manual confirmation -> persist-current
    const obsSofa = observeSofaSourceIdentitySample('event-manual', {
        snapshot: {
            players: {
                home: { name: 'John Smith' },
                away: { name: 'Peter Smith' }
            }
        }
    });
    assert.equal(obsSofa.action, 'persist-current');
    assert.equal(bootstrapCount, 1);
});

runTest('clearAllSourceIdentityGates with and without preserveEventId', () => {
    clearAllSourceIdentityGates();

    startSourceIdentityGate('event-preserve-1', { hasBetfairUrl: true, dependencies: createFakeConfirmationDependencies() });
    startSourceIdentityGate('event-preserve-2', { hasBetfairUrl: true, dependencies: createFakeConfirmationDependencies() });

    // With preserve -> only deletes others
    clearAllSourceIdentityGates({ preserveEventId: 'event-preserve-1' });
    assert.equal(getSourceIdentityGateStatus('event-preserve-1').ok, true);
    assert.equal(getSourceIdentityGateStatus('event-preserve-2').ok, false);

    // Without preserve -> deletes all
    clearAllSourceIdentityGates();
    assert.equal(getSourceIdentityGateStatus('event-preserve-1').ok, false);
});

runTest('input immutability is preserved', () => {
    clearAllSourceIdentityGates();
    
    startSourceIdentityGate('event-immutability', { hasBetfairUrl: true, dependencies: createFakeConfirmationDependencies() });
    
    const sofaInput = JSON.parse(JSON.stringify(validSofaSample));
    const betfairInput = JSON.parse(JSON.stringify(validBetfairSampleAligned));
    
    observeSofaSourceIdentitySample('event-immutability', sofaInput);
    observeBetfairSourceIdentitySample('event-immutability', betfairInput, 'tennis-market');
    
    sofaInput.snapshot.players.home.name = 'MUTATED';
    betfairInput.runners[0].name = 'MUTATED';
    
    const status = getSourceIdentityGateStatus('event-immutability');
    assert.equal(status.sourceIdentity.sofaPlayers[0], 'Lorenzo Sonego');
    assert.equal(status.sourceIdentity.betfairRunners[0], 'Sonego');
});

runTest('sofa persistence context is opaque to source identity and reaches bootstrap', () => {
    clearAllSourceIdentityGates();
    const persistenceData = {
        localContext: {
            marker: 'opaque-local-context',
            recent: { available: true }
        }
    };
    let received = null;

    startSourceIdentityGate('event-opaque-context', {
        hasBetfairUrl: true,
        dependencies: createFakeConfirmationDependencies(),
        onOpenRecording: payload => {
            received = payload;
            return { ok: true };
        }
    });

    observeSofaSourceIdentitySample(
        'event-opaque-context',
        validSofaSample,
        persistenceData
    );
    observeBetfairSourceIdentitySample(
        'event-opaque-context',
        validBetfairSampleAligned,
        'tennis-market'
    );

    assert.ok(received);
    assert.equal(received.sofaPersistenceData, persistenceData);
    assert.equal('localContext' in received.sofaSample, false);
    assert.equal(
        getSourceIdentityGateStatus('event-opaque-context')
            .sourceIdentity.sofaPlayers[0],
        'Lorenzo Sonego'
    );
    assert.equal(
        JSON.stringify(getSourceIdentityGateStatus('event-opaque-context'))
           .includes('opaque-local-context'),
        false
    );
});

finish();
