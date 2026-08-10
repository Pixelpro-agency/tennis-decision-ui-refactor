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
            'https://graphs.betfair.it/1.23456789/101/0,\nhttps://graphs.betfair.it/1.23456789/202/0'
        ),
        {
            ok: true,
            graphs: [
                {
                    url: 'https://graphs.betfair.it/1.23456789/101/0',
                    marketId: '1.23456789',
                    selectionId: '101',
                    valid: true
                },
                {
                    url: 'https://graphs.betfair.it/1.23456789/202/0',
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
            'https://graphs.betfair.it/1.23456789/101/0',
            'https://graphs.betfair.it/1.98765432/202/0'
        ]),
        {
            ok: true,
            graphs: [
                {
                    url: 'https://graphs.betfair.it/1.23456789/101/0',
                    marketId: '1.23456789',
                    selectionId: '101',
                    valid: true
                },
                {
                    url: 'https://graphs.betfair.it/1.98765432/202/0',
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
            'https://graphs.betfair.it/1.23456789/101/0',
            'https://example.com/1.23456789/202',
            'not a url'
        ]),
        {
            ok: false,
            graphs: [
                {
                    url: 'https://graphs.betfair.it/1.23456789/101/0',
                    marketId: '1.23456789',
                    selectionId: '101',
                    valid: true
                },
                {
                    url: 'https://example.com/1.23456789/202',
                    marketId: null,
                    selectionId: null,
                    valid: false,
                    error: 'bad_graph_url_invalid'
                },
                {
                    url: 'not a url',
                    marketId: null,
                    selectionId: null,
                    valid: false,
                    error: 'bad_graph_url_invalid'
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
        validateGraphUrls('https://graphs.betfair.it/market/selection/0'),
        {
            ok: false,
            graphs: [
                {
                    url: 'https://graphs.betfair.it/market/selection/0',
                    marketId: null,
                    selectionId: null,
                    valid: false,
                    error: 'bad_graph_url_invalid'
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
        validateGraphUrls('https://graphs.betfair.it/1.23456789'),
        {
            ok: false,
            graphs: [
                {
                    url: 'https://graphs.betfair.it/1.23456789',
                    marketId: null,
                    selectionId: null,
                    valid: false,
                    error: 'bad_graph_url_invalid'
                }
            ],
            sameMarket: false,
            count: 1,
            validCount: 0,
            invalidCount: 1
        }
    );
});

runTest('rejects duplicate selection IDs', () => {
    const result = validateGraphUrls([
        'https://graphs.betfair.it/1.23456789/101/0',
        'https://graphs.betfair.it/1.23456789/101/0'
    ]);
    assert.equal(result.ok, false);
    assert.equal(result.invalidCount, 1);
    assert.equal(result.graphs[1].error, 'bad_graph_url_duplicate_selection');
});

runTest('rejects non-canonical protocol, host, port and path', () => {
    for (const value of [
        'http://graphs.betfair.it/1.2/3/0',
        'https://graphs.betfair.com/1.2/3/0',
        'https://graphs.betfair.it:443/1.2/3/0',
        'https://graphs.betfair.it/1.2/3'
    ]) {
        assert.equal(validateGraphUrls(value).ok, false, value);
    }
});

if (process.exitCode) {
    process.exit(process.exitCode);
}

console.log('GRAPH_URL_VALIDATION_ASSERTIONS_OK');
