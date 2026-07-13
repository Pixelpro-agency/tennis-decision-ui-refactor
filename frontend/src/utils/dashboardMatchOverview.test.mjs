import assert from 'node:assert/strict';
import { buildDashboardMatchOverview } from './dashboardMatchOverview.js';

function createInput(overrides = {}) {
    return {
        players: {
            home: {
                name: 'Home Player',
                serving: false,
                isServing: false,
                is_serving: false
            },
            away: {
                name: 'Away Player',
                serving: false,
                isServing: false,
                is_serving: false
            }
        },
        score: {
            sets: [],
            point: '',
            games: {
                home: 0,
                away: 0
            },
            totalSetsHome: 0,
            totalSetsAway: 0
        },
        ...overrides
    };
}

const servicePriorityResult = buildDashboardMatchOverview(createInput({
    players: {
        home: {
            name: 'Home Player',
            serving: true,
            isServing: true,
            is_serving: true
        },
        away: {
            name: 'Away Player',
            serving: true,
            isServing: true,
            is_serving: true
        }
    },
    score: {
        sets: [
            { home: 6, away: 4 },
            { home: 2, away: 1 }
        ],
        service: 'away',
        point: '15-30',
        games: {
            home: 2,
            away: 1
        },
        totalSetsHome: 1,
        totalSetsAway: 0
    }
}));

assert.equal(servicePriorityResult.currentSetIndex, 2);
assert.equal(servicePriorityResult.matchOverviewBar.pill.text, '2° Set');
assert.equal(servicePriorityResult.matchOverviewBar.playersInline.isHomeServing, false);
assert.equal(servicePriorityResult.matchOverviewBar.playersInline.isAwayServing, true);
assert.equal(servicePriorityResult.matchOverviewBar.scoreInline.home.set1, 6);
assert.equal(servicePriorityResult.matchOverviewBar.scoreInline.home.set2, 2);
assert.equal(servicePriorityResult.matchOverviewBar.scoreInline.home.set3, '-');
assert.equal(servicePriorityResult.matchOverviewBar.scoreInline.away.set1, 4);
assert.equal(servicePriorityResult.matchOverviewBar.scoreInline.away.set2, 1);
assert.equal(servicePriorityResult.matchOverviewBar.scoreInline.home.totalSets, 1);
assert.equal(servicePriorityResult.matchOverviewBar.scoreInline.away.totalSets, 0);
assert.equal(servicePriorityResult.matchOverviewBar.scoreInline.home.games, 2);
assert.equal(servicePriorityResult.matchOverviewBar.scoreInline.away.games, 1);
assert.equal(servicePriorityResult.matchOverviewBar.scoreInline.home.point, '15');
assert.equal(servicePriorityResult.matchOverviewBar.scoreInline.away.point, '30');

const homeServingResult = buildDashboardMatchOverview(createInput({
    players: {
        home: {
            name: 'Home Player',
            serving: false,
            isServing: true,
            is_serving: false
        },
        away: {
            name: 'Away Player',
            serving: false,
            isServing: false,
            is_serving: false
        }
    }
}));

assert.equal(homeServingResult.matchOverviewBar.playersInline.isHomeServing, true);
assert.equal(homeServingResult.matchOverviewBar.playersInline.isAwayServing, false);

const awayServingResult = buildDashboardMatchOverview(createInput({
    players: {
        home: {
            name: 'Home Player',
            serving: false,
            isServing: false,
            is_serving: false
        },
        away: {
            name: 'Away Player',
            serving: false,
            isServing: false,
            is_serving: true
        }
    }
}));

assert.equal(awayServingResult.matchOverviewBar.playersInline.isHomeServing, false);
assert.equal(awayServingResult.matchOverviewBar.playersInline.isAwayServing, true);

const homeAsteriskResult = buildDashboardMatchOverview(createInput({
    score: {
        sets: [],
        point: '15*-30',
        games: {
            home: 0,
            away: 0
        },
        totalSetsHome: 0,
        totalSetsAway: 0
    }
}));

assert.equal(homeAsteriskResult.matchOverviewBar.playersInline.isHomeServing, true);
assert.equal(homeAsteriskResult.matchOverviewBar.scoreInline.home.point, '15');
assert.equal(homeAsteriskResult.matchOverviewBar.scoreInline.away.point, '30');

const awayAsteriskResult = buildDashboardMatchOverview(createInput({
    score: {
        sets: [],
        point: '15-3*0',
        games: {
            home: 0,
            away: 0
        },
        totalSetsHome: 0,
        totalSetsAway: 0
    }
}));

assert.equal(awayAsteriskResult.matchOverviewBar.playersInline.isAwayServing, true);
assert.equal(awayAsteriskResult.matchOverviewBar.scoreInline.home.point, '15');
assert.equal(awayAsteriskResult.matchOverviewBar.scoreInline.away.point, '30');

const colonResult = buildDashboardMatchOverview(createInput({
    score: {
        sets: [],
        point: '40:AD',
        games: {
            home: 3,
            away: 4
        },
        totalSetsHome: 0,
        totalSetsAway: 0
    }
}));

assert.equal(colonResult.matchOverviewBar.scoreInline.home.point, '40');
assert.equal(colonResult.matchOverviewBar.scoreInline.away.point, 'AD');

const initialResult = buildDashboardMatchOverview(createInput({
    score: {
        sets: [],
        point: 'Punteggio non disponibile',
        games: {
            home: 0,
            away: 0
        },
        totalSetsHome: 0,
        totalSetsAway: 0
    }
}));

assert.equal(initialResult.currentSetIndex, 0);
assert.equal(initialResult.matchOverviewBar.pill.text, 'Inizio Match');
assert.equal(initialResult.matchOverviewBar.scoreInline.home.point, '0');
assert.equal(initialResult.matchOverviewBar.scoreInline.away.point, '0');

console.log('dashboardMatchOverview tests passed');