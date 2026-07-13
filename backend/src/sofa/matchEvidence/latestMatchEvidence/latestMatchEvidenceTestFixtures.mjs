import {
    buildLatestMatchEvidence,
    buildLatestMatchEvidenceFromTimelines,
    buildSourceIdentityConfirmationStateFromTimelines
} from '../latestMatchEvidence.js';
import {
    CONFIRMATION_PHRASE,
    MANUAL_CONFIRMATION_APPLIED_REASON,
    validateManualConfirmation
} from '../sourceIdentityConfirmation.js';

let passed = 0;

export function assert(condition, message) {
    if (!condition) throw new Error(message);
    passed += 1;
}

export function makeSofaTick(timestamp, homeName = 'Lorenzo Sonego', awayName = 'Miomir Kecmanovi\u{0107}', seq = 1) {
    return {
        timestamp,
        data: {
            source: 'sofa',
            seq,
            serving: 'home',
            score: {
                point: '30-0',
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

export function makeBetfairTick({
    timestamp,
    seq,
    marketId,
    marketKey,
    runners,
    totalMatched
}) {
    return {
        timestamp,
        data: {
            source: 'betfair',
            seq,
            marketKey,
            graphHealth: { status: 'ok' },
            market: { marketId, totalMatched },
            runners: runners.map(runner => ({
                name: runner.name,
                selectionId: runner.selectionId,
                lastTradedPrice: runner.lastTradedPrice,
                bestBack: runner.lastTradedPrice - 0.01,
                bestLay: runner.lastTradedPrice + 0.01,
                matchedTotal: runner.matchedTotal ?? totalMatched / 2,
                ladderSource: 'graph',
                ladder: [{ price: runner.lastTradedPrice, back: 10, lay: 10, traded: 10 }],
                moneyFlow: {
                    back: runner.back ?? 0,
                    lay: runner.lay ?? 0,
                    trend: runner.trend ?? 'neutral',
                    runnerDelta: runner.runnerDelta ?? 0,
                    marketDelta: runner.marketDelta ?? 0,
                    confidence: 'confirmed',
                    reason: null
                }
            }))
        }
    };
}

export function finish(scope = 'modular test') {
    console.log(`${scope}: ${passed} assertions passed`);
}

export function makeManualPendingTimelines({
    marketId = 'manual-market',
    selectionIds = [301, 302],
    runners = ['OConnell', 'Smith']
} = {}) {
    return {
        sofaTimeline: {
            timeline: [
                makeSofaTick(
                    '2026-06-21T12:00:00.000Z',
                    'O Connell',
                    'Alice Smith'
                )
            ]
        },
        betfairTimeline: {
            timeline: [
                makeBetfairTick({
                    timestamp: '2026-06-21T12:00:00.000Z',
                    seq: 1,
                    marketId,
                    marketKey: 'manual-market-key',
                    totalMatched: 2000,
                    runners: [
                        {
                            name: runners[0],
                            selectionId: selectionIds[0],
                            lastTradedPrice: 1.95
                        },
                        {
                            name: runners[1],
                            selectionId: selectionIds[1],
                            lastTradedPrice: 2.05
                        }
                    ]
                })
            ]
        }
    };
}

export function buildManualPendingConfirmation(eventId, sofaTimeline, betfairTimeline) {
    const state = buildSourceIdentityConfirmationStateFromTimelines({
        eventId,
        sofaTimeline,
        betfairTimeline
    });

    const validation = validateManualConfirmation({
        confirmationText: CONFIRMATION_PHRASE,
        sourceIdentity: state.automaticSourceIdentity,
        context: state.confirmationContext,
        selectedPairs: [
            { sofaPlayer: 'O Connell', betfairRunner: 'OConnell' },
            { sofaPlayer: 'Alice Smith', betfairRunner: 'Smith' }
        ]
    });

    assert(state.automaticSourceIdentity.status === 'pending', 'manual confirmation fixture starts pending');
    assert(validation.ok === true, 'manual confirmation fixture is valid');

    return validation.record;
}
