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
    const now = new Date('2026-06-21T12:00:05.000Z');
    const eventId = 'synthetic-manual-confirmation';
    const { sofaTimeline, betfairTimeline } = makeManualPendingTimelines();
    const confirmation = buildManualPendingConfirmation(eventId, sofaTimeline, betfairTimeline);
    const rawBefore = JSON.stringify({ sofaTimeline, betfairTimeline });

    const result = buildLatestMatchEvidenceFromTimelines({
        eventId,
        sofaTimeline,
        betfairTimeline,
        now,
        confirmationRecord: confirmation
    });

    const identity = result.evidence.marketReactionEvidence.sourceIdentity;

    assert(identity.status === 'aligned', 'valid pending confirmation applies within the same epoch');
    assert(
        identity.reasons.includes(MANUAL_CONFIRMATION_APPLIED_REASON),
        'manual application reason is present after application'
    );
    assert(
        identity.normalizedPairs.some(pair =>
            pair.sofaPlayer === 'O Connell' &&
            pair.betfairRunner === 'OConnell' &&
            pair.match === true
        ),
        'effective identity exposes confirmed mapping'
    );
    assert(result.evidence.marketReactionEvidence.available === true, 'effective aligned identity enables Market Reactions');
    assert(result.evidence.marketReactionEvidence.summary.causalityClaimed === false, 'manual confirmation does not enable causality');
    assert(JSON.stringify({ sofaTimeline, betfairTimeline }) === rawBefore, 'manual confirmation does not mutate raw timelines');

    const changedMarket = makeManualPendingTimelines({ marketId: 'manual-market-next' });
    const changedMarketResult = buildLatestMatchEvidenceFromTimelines({
        eventId,
        ...changedMarket,
        now,
        confirmationRecord: confirmation
    });

    assert(
        changedMarketResult.evidence.marketReactionEvidence.sourceIdentity.status === 'pending',
        'market change prevents previous confirmation application'
    );
    assert(
        !changedMarketResult.evidence.marketReactionEvidence.sourceIdentity.reasons.includes(
            MANUAL_CONFIRMATION_APPLIED_REASON
        ),
        'market change has no manual application reason'
    );

    const changedSelectionIds = makeManualPendingTimelines({ selectionIds: [401, 402] });
    const changedSelectionResult = buildLatestMatchEvidenceFromTimelines({
        eventId,
        ...changedSelectionIds,
        now,
        confirmationRecord: confirmation
    });

    assert(
        changedSelectionResult.evidence.marketReactionEvidence.sourceIdentity.status === 'pending',
        'selection id change prevents previous confirmation application'
    );

    const changedRunner = makeManualPendingTimelines({ runners: ['OConnell', 'Jones'] });
    const changedRunnerResult = buildLatestMatchEvidenceFromTimelines({
        eventId,
        ...changedRunner,
        now,
        confirmationRecord: confirmation
    });

    assert(
        changedRunnerResult.evidence.marketReactionEvidence.sourceIdentity.status === 'pending',
        'runner change prevents previous confirmation application'
    );
    assert(changedRunnerResult.evidence.marketReactionEvidence.available === false, 'non-applied confirmation keeps Market Reactions suspended');

    const mismatchTimeline = {
        sofaTimeline: {
            timeline: [makeSofaTick('2026-06-21T12:00:00.000Z')]
        },
        betfairTimeline: {
            timeline: [
                makeBetfairTick({
                    timestamp: '2026-06-21T12:00:00.000Z',
                    seq: 1,
                    marketId: 'manual-market',
                    marketKey: 'manual-market-key',
                    totalMatched: 2000,
                    runners: [
                        { name: 'Jan-Lennard Struff', selectionId: 301, lastTradedPrice: 1.95 },
                        { name: 'Nuno Borges', selectionId: 302, lastTradedPrice: 2.05 }
                    ]
                })
            ]
        }
    };

    const mismatchResult = buildLatestMatchEvidenceFromTimelines({
        eventId,
        ...mismatchTimeline,
        now,
        confirmationRecord: confirmation
    });

    assert(
        mismatchResult.evidence.marketReactionEvidence.sourceIdentity.status === 'mismatch',
        'mismatch ignores any previous manual confirmation'
    );
    assert(
        !mismatchResult.evidence.marketReactionEvidence.sourceIdentity.reasons.includes(
            MANUAL_CONFIRMATION_APPLIED_REASON
        ),
        'mismatch never carries manual application reason'
    );
    assert(mismatchResult.evidence.marketReactionEvidence.available === false, 'mismatch keeps Market Reactions suspended');
}

finish('latestMatchEvidence/manual');
