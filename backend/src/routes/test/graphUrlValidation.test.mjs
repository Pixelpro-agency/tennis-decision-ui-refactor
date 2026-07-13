import assert from 'node:assert/strict';
import { validateGraphUrls } from './graphUrlValidation.js';

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

runTest('returns missing-input error for undefined input', () => {
    assert.deepEqual(validateGraphUrls(), {
        ok: false,
        error: 'No graph URLs provided'
    });
});

runTest('parses comma and newline separated URLs from one string', () => {
    assert.deepEqual(
        validateGraphUrls(
            'https://graphs.betfair.com/1.23456789/101,\nhttps://graphs.betfair.com/1.23456789/202'
        ),
        {
            ok: true,
            graphs: [
                {
                    url: 'https://graphs.betfair.com/1.23456789/101',
                    marketId: '1.23456789',
                    selectionId: '101',
                    valid: true
                },
                {
                    url: 'https://graphs.betfair.com/1.23456789/202',
                    marketId: '1.23456789',
                    selectionId: '202',
                    valid: true
                }
            ],
            sameMarket: true,
            count: 2,
            validCount: 2,
            invalidCount: 0
        }
    );
});

runTest('marks valid graphs from different markets as valid and different', () => {
    assert.deepEqual(
        validateGraphUrls([
            'https://graphs.betfair.com/1.23456789/101',
            'https://graphs.betfair.com/1.98765432/202'
        ]),
        {
            ok: true,
            graphs: [
                {
                    url: 'https://graphs.betfair.com/1.23456789/101',
                    marketId: '1.23456789',
                    selectionId: '101',
                    valid: true
                },
                {
                    url: 'https://graphs.betfair.com/1.98765432/202',
                    marketId: '1.98765432',
                    selectionId: '202',
                    valid: true
                }
            ],
            sameMarket: false,
            count: 2,
            validCount: 2,
            invalidCount: 0
        }
    );
});

runTest('reports mixed valid and invalid URLs without changing details', () => {
    assert.deepEqual(
        validateGraphUrls([
            'https://graphs.betfair.com/1.23456789/101',
            'https://example.com/1.23456789/202',
            'not a url'
        ]),
        {
            ok: false,
            graphs: [
                {
                    url: 'https://graphs.betfair.com/1.23456789/101',
                    marketId: '1.23456789',
                    selectionId: '101',
                    valid: true
                },
                {
                    url: 'https://example.com/1.23456789/202',
                    marketId: null,
                    selectionId: null,
                    valid: false,
                    error: 'Not a graphs.betfair.* domain'
                },
                {
                    url: 'not a url',
                    marketId: null,
                    selectionId: null,
                    valid: false,
                    error: 'Invalid URL'
                }
            ],
            sameMarket: true,
            count: 3,
            validCount: 1,
            invalidCount: 2
        }
    );
});

runTest('reports invalid market and selection formats', () => {
    assert.deepEqual(
        validateGraphUrls('https://graphs.betfair.com/market/selection'),
        {
            ok: false,
            graphs: [
                {
                    url: 'https://graphs.betfair.com/market/selection',
                    marketId: null,
                    selectionId: null,
                    valid: false,
                    error: 'marketId or selectionId format invalid'
                }
            ],
            sameMarket: false,
            count: 1,
            validCount: 0,
            invalidCount: 1
        }
    );
});

runTest('reports short graph paths', () => {
    assert.deepEqual(
        validateGraphUrls('https://graphs.betfair.com/1.23456789'),
        {
            ok: false,
            graphs: [
                {
                    url: 'https://graphs.betfair.com/1.23456789',
                    marketId: null,
                    selectionId: null,
                    valid: false,
                    error: 'Path too short'
                }
            ],
            sameMarket: false,
            count: 1,
            validCount: 0,
            invalidCount: 1
        }
    );
});

if (process.exitCode) {
    process.exit(process.exitCode);
}

console.log('GRAPH_URL_VALIDATION_ASSERTIONS_OK');
