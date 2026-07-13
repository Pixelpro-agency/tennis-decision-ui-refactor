import assert from 'node:assert/strict';
import testRouter from '../test.js';

function getGraphUrlsHandler() {
    const routeLayer = testRouter.stack.find((layer) => {
        return layer.route
            && layer.route.path === '/graph-urls'
            && layer.route.methods.post === true;
    });

    assert.ok(routeLayer, 'POST /graph-urls route missing');

    const handlerLayer = routeLayer.route.stack.find((layer) => {
        return layer.method === 'post';
    });

    assert.ok(handlerLayer, 'POST /graph-urls handler missing');

    return handlerLayer.handle;
}

function callGraphUrlsHandler(body) {
    let responseBody;

    const req = {
        body
    };

    const res = {
        json(payload) {
            responseBody = payload;
            return this;
        }
    };

    const handler = getGraphUrlsHandler();
    handler(req, res);

    return responseBody;
}

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

runTest('returns the missing-input response through the route handler', () => {
    assert.deepEqual(callGraphUrlsHandler(undefined), {
        ok: false,
        error: 'No graph URLs provided'
    });
});

runTest('returns the extracted graph result through the route handler', () => {
    assert.deepEqual(
        callGraphUrlsHandler({
            graphUrls: 'https://graphs.betfair.com/1.23456789/101,https://graphs.betfair.com/1.23456789/202'
        }),
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

if (process.exitCode) {
    process.exit(process.exitCode);
}

console.log('GRAPH_URL_ROUTE_ASSERTIONS_OK');