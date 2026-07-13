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
import {
    assert,
    buildManualPendingConfirmation,
    finish,
    makeBetfairTick,
    makeManualPendingTimelines,
    makeSofaTick
} from './latestMatchEvidenceTestFixtures.mjs';

{
    const result = buildLatestMatchEvidence('__match_evidence_loader_missing__', {
        now: new Date('2026-06-21T00:00:00.000Z')
    });

    assert(result && typeof result === 'object', 'missing result contract');
    assert(result.ok === false, 'missing result is not ok');
    assert(result.missing === true, 'missing flag is true');
    assert(Array.isArray(result.reasons), 'missing reasons array');
    assert(result.reasons.includes('SofaScore timeline missing'), 'SofaScore missing reason');
    assert(result.reasons.includes('Betfair timeline missing'), 'Betfair missing reason');
}

{
    const now = new Date('2026-06-21T12:00:05.000Z');
    const sofaTimeline = {
        metadata: {
            players: { home: 'Lorenzo Sonego', away: 'Miomir KecmanoviÄ‡' },
            tournament: 'Synthetic'
        },
        timeline: [
            makeSofaTick('2026-06-21T12:00:00.000Z')
        ]
    };

    const betfairTimeline = {
        metadata: {
            players: { home: 'Jan-Lennard Struff', away: 'Nuno Borges' },
            tournament: 'Wrong metadata must not decide identity'
        },
        timeline: [
            makeBetfairTick({
                timestamp: '2026-06-21T11:59:00.000Z',
                seq: 1,
                marketId: 'A',
                marketKey: 'market-a',
                totalMatched: 5000,
                runners: [
                    {
                        name: 'Jan-Lennard Struff',
                        selectionId: 1,
                        lastTradedPrice: 3.5,
                        back: 1500,
                        runnerDelta: 1500,
                        marketDelta: 1500,
                        trend: 'back'
                    },
                    {
                        name: 'Nuno Borges',
                        selectionId: 2,
                        lastTradedPrice: 1.35
                    }
                ]
            }),
            makeBetfairTick({
                timestamp: '2026-06-21T11:59:40.000Z',
                seq: 2,
                marketId: 'B',
                marketKey: 'market-b',
                totalMatched: 1000,
                runners: [
                    { name: 'Sonego', selectionId: 1, lastTradedPrice: 2.05 },
                    { name: 'Kecmanovic', selectionId: 2, lastTradedPrice: 1.95 }
                ]
            }),
            makeBetfairTick({
                timestamp: '2026-06-21T12:00:00.000Z',
                seq: 3,
                marketId: 'B',
                marketKey: 'market-b',
                totalMatched: 1020,
                runners: [
                    {
                        name: 'Sonego',
                        selectionId: 1,
                        lastTradedPrice: 1.95,
                        back: 20,
                        runnerDelta: 20,
                        marketDelta: 20,
                        trend: 'back'
                    },
                    { name: 'Kecmanovic', selectionId: 2, lastTradedPrice: 2.05 }
                ]
            })
        ]
    };

    const rawBefore = JSON.stringify(betfairTimeline);
    const result = buildLatestMatchEvidenceFromTimelines({
        eventId: 'synthetic-epoch',
        sofaTimeline,
        betfairTimeline,
        now
    });

    const evidence = result.evidence;
    const marketRunnerNames = evidence.marketEvidence.runners.map(runner => runner.name);
    const sonego = evidence.marketEvidence.runners.find(runner => runner.name === 'Sonego');

    assert(result.ok === true, 'synthetic loader result is ok');
    assert(
        evidence.marketReactionEvidence.sourceIdentity.status === 'aligned',
        'second epoch aligns with SofaScore'
    );
    assert(
        evidence.marketReactionEvidence.sourceIdentity.reasons.includes(
            'Historical Betfair market epoch excluded after market identity changed'
        ),
        'identity carries historical epoch diagnostic'
    );
    assert(!marketRunnerNames.includes('Jan-Lennard Struff'), 'wrong market runner is not in latest market evidence');
    assert(sonego?.flowEvidence?.priceMove?.fromPrice === 2.05, 'lookback uses active epoch rather than historical market');
    assert(
        !JSON.stringify(evidence.marketReactionEvidence).includes('Jan-Lennard Struff'),
        'wrong market is not passed to Market Reactions'
    );
    assert(JSON.stringify(betfairTimeline) === rawBefore, 'raw Betfair timeline is not mutated');
}

{
    const now = new Date('2026-06-21T12:00:05.000Z');
    const result = buildLatestMatchEvidenceFromTimelines({
        eventId: 'synthetic-mismatch',
        now,
        sofaTimeline: {
            timeline: [makeSofaTick('2026-06-21T12:00:00.000Z')]
        },
        betfairTimeline: {
            timeline: [
                makeBetfairTick({
                    timestamp: '2026-06-21T12:00:00.000Z',
                    seq: 1,
                    marketId: 'B',
                    marketKey: 'market-b',
                    totalMatched: 2000,
                    runners: [
                        { name: 'Jan-Lennard Struff', selectionId: 1, lastTradedPrice: 2.1 },
                        { name: 'Nuno Borges', selectionId: 2, lastTradedPrice: 1.8 }
                    ]
                })
            ]
        }
    });

    assert(
        result.evidence.marketReactionEvidence.sourceIdentity.status === 'mismatch',
        'incompatible final epoch is mismatch'
    );
    assert(result.evidence.marketEvidence.runners.length === 0, 'mismatched market runners are not attributed');
    assert(result.evidence.marketReactionEvidence.available === false, 'cross-source Market Reactions are suspended');
    assert(
        result.evidence.noTradeReasons.includes('Source identity mismatch: cross-source observations unavailable'),
        'mismatch reason is added to no-trade reasons'
    );
    assert(result.evidence.dataQuality.betfairRecent === true, 'fresh mismatched Betfair tick remains technically recent');
    assert(
        !result.evidence.dataQuality.reasons.includes('Betfair timeline missing'),
        'fresh mismatched Betfair tick is not reported as missing'
    );
    assert(
        !result.evidence.noTradeReasons.includes('Betfair tick too old or missing'),
        'fresh mismatched Betfair tick does not add stale-or-missing reason'
    );
}

{
    const now = new Date('2026-06-21T12:00:05.000Z');
    const result = buildLatestMatchEvidenceFromTimelines({
        eventId: 'synthetic-one-tick-epoch',
        now,
        sofaTimeline: {
            timeline: [makeSofaTick('2026-06-21T12:00:00.000Z')]
        },
        betfairTimeline: {
            timeline: [
                makeBetfairTick({
                    timestamp: '2026-06-21T12:00:00.000Z',
                    seq: 1,
                    marketId: 'B',
                    marketKey: 'market-b',
                    totalMatched: 2000,
                    runners: [
                        { name: 'Sonego', selectionId: 1, lastTradedPrice: 1.95 },
                        { name: 'Kecmanovic', selectionId: 2, lastTradedPrice: 2.05 }
                    ]
                })
            ]
        }
    });

    assert(
        result.evidence.marketReactionEvidence.sourceIdentity.status === 'aligned',
        'one signed Betfair tick can align with SofaScore'
    );
    assert(result.evidence.dataQuality.betfairRecent === true, 'one signed Betfair tick is technically recent');
    assert(result.evidence.marketEvidence.runners.length === 2, 'one signed epoch retains attributed runners');
}

{
    const now = new Date('2026-06-21T12:00:05.000Z');
    const result = buildLatestMatchEvidenceFromTimelines({
        eventId: 'synthetic-sofa-only',
        now,
        sofaTimeline: {
            timeline: [makeSofaTick('2026-06-21T12:00:00.000Z')]
        },
        betfairTimeline: null
    });

    assert(result.ok === true, 'Sofa-only evidence remains available');
    assert(result.sources.betfairTimelineFound === false, 'Sofa-only source state is retained');
    assert(
        result.evidence.marketReactionEvidence.sourceIdentity.status === 'pending',
        'Sofa-only source identity is pending'
    );
    assert(
        result.evidence.dataQuality.reasons.includes('Betfair timeline missing'),
        'real Sofa-only case reports missing Betfair timeline'
    );
    assert(
        result.evidence.noTradeReasons.includes('Betfair tick too old or missing'),
        'real Sofa-only case keeps Betfair missing no-trade reason'
    );
}

finish('latestMatchEvidence/loading');
