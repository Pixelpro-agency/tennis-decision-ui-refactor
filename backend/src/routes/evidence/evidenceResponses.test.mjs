import assert from 'node:assert/strict';
import {
    buildInvalidEvidenceEventIdResponse,
    buildManualConfirmationValidationResponse,
    normalizeEvidenceEventId,
    buildGateManualConfirmationResponse
} from './evidenceResponses.js';

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

console.log('\n=== evidenceResponses.test.mjs ===\n');

runTest('returns null for a missing event id', () => {
    assert.equal(normalizeEvidenceEventId(undefined), null);
});

runTest('returns null for a whitespace-only event id', () => {
    assert.equal(normalizeEvidenceEventId('   '), null);
});

runTest('trims a valid event id', () => {
    assert.equal(normalizeEvidenceEventId('  16305613  '), '16305613');
});

runTest('returns null for a non-string event id', () => {
    assert.equal(normalizeEvidenceEventId(16305613), null);
});

runTest('builds the existing invalid-event-id response', () => {
    assert.deepEqual(buildInvalidEvidenceEventIdResponse(), {
        httpStatus: 400,
        body: {
            ok: false,
            error: 'Missing or invalid eventId'
        }
    });
});

runTest('maps incomplete confirmation context to HTTP 422', () => {
    assert.deepEqual(
        buildManualConfirmationValidationResponse(
            '16305613',
            'confirmation_context_incomplete'
        ),
        {
            httpStatus: 422,
            body: {
                ok: false,
                eventId: '16305613',
                error: 'Source identity confirmation is invalid'
            }
        }
    );
});

runTest('maps non-pending automatic identity to HTTP 409', () => {
    assert.deepEqual(
        buildManualConfirmationValidationResponse(
            '16305613',
            'automatic_identity_not_pending'
        ),
        {
            httpStatus: 409,
            body: {
                ok: false,
                eventId: '16305613',
                error: 'Source identity confirmation is invalid'
            }
        }
    );
});

runTest('maps all other validation codes to HTTP 400', () => {
    assert.deepEqual(
        buildManualConfirmationValidationResponse(
            '16305613',
            'invalid_confirmation_text'
        ),
        {
            httpStatus: 400,
            body: {
                ok: false,
                eventId: '16305613',
                error: 'Source identity confirmation is invalid'
            }
        }
    );
});

runTest('buildGateManualConfirmationResponse returns null if no active gate exists', () => {
    const res = buildGateManualConfirmationResponse('12345', {}, {
        getSourceIdentityGateStatus: () => ({ ok: false })
    });
    assert.equal(res, null);
});

runTest('buildGateManualConfirmationResponse returns 422 for collecting phase', () => {
    const res = buildGateManualConfirmationResponse('12345', {}, {
        getSourceIdentityGateStatus: () => ({ ok: true, active: true, phase: 'collecting' })
    });
    assert.equal(res.httpStatus, 422);
});

runTest('buildGateManualConfirmationResponse returns 409 for mismatch phase', () => {
    const res = buildGateManualConfirmationResponse('12345', {}, {
        getSourceIdentityGateStatus: () => ({ ok: true, active: true, phase: 'mismatch' })
    });
    assert.equal(res.httpStatus, 409);
});

runTest('buildGateManualConfirmationResponse returns 409 for mismatch phase even when active is false', () => {
    const res = buildGateManualConfirmationResponse('12345', {}, {
        getSourceIdentityGateStatus: () => ({ ok: true, active: false, phase: 'mismatch' })
    });
    assert.equal(res.httpStatus, 409);
});

runTest('buildGateManualConfirmationResponse returns 200 on successful gate confirmation', () => {
    const mockConfirm = () => ({ ok: true, phase: 'recording', sourceIdentity: { status: 'aligned' } });
    const res = buildGateManualConfirmationResponse('12345', { selectedPairs: [], confirmationText: 'OK' }, {
        getSourceIdentityGateStatus: () => ({ ok: true, active: true, phase: 'pending' }),
        confirmActiveSourceIdentityGate: mockConfirm
    });
    assert.equal(res.httpStatus, 200);
    assert.equal(res.body.ok, true);
    assert.equal(res.body.phase, 'recording');
    assert.equal(res.body.sourceIdentity.status, 'aligned');
});

runTest('buildGateManualConfirmationResponse maps validation error code correctly on confirmation failure', () => {
    const mockConfirm = () => ({ ok: false, code: 'invalid_confirmation_text' });
    const res = buildGateManualConfirmationResponse('12345', {}, {
        getSourceIdentityGateStatus: () => ({ ok: true, active: true, phase: 'pending' }),
        confirmActiveSourceIdentityGate: mockConfirm
    });
    assert.equal(res.httpStatus, 400);
});

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);
if (failed > 0) {
    throw new Error('Some evidenceResponses tests failed');
}
