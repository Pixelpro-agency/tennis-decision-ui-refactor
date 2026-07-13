import { detectPointMarkers } from './markerDetector.js';
import { detectPointMarkers as detectPointMarkersFromFacade } from '../sofaEventMarkers.js';

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

function context(overrides = {}) {
    return {
        pointStr: null,
        server: 'home',
        serverName: 'Home',
        receiverName: 'Away',
        timestamp: '2026-06-22T12:00:00.000Z',
        seq: 7,
        ...overrides
    };
}

console.log('\n=== markerDetector.test.mjs ===\n');

{
    const result = detectPointMarkers(context());

    assert(
        'T01-no-score-no-markers',
        Array.isArray(result) && result.length === 0
    );
}

{
    const result = detectPointMarkers(context({
        pointStr: '30-40'
    }));

    const marker = result.find(item => item.type === 'BREAK_POINT');

    assert(
        'T02-break-point-owner-evidence',
        Boolean(marker) &&
            marker.player === 'Home' &&
            marker.playerUnderPressure === 'Home' &&
            marker.confidence === 'medium' &&
            marker.timestamp === '2026-06-22T12:00:00.000Z' &&
            marker.seq === 7 &&
            marker.evidence.includes('Point score indicates break point')
    );
}

{
    const result = detectPointMarkers(context({
        pointStr: '40-30'
    }));

    const marker = result.find(item => item.type === 'GAME_POINT');

    assert(
        'T03-game-point-owner-evidence',
        Boolean(marker) &&
            marker.player === 'Home' &&
            marker.playerUnderPressure === 'Away' &&
            marker.evidence.includes('Server has game point')
    );
}

{
    const result = detectPointMarkers(context({
        pointStr: '40-40'
    }));

    const marker = result.find(item => item.type === 'DEUCE');

    assert(
        'T04-deuce-neutral-pressure',
        Boolean(marker) &&
            marker.playerUnderPressure === null &&
            marker.evidence.some(item => item.includes('deuce'))
    );
}

{
    const result = detectPointMarkers(context({
        pointStr: '30-30'
    }));

    const marker = result.find(item => item.type === 'THIRTY_ALL');

    assert(
        'T05-thirty-all-neutral-pressure',
        Boolean(marker) &&
            marker.playerUnderPressure === null &&
            marker.evidence.includes('Point score is 30-30')
    );
}

{
    const result = detectPointMarkers(context({
        pointStr: '30-40',
        server: null,
        serverName: null,
        receiverName: 'Away',
        timestamp: '',
        seq: 0
    }));

    assert(
        'T06-missing-server-break-point-not-inferred',
        Array.isArray(result) && result.length === 0
    );
}

{
    const result = detectPointMarkers(context({
        pointStr: '40-40'
    }));

    const uniqueTypes = new Set(result.map(item => item.type));

    assert(
        'T07-marker-types-unique',
        uniqueTypes.size === result.length
    );
}

{
    const direct = detectPointMarkers(context({
        pointStr: '30-40',
        seq: 11
    }));

    const fromFacade = detectPointMarkersFromFacade(context({
        pointStr: '30-40',
        seq: 11
    }));

    assert(
        'T08-facade-reexport-contract',
        JSON.stringify(direct) === JSON.stringify(fromFacade)
    );
}

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);

if (failed > 0) {
    throw new Error(`${failed} marker detector assertions failed`);
}
