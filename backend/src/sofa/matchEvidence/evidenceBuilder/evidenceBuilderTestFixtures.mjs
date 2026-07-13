import { buildEvidenceFromTicks } from '../evidenceBuilder.js';
import { buildSourceIdentity, createPendingSourceIdentity } from '../sourceIdentity.js';

let passed = 0;

export function assert(condition, message) {
    if (!condition) throw new Error(message);
    passed += 1;
}

export const now = new Date('2026-06-21T12:00:40.000Z');

export function makeSofaTick(timestamp, homeName = 'Alice Smith', awayName = 'Bob Jones', point = '30-0', seq = 1) {
    return {
        timestamp,
        data: {
            source: 'sofa',
            seq,
            serving: 'home',
            score: {
                point,
                games: { home: 2, away: 1 },
                totalSetsHome: 0,
                totalSetsAway: 0
            },
            status: { type: 'inprogress', description: 'In progress' },
            players: {
                home: { name: homeName },
                away: { name: awayName }
            }
        }
    };
}

export function makeBetfairTick(timestamp, seq, alicePrice, totalMatched, aliceFlow = 0, aliceTrend = 'neutral', names = ['Alice Smith', 'Bob Jones']) {
    return {
        timestamp,
        data: {
            source: 'betfair',
            seq,
            marketKey: 'market-b',
            graphHealth: { status: 'ok' },
            market: { marketId: 'B', totalMatched },
            runners: [
                {
                    name: names[0],
                    selectionId: 1,
                    lastTradedPrice: alicePrice,
                    bestBack: alicePrice - 0.01,
                    bestLay: alicePrice + 0.01,
                    matchedTotal: totalMatched / 2,
                    ladderSource: 'graph',
                    ladder: [{ price: alicePrice, back: 10, lay: 10, traded: 10 }],
                    moneyFlow: {
                        back: aliceFlow,
                        lay: 0,
                        trend: aliceTrend,
                        runnerDelta: aliceFlow,
                        marketDelta: aliceFlow,
                        confidence: 'confirmed',
                        reason: null
                    }
                },
                {
                    name: names[1],
                    selectionId: 2,
                    lastTradedPrice: 2.1,
                    bestBack: 2.09,
                    bestLay: 2.11,
                    matchedTotal: totalMatched / 2,
                    ladderSource: 'graph',
                    ladder: [{ price: 2.1, back: 10, lay: 10, traded: 10 }],
                    moneyFlow: {
                        back: 0,
                        lay: 0,
                        trend: 'neutral',
                        runnerDelta: 0,
                        marketDelta: 0,
                        confidence: 'confirmed',
                        reason: null
                    }
                }
            ]
        }
    };
}

export const sofaBefore = makeSofaTick('2026-06-21T12:00:00.000Z', 'Alice Smith', 'Bob Jones', '30-0', 1);
export const sofaAfter = makeSofaTick('2026-06-21T12:00:30.000Z', 'Alice Smith', 'Bob Jones', '40-0', 2);
export const betfairBefore = makeBetfairTick('2026-06-21T12:00:00.000Z', 1, 1.8, 5000, 100, 'back');
export const betfairAfter = makeBetfairTick('2026-06-21T12:00:30.000Z', 2, 1.7, 6200, 1200, 'back');
export const alignedIdentity = buildSourceIdentity({
    sofaTick: sofaAfter,
    betfairTick: betfairAfter
});

export function finish(scope = 'modular test') {
    console.log(`${scope}: ${passed} assertions passed`);
}
