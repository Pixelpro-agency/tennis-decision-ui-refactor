import {
    buildBetfairIdentitySignature,
    buildSourceIdentity,
    namesMatch,
    normalizeName,
    selectActiveBetfairMarketEpoch
} from '../sourceIdentity.js';

let passed = 0;

export function assert(condition, message) {
    if (!condition) throw new Error(message);
    passed += 1;
}

export function makeSofaTick(homeName, awayName, timestamp = '2026-06-21T12:00:00.000Z') {
    return {
        timestamp,
        data: {
            source: 'sofa',
            seq: 1,
            players: {
                home: { name: homeName },
                away: { name: awayName }
            }
        }
    };
}

export function makeBetfairTick({
    timestamp = '2026-06-21T12:00:00.000Z',
    seq = 1,
    marketId = '1.100',
    marketKey = 'tennis-market',
    runners = []
} = {}) {
    return {
        timestamp,
        data: {
            source: 'betfair',
            seq,
            marketKey,
            market: { marketId, totalMatched: 1000 },
            runners: runners.map((runner, index) => ({
                name: runner.name,
                selectionId: runner.selectionId ?? index + 1
            }))
        }
    };
}

export function finish(scope = 'modular test') {
    console.log(`${scope}: ${passed} assertions passed`);
}

export function makeUnsignedBetfairTick(options = {}) {
    const tick = makeBetfairTick(options);
    delete tick.data.market.marketId;
    delete tick.data.marketKey;
    tick.data.runners.forEach(runner => delete runner.selectionId);
    return tick;
}
