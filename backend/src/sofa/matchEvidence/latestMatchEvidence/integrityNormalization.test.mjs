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
    const result = buildLatestMatchEvidenceFromTimelines({
        eventId: 'malformed-integrity',
        now: new Date('2026-06-21T12:00:05.000Z'),
        sofaTimeline: { timeline: [makeSofaTick('2026-06-21T12:00:00.000Z')] },
        betfairTimeline: null,
        dependencies: {
            getMatchPersistenceIntegrity: () => ({ status: 'garbage', affectedDocuments: 'not-array' })
        }
    });

    assert(result.integrity.status === 'no_known_partial', 'malformed integrity normalizes to no_known_partial');
    assert(Array.isArray(result.integrity.sources.sofa.affectedDocuments), 'affectedDocuments normalized to array');
}

{
    const result = buildLatestMatchEvidenceFromTimelines({
        eventId: 'strict-sofa-source',
        now: new Date('2026-06-21T12:00:05.000Z'),
        sofaTimeline: { timeline: [makeSofaTick('2026-06-21T12:00:00.000Z')] },
        betfairTimeline: null,
        dependencies: {
            getMatchPersistenceIntegrity: (eventId, source) =>
                source === 'sofa'
                    ? {
                        status: 'partial_persistence',
                        reason: 'pending_commit',
                        source: 'betfair',
                        commitId: 'sofa-commit-strict',
                        affectedDocuments: ['history', 'timeline', 'secret', 'other']
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

    assert(result.integrity.sources.sofa.source === null, 'sofa branch rejects betfair source');
    assert(result.integrity.sources.betfair.source === null, 'betfair branch rejects sofa source');
    assert(
        JSON.stringify(result.integrity.sources.sofa.affectedDocuments) ===
        JSON.stringify(['history', 'timeline']),
        'sofa branch filters affectedDocuments'
    );
}

{
    const result = buildLatestMatchEvidenceFromTimelines({
        eventId: 'strict-betfair-source',
        now: new Date('2026-06-21T12:00:05.000Z'),
        sofaTimeline: { timeline: [makeSofaTick('2026-06-21T12:00:00.000Z')] },
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
                        source: 'sofa',
                        commitId: 'betfair-commit-strict',
                        affectedDocuments: ['history', 'timeline', 'other']
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

    assert(result.integrity.sources.betfair.source === null, 'betfair branch rejects sofa source');
    assert(
        JSON.stringify(result.integrity.sources.betfair.affectedDocuments) ===
        JSON.stringify(['history', 'timeline']),
        'betfair branch filters affectedDocuments'
    );
}

{
    const result = buildLatestMatchEvidenceFromTimelines({
        eventId: 'strict-non-array-affected',
        now: new Date('2026-06-21T12:00:05.000Z'),
        sofaTimeline: { timeline: [makeSofaTick('2026-06-21T12:00:00.000Z')] },
        betfairTimeline: null,
        dependencies: {
            getMatchPersistenceIntegrity: (eventId, source) =>
                source === 'sofa'
                    ? {
                        status: 'partial_persistence',
                        reason: 'pending_commit',
                        source: 'sofa',
                        commitId: 'sofa-commit-affected',
                        affectedDocuments: 'not-array'
                    }
                    : {
                        status: 'no_known_partial',
                        reason: null,
                        source: 'betfair',
                        commitId: null,
                        affectedDocuments: 'not-array'
                    }
        }
    });

    assert(
        JSON.stringify(result.integrity.sources.sofa.affectedDocuments) ===
        JSON.stringify([]),
        'sofa branch non-array affectedDocuments defaults to empty array'
    );
    assert(
        JSON.stringify(result.integrity.sources.betfair.affectedDocuments) ===
        JSON.stringify([]),
        'betfair branch non-array affectedDocuments defaults to empty array'
    );
}

finish('latestMatchEvidence/normalization');
