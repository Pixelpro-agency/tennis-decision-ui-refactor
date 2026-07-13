import assert from 'node:assert/strict';
import {
    buildKeyStatsRows,
    buildKeyStatsTabs,
    mapDashboardStatsToRows,
    parseDashboardStatValue
} from './dashboardStats.js';

assert.equal(parseDashboardStatValue(7), 7);
assert.equal(parseDashboardStatValue('10/18 (56%)'), 10);
assert.equal(parseDashboardStatValue('56%'), 56);
assert.equal(parseDashboardStatValue('12'), 12);
assert.equal(parseDashboardStatValue('non disponibile'), 0);
assert.equal(parseDashboardStatValue(null), 0);

assert.deepEqual(mapDashboardStatsToRows(null), []);

const mappedRows = mapDashboardStatsToRows([
    {
        label: 'Aces',
        home: '10/18 (56%)',
        away: 5
    },
    {
        label: 'Break points',
        home: 0,
        away: 0
    },
    {
        label: 'First serve',
        home: 3,
        away: 7
    }
]);

assert.deepEqual(mappedRows, [
    {
        key: 'stat-0',
        label: 'ACES',
        homeValue: '10/18 (56%)',
        awayValue: 5,
        bar: {
            type: 'comparison',
            homeShare: 67,
            awayShare: 33,
            highlight: 'home'
        }
    },
    {
        key: 'stat-1',
        label: 'BREAK POINTS',
        homeValue: 0,
        awayValue: 0,
        bar: {
            type: 'comparison',
            homeShare: 50,
            awayShare: 50,
            highlight: null
        }
    },
    {
        key: 'stat-2',
        label: 'FIRST SERVE',
        homeValue: 3,
        awayValue: 7,
        bar: {
            type: 'comparison',
            homeShare: 30,
            awayShare: 70,
            highlight: 'away'
        }
    }
]);

const keyStatsRows = buildKeyStatsRows({
    match: [
        {
            label: 'Aces',
            home: 1,
            away: 2
        }
    ],
    set1: [
        {
            label: 'Aces',
            home: 1,
            away: 0
        }
    ],
    set3: [
        {
            label: 'Aces',
            home: 0,
            away: 1
        }
    ]
});

assert.equal(keyStatsRows.total.length, 1);
assert.equal(keyStatsRows.set_1.length, 1);
assert.equal(keyStatsRows.set_2.length, 0);
assert.equal(keyStatsRows.set_3.length, 1);
assert.equal(keyStatsRows.set_4.length, 0);
assert.equal(keyStatsRows.set_5.length, 0);

assert.deepEqual(buildKeyStatsTabs(keyStatsRows), [
    {
        id: 'total',
        label: 'TOTALE',
        active: true
    },
    {
        id: 'set_1',
        label: 'SET 1',
        active: false
    },
    {
        id: 'set_3',
        label: 'SET 3',
        active: false
    }
]);

const arrayStatsRows = buildKeyStatsRows([
    {
        label: 'Aces',
        home: 4,
        away: 2
    }
]);

assert.equal(arrayStatsRows.total.length, 1);
assert.equal(arrayStatsRows.set_1.length, 0);

console.log('dashboardStats tests passed');