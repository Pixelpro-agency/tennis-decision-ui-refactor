import { extractSofaScoreSnapshot, diffSofaScoreSnapshots } from './snapshot.js';

function assert(condition, message) {
    if (!condition) throw new Error(message);
}

const empty = extractSofaScoreSnapshot(null);
assert(empty.point === null, 'empty point');
assert(empty.gamesHome === null, 'empty games home');
assert(empty.server === null, 'empty server');

const snapshot = extractSofaScoreSnapshot({
    data: {
        score: {
            point: '40-30',
            games: { home: 3, away: 2 },
            totalSetsHome: 1,
            totalSetsAway: 0
        },
        serving: 'away',
        status: { type: 'inprogress', description: 'Set 2' }
    }
});

assert(snapshot.point === '40-30', 'point mapping');
assert(snapshot.gamesHome === 3, 'games home mapping');
assert(snapshot.gamesAway === 2, 'games away mapping');
assert(snapshot.totalSetsHome === 1, 'sets home mapping');
assert(snapshot.server === 'away', 'server mapping');
assert(snapshot.statusType === 'inprogress', 'status type mapping');

const noDiff = diffSofaScoreSnapshots(null, null);
assert(noDiff.scoreChanged === false, 'null score unchanged');
assert(noDiff.serverChanged === false, 'null server unchanged');

const changed = diffSofaScoreSnapshots(
    { point: '30-30', gamesHome: 2, gamesAway: 2, totalSetsHome: 1, totalSetsAway: 0, server: 'home', statusType: 'inprogress', statusDescription: 'Set 2' },
    { point: '40-30', gamesHome: 2, gamesAway: 2, totalSetsHome: 1, totalSetsAway: 0, server: 'home', statusType: 'inprogress', statusDescription: 'Set 2' }
);

assert(changed.pointChanged === true, 'point changed');
assert(changed.gameChanged === false, 'game unchanged');
assert(changed.setChanged === false, 'set unchanged');
assert(changed.serverChanged === false, 'server unchanged');
assert(changed.scoreChanged === true, 'score changed');
console.log('marketLedObservationEvidence snapshot: 15 assertions passed');
