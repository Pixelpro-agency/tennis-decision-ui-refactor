import {
    extractPlayers,
    extractServer,
    extractPointScore,
    extractGameScore,
    extractSetScore,
    detectScoreMarkerTypes,
    detectServerMarkerTypes,
    inferGamePhase,
    inferSetPhase
} from './scoreState.js';

let passed = 0;
let failed = 0;

function assert(label, condition, detail) {
    if (condition) {
        console.log(`  PASS [${label}]`);
        passed++;
    } else {
        console.error(`  FAIL [${label}]${detail ? ': ' + detail : ''}`);
        failed++;
    }
}

function tick(data) {
    return { data };
}

console.log('\n=== scoreState.test.mjs ===\n');

{
    const value = extractPlayers(tick({ players: { home: { name: 'Home' }, away: { name: 'Away' } } }));
    assert('T01-players', value?.home === 'Home' && value?.away === 'Away');
    assert('T02-players-empty', extractPlayers(tick({})) === null);
}

{
    assert('T03-server-direct', extractServer(tick({ serving: 'home' })) === 'home');
    assert('T04-server-player-flag', extractServer(tick({ players: { away: { isServing: true } } })) === 'away');
    assert('T05-server-missing', extractServer(tick({})) === null);
}

{
    assert('T06-point-trim', extractPointScore(tick({ score: { point: ' 30-40 ' } })) === '30-40');
    assert('T07-point-invalid', extractPointScore(tick({ score: { point: ' ' } })) === null);

    const games = extractGameScore(tick({ score: { games: { home: 4 } } }));
    assert('T08-game-partial', games?.home === 4 && games?.away === 0);

    assert('T09-game-invalid', extractGameScore(tick({ score: {} })) === null);

    const setScore = extractSetScore(tick({
        score: {
            sets: [{ home: 6, away: 4 }],
            totalSetsHome: 1,
            totalSetsAway: 0
        }
    }));
    assert(
        'T10-sets',
        setScore?.sets?.length === 1 && setScore?.totalHome === 1 && setScore?.totalAway === 0,
        JSON.stringify(setScore)
    );
}

{
    const thirtyAll = detectScoreMarkerTypes('30-30');
    assert('T11-thirty-all', thirtyAll.includes('THIRTY_ALL') && thirtyAll.includes('PRESSURE_POINT'));

    const deuce = detectScoreMarkerTypes('40-40');
    assert('T12-deuce', deuce.includes('DEUCE') && deuce.includes('PRESSURE_POINT'));

    assert('T13-advantage-pressure', detectScoreMarkerTypes('A-40').includes('PRESSURE_POINT'));
    assert('T14-invalid-score', detectScoreMarkerTypes('12-99').length === 0);
}

{
    assert('T15-game-point', detectServerMarkerTypes('40-30', 'home').includes('GAME_POINT'));

    const breakPoint = detectServerMarkerTypes('30-40', 'home');
    assert('T16-break-point', breakPoint.includes('BREAK_POINT') && breakPoint.includes('PRESSURE_POINT'));

    assert('T17-away-game-point', detectServerMarkerTypes('30-A', 'away').includes('GAME_POINT'));
    assert('T18-missing-server', detectServerMarkerTypes('30-40', null).length === 0);
}

{
    assert('T19-game-phase-deuce', inferGamePhase('40-40', ['DEUCE']) === 'deuce');
    assert('T20-game-phase-break', inferGamePhase('30-40', ['BREAK_POINT']) === 'break_point');
    assert('T21-game-phase-mid', inferGamePhase('30-15', []) === 'mid_game');
    assert('T22-game-phase-early', inferGamePhase('15-0', []) === 'early_game');
}

{
    assert('T23-set-phase-unknown', inferSetPhase(tick({ score: {} })) === 'unknown');
    assert('T24-set-phase-early', inferSetPhase(tick({ score: { games: { home: 2, away: 2 }, point: '15-0' } })) === 'early_set');
    assert('T25-set-phase-mid', inferSetPhase(tick({ score: { games: { home: 5, away: 3 }, point: '15-0' } })) === 'mid_set');
    assert('T26-set-phase-tiebreak', inferSetPhase(tick({ score: { games: { home: 6, away: 6 }, point: '0-0' } })) === 'tiebreak');
    assert('T27-set-phase-late', inferSetPhase(tick({ score: { games: { home: 6, away: 4 }, point: '15-0' } })) === 'late_set');
}

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);
if (failed > 0) process.exit(1);
