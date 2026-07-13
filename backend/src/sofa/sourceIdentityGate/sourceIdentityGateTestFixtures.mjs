import assert from 'node:assert/strict';
import {
    startSourceIdentityGate as realStartSourceIdentityGate,
    observeSofaSourceIdentitySample,
    observeBetfairSourceIdentitySample,
    confirmActiveSourceIdentityGate,
    getSourceIdentityGateStatus,
    clearSourceIdentityGate,
    clearAllSourceIdentityGates
} from '../sourceIdentityGate.js';
import {
    CONFIRMATION_PHRASE,
    isConfirmationRecordApplicable
} from '../matchEvidence/sourceIdentityConfirmation.js';

export {
    assert,
    observeSofaSourceIdentitySample,
    observeBetfairSourceIdentitySample,
    confirmActiveSourceIdentityGate,
    getSourceIdentityGateStatus,
    clearSourceIdentityGate,
    clearAllSourceIdentityGates,
    CONFIRMATION_PHRASE
};

export function startSourceIdentityGate(eventId, options = {}) {
    assert.ok(
        options.dependencies,
        `Test error: startSourceIdentityGate for event ${eventId} must use fake dependencies for total isolation`
    );
    return realStartSourceIdentityGate(eventId, options);
}

export function createRunTestSuite(scope) {
    let passed = 0;
    let failed = 0;

    function runTest(name, callback) {
        try {
            callback();
            console.log(`PASS ${name}`);
            passed += 1;
        } catch (error) {
            console.error(`FAIL ${name}`);
            console.error(error);
            failed += 1;
        }
    }

    function finish() {
        console.log(`\n=== ${scope}: ${passed} passed, ${failed} failed ===`);
        if (failed > 0) {
            throw new Error(`${failed} ${scope} tests failed`);
        }
    }

    return { runTest, finish };
}

export function createFakeConfirmationDependencies() {
    let records = [];
    return {
        findApplicableSourceIdentityConfirmation(context) {
            const matched = records.find(record => 
                isConfirmationRecordApplicable({ context, confirmation: record })
            );
            return { ok: true, confirmation: matched || null };
        },
        upsertSourceIdentityConfirmation(record) {
            const copied = {
                ...record,
                selectionIds: record.selectionIds ? [...record.selectionIds].sort() : [],
                sofaPlayers: record.sofaPlayers ? [...record.sofaPlayers] : [],
                betfairRunners: record.betfairRunners ? [...record.betfairRunners] : [],
                selectedPairs: record.selectedPairs ? record.selectedPairs.map(p => ({...p})) : []
            };
            records.push(copied);
            return { ok: true };
        }
    };
}

export const validSofaSample = {
    snapshot: {
        players: {
            home: { name: 'Lorenzo Sonego' },
            away: { name: 'Miomir Kecmanovic' }
        }
    }
};

export const validBetfairSampleAligned = {
    runners: [
        { name: 'Sonego', selectionId: 11 },
        { name: 'Kecmanovic', selectionId: 12 }
    ],
    market_info: {
        market_id: '1.100'
    },
    marketKey: 'tennis-market'
};

export const validBetfairSampleMismatch = {
    runners: [
        { name: 'Jan-Lennard Struff', selectionId: 21 },
        { name: 'Nuno Borges', selectionId: 22 }
    ],
    market_info: {
        market_id: '1.200'
    },
    marketKey: 'tennis-market-mismatch'
};

export const validBetfairSamplePending = {
    runners: [
        { name: 'John', selectionId: 41 },
        { name: 'Peter', selectionId: 42 }
    ],
    market_info: {
        market_id: '1.300'
    },
    marketKey: 'tennis-market-pending'
};
