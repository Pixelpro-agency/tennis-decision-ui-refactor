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
    let requestedSofaEventId = null;
    let requestedBetfairEventId = null;
    let requestedSofaSource = null;
    let requestedBetfairSource = null;

    const result = buildLatestMatchEvidenceFromTimelines({
        eventId: 'integrity-wiring',
        now: new Date('2026-06-21T12:00:05.000Z'),
        sofaTimeline: { timeline: [makeSofaTick('2026-06-21T12:00:00.000Z')] },
        betfairTimeline: null,
        dependencies: {
            getMatchPersistenceIntegrity: (eventId, source) => {
                if (source === 'sofa') {
                    requestedSofaEventId = eventId;
                    requestedSofaSource = source;
                } else {
                    requestedBetfairEventId = eventId;
                    requestedBetfairSource = source;
                }
                return {
                    status: 'no_known_partial',
                    reason: null,
                    source,
                    commitId: null,
                    affectedDocuments: []
                };
            }
        }
    });

    assert(requestedSofaEventId === 'integrity-wiring', 'sofa integrity receives event id');
    assert(requestedSofaSource === 'sofa', 'sofa integrity receives source sofa');
    assert(requestedBetfairEventId === 'integrity-wiring', 'betfair integrity receives event id');
    assert(requestedBetfairSource === 'betfair', 'betfair integrity receives source betfair');
    assert(result.integrity.status === 'no_known_partial', 'no_known_partial top-level status');
    assert(Array.isArray(result.integrity.affectedSources), 'affectedSources is array');
    assert(result.integrity.affectedSources.length === 0, 'no affected sources');
    assert(result.integrity.sources.sofa.status === 'no_known_partial', 'sofa source no_known_partial');
    assert(result.integrity.sources.betfair.status === 'no_known_partial', 'betfair source no_known_partial');
}

{
    const now = new Date('2026-06-21T12:00:05.000Z');
    const result = buildLatestMatchEvidenceFromTimelines({
        eventId: 'partial-betfair',
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
        },
        dependencies: {
            getMatchPersistenceIntegrity: (eventId, source) =>
                source === 'betfair'
                    ? {
                        status: 'partial_persistence',
                        reason: 'pending_commit',
                        source: 'betfair',
                        commitId: 'betfair-commit-1',
                        affectedDocuments: ['history']
                    }
                    : {
                        status: 'no_known_partial',
                        reason: null,
                        source: 'sofa',
                        commitId: null,
                        affectedDocuments: []
                    }
        }
    });

    assert(result.integrity.status === 'partial_persistence', 'partial betfair gives top-level partial');
    assert(
        result.integrity.affectedSources.length === 1 &&
        result.integrity.affectedSources[0] === 'betfair',
        'affectedSources contains betfair'
    );
    assert(result.integrity.sources.betfair.commitId === 'betfair-commit-1', 'betfair commit id preserved');
    assert(result.evidence.dataQuality.persistenceComplete === false, 'persistenceComplete false');
    assert(result.evidence.dataQuality.betfairRecent === true, 'betfair remains technically recent');
    assert(result.evidence.marketEvidence.runners.length === 0, 'market runners blocked by partial persistence');
    assert(result.evidence.marketReactionEvidence.available === false, 'market reactions blocked');
    assert(
        result.evidence.noTradeReasons.includes(
            'Persistence incomplete: canonical cross-source evidence unavailable'
        ),
        'persistence no-trade reason added'
    );
    assert(
        result.evidence.marketReactionEvidence.sourceIdentity.status === 'aligned',
        'source identity effective remains aligned'
    );
}

{
    const now = new Date('2026-06-21T12:00:05.000Z');
    const result = buildLatestMatchEvidenceFromTimelines({
        eventId: 'recovery-sofa',
        now,
        sofaTimeline: {
            timeline: [makeSofaTick('2026-06-21T12:00:00.000Z')]
        },
        betfairTimeline: null,
        dependencies: {
            getMatchPersistenceIntegrity: (eventId, source) =>
                source === 'sofa'
                    ? {
                        status: 'recovery_failed',
                        reason: 'recovery_failed',
                        source: 'sofa',
                        commitId: 'sofa-commit-1',
                        affectedDocuments: ['history', 'timeline']
                    }
                    : {
                        status: 'no_known_partial',
                        reason: null,
                        source: 'betfair',
                        commitId: null,
                        affectedDocuments: []
                    }
        }
    });

    assert(result.integrity.status === 'recovery_failed', 'recovery sofa gives top-level recovery');
    assert(
        result.integrity.affectedSources.length === 1 &&
        result.integrity.affectedSources[0] === 'sofa',
        'affectedSources contains sofa'
    );
    assert(result.integrity.reason === 'recovery_failed', 'top-level reason recovery_failed');
}

finish('latestMatchEvidence/persistence');
