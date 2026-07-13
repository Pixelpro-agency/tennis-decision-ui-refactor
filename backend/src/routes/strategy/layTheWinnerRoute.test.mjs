import assert from 'node:assert/strict';
import fs from 'node:fs';
import strategyRouter from '../strategy.js';

function getLayTheWinnerHandler() {
    const routeLayer = strategyRouter.stack.find((layer) => {
        return layer.route
        && layer.route.path === '/lay-the-winner'
        && layer.route.methods.get === true;
    });
    
    assert.ok(routeLayer, 'GET /lay-the-winner route missing');
    
    const handlerLayer = routeLayer.route.stack.find((layer) => {
        return layer.method === 'get';
    });
    
    assert.ok(handlerLayer, 'GET /lay-the-winner handler missing');
    
    return handlerLayer.handle;
}

async function callLayTheWinnerHandler(query) {
    const req = {
        query
    };
    
    const res = {
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
    
    const handler = getLayTheWinnerHandler();
    
    await handler(req, res);
    
    return {
        httpStatus: res.httpStatus,
        body: res.body
    };
}

async function runTest(name, callback) {
    try {
        await callback();
        console.log(`PASS ${name}`);
    } catch (error) {
        console.error(`FAIL ${name}`);
        console.error(error);
        process.exitCode = 1;
    }
}

const originalAppendFileSync = fs.appendFileSync;

fs.appendFileSync = () => {};

try {
    await runTest('returns the existing missing-url response through the route', async () => {
        assert.deepEqual(
            await callLayTheWinnerHandler({}),
            {
                httpStatus: 400,
                body: {
                    error: 'URL mancante. Usa ?url=<sofascoreMatchUrl>'
                }
            }
        );
    });
    
    await runTest('returns the existing invalid-url response through the route', async () => {
        assert.deepEqual(
            await callLayTheWinnerHandler({
                url: 'https://www.sofascore.com/invalid'
            }),
            {
                httpStatus: 400,
                body: {
                    error: 'URL non valido o eventId non trovato'
                }
            }
        );
    });
} finally {
    fs.appendFileSync = originalAppendFileSync;
}

if (process.exitCode) {
    process.exit(process.exitCode);
}

console.log('LAY_THE_WINNER_ROUTE_ASSERTIONS_OK');