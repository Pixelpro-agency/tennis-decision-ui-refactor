import {
    buildServicePressure,
    buildReturnPressure,
    buildPressureBlock,
    buildPressureWindow
} from './pressure.js';

import {
    detectPointMarkers,
    buildPressureWindow as buildPressureWindowFromFacade,
    buildSofaEventEvidence
} from '../sofaEventMarkers.js';

let passed = 0;
let failed = 0;

function assert(label, condition, detail = '') {
    if (condition) {
        console.log(`  PASS [${label}]`);
        passed++;
    } else {
        console.error(`  FAIL [${label}]${detail ? ': ' + detail : ''}`);
        failed++;
    }
}

const now = new Date('2026-06-22T12:00:00.000Z');

console.log('\n=== pressure.test.mjs ===\n');

{
    const result = buildServicePressure([], 'Home', []);

    assert(
        'T01-service-without-break',
        result.active === false &&
            result.player === 'Home' &&
            result.severity === 'low' &&
            result.confidence === 'low'
    );
}

{
    const result = buildServicePressure(
        ['BREAK_POINT'],
        'Home',
        ['Point score indicates break point']
    );

    assert(
        'T02-service-break-pressure',
        result.active === true &&
            result.player === 'Home' &&
            result.severity === 'medium' &&
            result.confidence === 'medium' &&
            result.evidence.length === 1
    );
}

{
    const result = buildServicePressure(
        ['BREAK_POINT', 'BREAK_POINT'],
        'Home',
        []
    );

    assert(
        'T03-service-double-break-high',
        result.active === true &&
            result.severity === 'high'
    );
}

{
    const result = buildReturnPressure(
        ['BREAK_POINT'],
        'Away'
    );

    assert(
        'T04-return-break-pressure',
        result.active === true &&
            result.player === 'Away' &&
            result.severity === 'medium' &&
            result.evidence[0] === 'Receiver has break point'
    );
}

{
    const result = buildReturnPressure(
        ['GAME_POINT'],
        'Away'
    );

    assert(
        'T05-return-without-break',
        result.active === false &&
            result.player === 'Away' &&
            result.severity === 'low'
    );
}

{
    const result = buildPressureBlock(
        ['GAME_POINT'],
        'Away',
        'Home',
        'Away',
        []
    );

    assert(
        'T06-no-generic-pressure',
        result === null
    );
}

{
    const result = buildPressureBlock(
        ['DEUCE'],
        'Home',
        'Home',
        'Away',
        ['Deuce']
    );

    assert(
        'T07-deuce-pressure',
        result.active === true &&
            result.playerUnderPressure === 'Home' &&
            result.type === 'deuce_pressure' &&
            result.severity === 'medium'
    );
}

{
    const result = buildPressureBlock(
        ['THIRTY_ALL'],
        null,
        'Home',
        'Away',
        []
    );

    assert(
        'T08-thirty-all-pressure',
        result.active === true &&
            result.type === 'service_pressure' &&
            result.severity === 'low' &&
            result.confidence === 'low'
    );
}

{
    const result = buildPressureWindow([], now);

    assert(
        'T09-empty-window',
        result.active === false &&
            result.type === null &&
            result.durationSec === 0 &&
            result.evidence.length === 0
    );
}

{
    const result = buildPressureWindow([
        {
            timestamp: '2026-06-22T11:58:00.000Z',
            markerTypes: ['BREAK_POINT'],
            playerUnderPressure: 'Home'
        }
    ], now);

    assert(
        'T10-expired-window',
        result.active === false &&
            result.playerUnderPressure === null
    );
}

{
    const result = buildPressureWindow([
        {
            timestamp: '2026-06-22T11:59:20.000Z',
            markerTypes: ['BREAK_POINT'],
            playerUnderPressure: 'Home'
        },
        {
            timestamp: '2026-06-22T11:59:30.000Z',
            markerTypes: ['DEUCE'],
            playerUnderPressure: null
        },
        {
            timestamp: '2026-06-22T11:59:40.000Z',
            markerTypes: ['BREAK_POINT'],
            playerUnderPressure: 'Away'
        }
    ], now);

    assert(
        'T11-window-severity-duration',
        result.active === true &&
            result.type === 'service_pressure' &&
            result.severity === 'high' &&
            result.playerUnderPressure === 'Away' &&
            result.durationSec === 20 &&
            result.evidence.length === 2
    );
}

{
    const ticks = [{
        timestamp: '2026-06-22T11:59:30.000Z',
        markerTypes: ['BREAK_POINT'],
        playerUnderPressure: 'Home'
    }];

    const directWindow = buildPressureWindow(ticks, now);
    const facadeWindow = buildPressureWindowFromFacade(ticks, now);

    const markers = detectPointMarkers({
        pointStr: '30-40',
        server: 'home',
        serverName: 'Home',
        receiverName: 'Away',
        timestamp: now.toISOString(),
        seq: 1
    });

    const evidence = buildSofaEventEvidence({
        latestTick: null,
        recentTicks: [],
        now
    });

    assert(
        'T12-facade-contract',
        JSON.stringify(directWindow) === JSON.stringify(facadeWindow) &&
            Array.isArray(markers) &&
            typeof buildSofaEventEvidence === 'function' &&
            evidence.pressureWindow.active === false
    );
}

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);

if (failed > 0) {
    throw new Error(`${failed} pressure assertions failed`);
}
