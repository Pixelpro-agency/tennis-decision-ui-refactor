import assert from 'node:assert/strict';
import {
    buildLayTheWinnerErrorResponse,
    normalizeLayTheWinnerRequest
} from './layTheWinnerResponse.js';

function runTest(name, callback) {
    try {
        callback();
        console.log(`PASS ${name}`);
    } catch (error) {
        console.error(`FAIL ${name}`);
        console.error(error);
        process.exitCode = 1;
    }
}

runTest('returns the existing missing-url response', () => {
    assert.deepEqual(
        normalizeLayTheWinnerRequest(undefined, () => null),
        {
            ok: false,
            httpStatus: 400,
            body: {
                error: 'URL mancante. Usa ?url=<sofascoreMatchUrl>'
            }
        }
    );
});

runTest('returns the existing invalid-url response', () => {
    assert.deepEqual(
        normalizeLayTheWinnerRequest('https://www.sofascore.com/invalid', () => null),
        {
            ok: false,
            httpStatus: 400,
            body: {
                error: 'URL non valido o eventId non trovato'
            }
        }
    );
});

runTest('trims the URL before extracting the event id', () => {
    let receivedUrl = null;
    
const result = normalizeLayTheWinnerRequest(
    '  https://www.sofascore.com/tennis/match/example/16305613  ',
    (url) => {
        receivedUrl = url;
        return '16305613';
    }
);
    
assert.equal(
    receivedUrl,
    'https://www.sofascore.com/tennis/match/example/16305613'
);
    
assert.deepEqual(result, {
    ok: true,
    url: 'https://www.sofascore.com/tennis/match/example/16305613',
    eventId: '16305613'
});
    
});

runTest('maps a 404 error to HTTP 404', () => {
    assert.deepEqual(
        buildLayTheWinnerErrorResponse(new Error('SofaScore returned 404')),
        {
            httpStatus: 404,
            body: {
                error: 'SofaScore returned 404'
            }
        }
    );
});

runTest('maps a not found error to HTTP 404', () => {
    assert.deepEqual(
        buildLayTheWinnerErrorResponse(new Error('Event not found')),
        {
            httpStatus: 404,
            body: {
                error: 'Event not found'
            }
        }
    );
});

runTest('maps a 403 error to HTTP 503', () => {
    assert.deepEqual(
        buildLayTheWinnerErrorResponse(new Error('SofaScore returned 403')),
        {
            httpStatus: 503,
            body: {
                error: 'SofaScore returned 403'
            }
        }
    );
});

runTest('maps a blocked error to HTTP 503', () => {
    assert.deepEqual(
        buildLayTheWinnerErrorResponse(new Error('Request blocked')),
        {
            httpStatus: 503,
            body: {
                error: 'Request blocked'
            }
        }
    );
});

runTest('preserves the current 403 precedence when an error matches both rules', () => {
    assert.deepEqual(
        buildLayTheWinnerErrorResponse(new Error('404 blocked')),
        {
            httpStatus: 503,
            body: {
                error: '404 blocked'
            }
        }
    );
});

runTest('maps a generic error to HTTP 500', () => {
    assert.deepEqual(
        buildLayTheWinnerErrorResponse(new Error('Unexpected failure')),
        {
            httpStatus: 500,
            body: {
                error: 'Unexpected failure'
            }
        }
    );
});

runTest('converts a non-Error value to its string form', () => {
    assert.deepEqual(
        buildLayTheWinnerErrorResponse('raw failure'),
        {
            httpStatus: 500,
            body: {
                error: 'raw failure'
            }
        }
    );
});

if (process.exitCode) {
    process.exit(process.exitCode);
}

console.log('LAY_THE_WINNER_RESPONSE_ASSERTIONS_OK');
