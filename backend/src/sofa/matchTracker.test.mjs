import assert from 'node:assert/strict';
import { stopAllMatchTrackers, persistBootstrapTrackingSamples } from './matchTracker.js';
import { startSourceIdentityGate, getSourceIdentityGateStatus, clearAllSourceIdentityGates } from './sourceIdentityGate.js';

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

console.log('\n=== matchTracker.test.mjs ===\n');

runTest('stopAllMatchTrackers() clears all gates', () => {
    clearAllSourceIdentityGates();
    
    startSourceIdentityGate('event-test-1', { hasBetfairUrl: true });
    startSourceIdentityGate('event-test-2', { hasBetfairUrl: true });
    
    assert.equal(getSourceIdentityGateStatus('event-test-1').ok, true);
    assert.equal(getSourceIdentityGateStatus('event-test-2').ok, true);
    
    stopAllMatchTrackers();
    
    assert.equal(getSourceIdentityGateStatus('event-test-1').ok, false);
    assert.equal(getSourceIdentityGateStatus('event-test-2').ok, false);
});

runTest('stopAllMatchTrackers({ preserveGateEventId }) preserves only specified gate', () => {
    clearAllSourceIdentityGates();
    
    startSourceIdentityGate('event-test-preserve', { hasBetfairUrl: true });
    startSourceIdentityGate('event-test-delete', { hasBetfairUrl: true });
    
    assert.equal(getSourceIdentityGateStatus('event-test-preserve').ok, true);
    assert.equal(getSourceIdentityGateStatus('event-test-delete').ok, true);
    
    stopAllMatchTrackers({ preserveGateEventId: 'event-test-preserve' });
    
    assert.equal(getSourceIdentityGateStatus('event-test-preserve').ok, true);
    assert.equal(getSourceIdentityGateStatus('event-test-delete').ok, false);
});

runTest('Sofa bootstrap false or undefined blocks Betfair bootstrap and forwards opaque local context', () => {
    const fullSofaFailure = {
        ok: false,
        operation: 'sofa_commit',
        source: 'sofa',
        eventId: 'event-sofa-bootstrap-block',
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

    for (const sofaResult of [
        fullSofaFailure,
        undefined
    ]) {
        let sofaCalls = 0;
        let betfairCalls = 0;
        const localContext = {
            marker: 'opaque-bootstrap-context',
            recent: { available: true }
        };

        const result = persistBootstrapTrackingSamples({
            eventId: 'event-sofa-bootstrap-block',
            sofaSample: {
                snapshot: { id: 'sofa-snapshot' },
                tournamentName: 'Bootstrap Open',
                dateStr: '2026-06-29'
            },
            sofaPersistenceData: { localContext },
            betfairSample: { id: 'betfair-sample' },
            betfairKey: 'tennis-market',
            persistSofaTrackingSampleFn: (
                eventId,
                receivedSnapshot,
                tournamentName,
                dateStr,
                timelineData
            ) => {
                sofaCalls++;
                assert.equal(eventId, 'event-sofa-bootstrap-block');
                assert.deepEqual(receivedSnapshot, { id: 'sofa-snapshot' });
                assert.equal(tournamentName, 'Bootstrap Open');
                assert.equal(dateStr, '2026-06-29');
                assert.deepEqual(timelineData, {
                    snapshot: { id: 'sofa-snapshot' },
                    localContext
                });
                return sofaResult;
            },
            persistBetfairTrackingSampleFn: () => {
                betfairCalls++;
                return { ok: true };
            }
        });

        assert.equal(result.ok, false);
        assert.equal(result.sofa.ok, false);
        assert.equal(result.sofa.operation, 'sofa_commit');
        assert.equal(result.sofa.source, 'sofa');
        assert.equal(result.sofa.eventId, 'event-sofa-bootstrap-block');
        assert.equal(result.betfair, null);
        assert.equal(sofaCalls, 1);
        assert.equal(betfairCalls, 0);
    }
});

runTest('bootstrap success preserves sofa and betfair results', () => {
    let sofaCalls = 0;
    let betfairCalls = 0;
    const localContext = {
        marker: 'opaque-bootstrap-context',
        recent: { available: true }
    };

    const result = persistBootstrapTrackingSamples({
        eventId: 'event-bootstrap-success',
        sofaSample: {
            snapshot: { id: 'sofa-snapshot' },
            tournamentName: 'Bootstrap Open',
            dateStr: '2026-06-29'
        },
        sofaPersistenceData: { localContext },
        betfairSample: { id: 'betfair-sample' },
        betfairKey: 'tennis-market',
        persistSofaTrackingSampleFn: () => {
            sofaCalls++;
            return {
                ok: true,
                operation: 'sofa_commit',
                source: 'sofa',
                eventId: 'event-bootstrap-success',
                commitId: 'sofa-bootstrap-commit',
                status: 'complete',
                reason: null,
                failedDocument: null,
                documents: {
                    history: { ok: true, status: 'written', file: '/history/event-bootstrap-success.json', reason: null },
                    timeline: { ok: true, status: 'written', file: '/timeline/sofa_event-bootstrap-success.json', reason: null }
                },
                warnings: []
            };
        },
        persistBetfairTrackingSampleFn: () => {
            betfairCalls++;
            return { ok: true, operation: 'betfair_commit', status: 'complete' };
        }
    });

    assert.equal(result.ok, true);
    assert.equal(result.sofa.ok, true);
    assert.equal(result.sofa.commitId, 'sofa-bootstrap-commit');
    assert.equal(result.betfair.ok, true);
    assert.equal(sofaCalls, 1);
    assert.equal(betfairCalls, 1);
});

runTest('Sofa bootstrap incomplete sofa_commit ok:false blocks Betfair and returns full failure', () => {
    let sofaCalls = 0;
    let betfairCalls = 0;

    const result = persistBootstrapTrackingSamples({
        eventId: 'event-sofa-incomplete-false',
        sofaSample: {
            snapshot: { id: 'sofa-snapshot' },
            tournamentName: 'Bootstrap Open',
            dateStr: '2026-06-29'
        },
        sofaPersistenceData: null,
        betfairSample: { id: 'betfair-sample' },
        betfairKey: 'tennis-market',
        persistSofaTrackingSampleFn: () => {
            sofaCalls++;
            return { ok: false, operation: 'sofa_commit', source: 'sofa' };
        },
        persistBetfairTrackingSampleFn: () => {
            betfairCalls++;
            return { ok: true };
        }
    });

    assert.equal(result.ok, false);
    assert.equal(result.sofa.ok, false);
    assert.equal(result.sofa.operation, 'sofa_commit');
    assert.equal(result.sofa.source, 'sofa');
    assert.equal(result.sofa.eventId, 'event-sofa-incomplete-false');
    assert.equal(result.sofa.status, 'failed');
    assert.equal(result.sofa.reason, 'persistence_incomplete');
    assert.equal(result.betfair, null);
    assert.equal(sofaCalls, 1);
    assert.equal(betfairCalls, 0);
});

runTest('Sofa bootstrap incomplete sofa_commit ok:true blocks Betfair and returns full failure', () => {
    let sofaCalls = 0;
    let betfairCalls = 0;

    const result = persistBootstrapTrackingSamples({
        eventId: 'event-sofa-incomplete-true',
        sofaSample: {
            snapshot: { id: 'sofa-snapshot' },
            tournamentName: 'Bootstrap Open',
            dateStr: '2026-06-29'
        },
        sofaPersistenceData: null,
        betfairSample: { id: 'betfair-sample' },
        betfairKey: 'tennis-market',
        persistSofaTrackingSampleFn: () => {
            sofaCalls++;
            return { ok: true, operation: 'sofa_commit', source: 'sofa' };
        },
        persistBetfairTrackingSampleFn: () => {
            betfairCalls++;
            return { ok: true };
        }
    });

    assert.equal(result.ok, false);
    assert.equal(result.sofa.ok, false);
    assert.equal(result.sofa.operation, 'sofa_commit');
    assert.equal(result.sofa.source, 'sofa');
    assert.equal(result.sofa.eventId, 'event-sofa-incomplete-true');
    assert.equal(result.sofa.status, 'failed');
    assert.equal(result.sofa.reason, 'persistence_incomplete');
    assert.equal(result.betfair, null);
    assert.equal(sofaCalls, 1);
    assert.equal(betfairCalls, 0);
});

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);
if (failed > 0) {
    throw new Error('Some matchTracker tests failed');
}
