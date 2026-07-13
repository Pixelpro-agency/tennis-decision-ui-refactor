import { getLatestSofaTick, getRecentSofaTicks } from './timeline.js';

function assert(condition, message) {
    if (!condition) throw new Error(message);
}

assert(Array.isArray(getRecentSofaTicks(null, 10)) && getRecentSofaTicks(null, 10).length === 0, 'empty recent');
assert(getLatestSofaTick(null) === null, 'empty latest');

const mixedTimeline = {
    timeline: [
        { id: 'b1', data: { source: 'betfair' } },
        { id: 's1', data: { source: 'sofa' } },
        { id: 'b2', data: { source: 'betfair' } },
        { id: 's2', data: { source: 'sofa' } }
    ]
};

const recent = getRecentSofaTicks(mixedTimeline, 10);
assert(recent.length === 2, 'filters Sofa ticks');
assert(recent[0].id === 's1' && recent[1].id === 's2', 'preserves Sofa order');
assert(getRecentSofaTicks(mixedTimeline, 1)[0].id === 's2', 'limits recent Sofa ticks');
assert(getLatestSofaTick(mixedTimeline).id === 's2', 'selects latest Sofa tick');

const noSofaTimeline = {
    timeline: [
        { id: 'b1', data: { source: 'betfair' } },
        { id: 'b2', data: { source: 'betfair' } }
    ]
};

assert(getRecentSofaTicks(noSofaTimeline, 10).length === 0, 'no Sofa recent ticks');
assert(getLatestSofaTick(noSofaTimeline).id === 'b2', 'falls back to latest entry');
console.log('matchEvidence timeline: 8 assertions passed');
