import assert from 'node:assert/strict';
import evidenceRouter from '../evidence.js';
import { startSourceIdentityGate, clearAllSourceIdentityGates, observeSofaSourceIdentitySample, observeBetfairSourceIdentitySample } from '../../sofa/sourceIdentityGate.js';

function createFakeConfirmationDependencies() {
    return {
        findApplicableSourceIdentityConfirmation() {
            return {
                ok: true,
                confirmation: null
            };
        },
        upsertSourceIdentityConfirmation() {
            return {
                ok: true
            };
        }
    };
}

function getRouteHandler(method, path) {
    const routeLayer = evidenceRouter.stack.find((layer) => {
        return layer.route
        && layer.route.path === path
        && layer.route.methods[method] === true;
    });
    
    assert.ok(routeLayer, `${method.toUpperCase()} ${path} route missing`);
    
    const handlerLayer = routeLayer.route.stack.find((layer) => {
        return layer.method === method;
    });
    
    assert.ok(
        handlerLayer,
        `${method.toUpperCase()} ${path} handler missing`
    );
    
    return handlerLayer.handle;
    
}

function createResponse() {
    return {
        httpStatus: null,
        body: null,
        status(httpStatus) {
            this.httpStatus = httpStatus;
            return this;
        },
        json(body) {
            this.body = body;
            return this;
        }
    };
}

function callRouteHandler(method, path, params) {
    const req = {
        params,
        body: {}
    };
    
    const res = createResponse();
    const handler = getRouteHandler(method, path);
    
    handler(req, res);
    
    return {
        httpStatus: res.httpStatus,
        body: res.body
    };
    
}

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

const latestPath = '/:eventId/latest';
const confirmationPath = '/:eventId/source-identity/confirm';

console.log('\n=== evidenceRoute.test.mjs ===\n');

runTest('returns the existing invalid-event-id response for latest', () => {
    assert.deepEqual(
        callRouteHandler('get', latestPath, {
            eventId: '   '
        }),
        {
            httpStatus: 400,
            body: {
                ok: false,
                error: 'Missing or invalid eventId'
            }
        }
    );
});

runTest('returns the existing invalid-event-id response for confirm', () => {
    assert.deepEqual(
        callRouteHandler('post', confirmationPath, {
            eventId: ''
        }),
        {
            httpStatus: 400,
            body: {
                ok: false,
                error: 'Missing or invalid eventId'
            }
        }
    );
});

runTest('returns the existing invalid-event-id response for revoke', () => {
    assert.deepEqual(
        callRouteHandler('delete', confirmationPath, {
            eventId: '   '
        }),
        {
            httpStatus: 400,
            body: {
                ok: false,
                error: 'Missing or invalid eventId'
            }
        }
    );
});

runTest('POST confirm returns 422 when gate is in collecting phase', () => {
    clearAllSourceIdentityGates();
    startSourceIdentityGate('event-route-test-1', {
        hasBetfairUrl: true,
        dependencies: createFakeConfirmationDependencies()
    });

    assert.deepEqual(
        callRouteHandler('post', confirmationPath, {
            eventId: 'event-route-test-1'
        }),
        {
            httpStatus: 422,
            body: {
                ok: false,
                eventId: 'event-route-test-1',
                error: 'Source identity confirmation is invalid'
            }
        }
    );
});

runTest('POST confirm returns 409 when gate is in mismatch phase', () => {
    clearAllSourceIdentityGates();
    startSourceIdentityGate('event-route-test-2', {
        hasBetfairUrl: true,
        dependencies: createFakeConfirmationDependencies()
    });

    // Force mismatch by feeding mismatched samples
    observeSofaSourceIdentitySample('event-route-test-2', {
        snapshot: {
            players: {
                home: { name: 'Player A' },
                away: { name: 'Player B' }
            }
        }
    });
    observeBetfairSourceIdentitySample('event-route-test-2', {
        runners: [
            { name: 'Runner X', selectionId: 21 },
            { name: 'Runner Y', selectionId: 22 }
        ],
        market_info: { market_id: '1.200' },
        marketKey: 'tennis-market-mismatch'
    }, 'tennis-market-mismatch');

    assert.deepEqual(
        callRouteHandler('post', confirmationPath, {
            eventId: 'event-route-test-2'
        }),
        {
            httpStatus: 409,
            body: {
                ok: false,
                eventId: 'event-route-test-2',
                error: 'Source identity confirmation is invalid'
            }
        }
    );
});

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);
if (failed > 0) {
    throw new Error(`${failed} test assertions failed`);
}
