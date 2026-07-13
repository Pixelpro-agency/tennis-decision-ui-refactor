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

const { runTest, finish } = createRunTestSuite('sourceIdentityGate/mismatchAndIsolation.test');

runTest('mismatch after recording returns blocked and triggers mismatch callback once', () => {
    clearAllSourceIdentityGates();
    let mismatchCount = 0;

    startSourceIdentityGate('event-mismatch-recording', {
        hasBetfairUrl: true,
        dependencies: createFakeConfirmationDependencies(),
        onOpenRecording: () => ({ ok: true }),
        onMismatch: () => {
            mismatchCount++;
        }
    });

    // Recording phase setup
    observeSofaSourceIdentitySample('event-mismatch-recording', validSofaSample);
    observeBetfairSourceIdentitySample('event-mismatch-recording', validBetfairSampleAligned, 'tennis-market');

    // Send mismatch sample
    const obsMismatch = observeBetfairSourceIdentitySample('event-mismatch-recording', validBetfairSampleMismatch, 'tennis-market-mismatch');
    assert.equal(obsMismatch.action, 'blocked');
    assert.equal(obsMismatch.phase, 'mismatch');
    assert.equal(mismatchCount, 1);

    // Send another sample, action remains blocked, count stays 1
    const obsMismatch2 = observeSofaSourceIdentitySample('event-mismatch-recording', validSofaSample);
    assert.equal(obsMismatch2.action, 'blocked');
    assert.equal(mismatchCount, 1);
});

runTest('one compatible runner and one unrelated runner blocks without canonical persistence', () => {
    clearAllSourceIdentityGates();
    let bootstrapCount = 0;

    startSourceIdentityGate('event-one-compatible-mismatch', {
        hasBetfairUrl: true,
        dependencies: createFakeConfirmationDependencies(),
        onOpenRecording: () => {
            bootstrapCount++;
            return { ok: true };
        }
    });

    observeSofaSourceIdentitySample(
        'event-one-compatible-mismatch',
        validSofaSample
    );

    const observation = observeBetfairSourceIdentitySample(
        'event-one-compatible-mismatch',
        {
            runners: [
                { name: 'Sonego', selectionId: 61 },
                { name: 'Fabio Fognini', selectionId: 62 }
            ],
            market_info: { market_id: '1.610' },
            marketKey: 'tennis-market-one-compatible-mismatch'
        },
        'tennis-market-one-compatible-mismatch'
    );

    const status = getSourceIdentityGateStatus(
        'event-one-compatible-mismatch'
    );

    assert.equal(observation.phase, 'mismatch');
    assert.equal(observation.action, 'blocked');
    assert.equal(status.phase, 'mismatch');
    assert.equal(status.persistence, 'blocked');
    assert.equal(status.sourceIdentity.status, 'mismatch');
    assert.equal(bootstrapCount, 0);
});

runTest('ambiguous Smith runner plus Fabio Fognini blocks without canonical persistence', () => {
    clearAllSourceIdentityGates();
    let bootstrapCount = 0;

    startSourceIdentityGate('event-ambiguous-smith-unrelated', {
        hasBetfairUrl: true,
        dependencies: createFakeConfirmationDependencies(),
        onOpenRecording: () => {
            bootstrapCount++;
            return { ok: true };
        }
    });

    observeSofaSourceIdentitySample('event-ambiguous-smith-unrelated', {
        snapshot: {
            players: {
                home: { name: 'John Smith' },
                away: { name: 'Peter Smith' }
            }
        }
    });

    const observation = observeBetfairSourceIdentitySample(
        'event-ambiguous-smith-unrelated',
        {
            runners: [
                { name: 'Smith', selectionId: 71 },
                { name: 'Fabio Fognini', selectionId: 72 }
            ],
            market_info: { market_id: '1.710' },
            marketKey: 'tennis-market-ambiguous-smith-unrelated'
        },
        'tennis-market-ambiguous-smith-unrelated'
    );

    const status = getSourceIdentityGateStatus(
        'event-ambiguous-smith-unrelated'
    );

    assert.equal(observation.phase, 'mismatch');
    assert.equal(observation.action, 'blocked');
    assert.equal(status.phase, 'mismatch');
    assert.equal(status.persistence, 'blocked');
    assert.equal(status.sourceIdentity.status, 'mismatch');
    assert.equal(bootstrapCount, 0);
});

finish();
