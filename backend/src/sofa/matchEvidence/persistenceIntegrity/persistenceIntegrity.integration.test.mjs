import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { createCommitJournalStore } from '../../matchHistory/commitJournal.js';
import { buildSofaTimelineResponse } from '../../../routes/match/readResponses.js';
import { buildBetfairJsonResponse } from '../../../routes/betfair/latestPayload.js';
import { buildLatestMatchEvidenceFromTimelines } from '../latestMatchEvidence.js';
import {
    PERSISTENCE_INCOMPLETE_REASON,
    buildBetfairTimelineOnly,
    buildSofaTimelineOnly,
    createIntegrationFixture,
    finish,
    makeBetfairTick,
    makeIntegrityAdapter,
    makeJournalRecord,
    makeSofaTick,
    makeTempRoot,
    test
} from './persistenceIntegrityTestFixtures.mjs';

await test('S01-sofa-partial-timeline-missing-api-match-409', async () => {
    const fixture = createIntegrationFixture();

    try {
        fixture.writeJournal('sofa-partial-1', makeJournalRecord({
            commitId: 'sofa-partial-1',
            eventId: 'integration-sofa-partial',
            source: 'sofa',
            historyCompleted: true,
            timelineCompleted: false
        }));

        const response = buildSofaTimelineResponse(
            'integration-sofa-partial',
            {
                loadTimeline: () => null,
                getMatchPersistenceIntegrity: makeIntegrityAdapter(fixture.journalStore)
            }
        );

        assert.equal(response.httpStatus, 409, 'Match API returns 409');
        assert.equal(response.body.error, 'persistence_integrity', 'Match API error is persistence_integrity');
        assert.equal(response.body.integrity.status, 'partial_persistence', 'Match API integrity status');
        assert.equal(response.body.integrity.source, 'sofa', 'Match API integrity source');
        assert.ok(
            Array.isArray(response.body.integrity.affectedDocuments) &&
            response.body.integrity.affectedDocuments.includes('timeline'),
            'Match API affectedDocuments includes timeline'
        );
    } finally {
        fixture.cleanup();
    }
});

await test('S01b-sofa-partial-evidence-persistence-incomplete', async () => {
    const fixture = createIntegrationFixture();

    try {
        fixture.writeJournal('sofa-partial-1', makeJournalRecord({
            commitId: 'sofa-partial-1',
            eventId: 'integration-sofa-partial',
            source: 'sofa',
            historyCompleted: true,
            timelineCompleted: false
        }));

        const result = buildLatestMatchEvidenceFromTimelines({
            eventId: 'integration-sofa-partial',
            now: new Date('2026-07-09T12:00:05.000Z'),
            sofaTimeline: buildSofaTimelineOnly(),
            betfairTimeline: buildBetfairTimelineOnly(),
            dependencies: {
                getMatchPersistenceIntegrity: makeIntegrityAdapter(fixture.journalStore)
            }
        });

        assert.equal(result.integrity.status, 'partial_persistence', 'Evidence top-level integrity status');
        assert.ok(
            result.integrity.affectedSources.includes('sofa'),
            'Evidence affectedSources includes sofa'
        );
        assert.equal(result.evidence.dataQuality.persistenceComplete, false, 'Evidence persistenceComplete false');
        assert.ok(
            result.evidence.noTradeReasons.includes(PERSISTENCE_INCOMPLETE_REASON),
            'Evidence noTradeReasons includes persistence incomplete reason'
        );

        const persistenceReasonCount = result.evidence.noTradeReasons.filter(
            reason => reason === PERSISTENCE_INCOMPLETE_REASON
        ).length;
        assert.equal(persistenceReasonCount, 1, 'Persistence incomplete reason appears exactly once');
    } finally {
        fixture.cleanup();
    }
});

await test('S02-betfair-partial-timeline-missing-api-betfair-409', async () => {
    const fixture = createIntegrationFixture();

    try {
        fixture.writeJournal('betfair-partial-1', makeJournalRecord({
            commitId: 'betfair-partial-1',
            eventId: 'integration-betfair-partial',
            source: 'betfair',
            historyCompleted: true,
            timelineCompleted: false
        }));

        const response = buildBetfairJsonResponse(
            'integration-betfair-partial',
            {
                loadTimeline: () => null,
                getMatchPersistenceIntegrity: makeIntegrityAdapter(fixture.journalStore)
            }
        );

        assert.equal(response.httpStatus, 409, 'Betfair API returns 409');
        assert.equal(response.body.error, 'persistence_integrity', 'Betfair API error is persistence_integrity');
        assert.equal(response.body.integrity.status, 'partial_persistence', 'Betfair API integrity status');
        assert.equal(response.body.integrity.source, 'betfair', 'Betfair API integrity source');
        assert.ok(
            Array.isArray(response.body.integrity.affectedDocuments) &&
            response.body.integrity.affectedDocuments.includes('timeline'),
            'Betfair API affectedDocuments includes timeline'
        );
    } finally {
        fixture.cleanup();
    }
});

await test('S02b-betfair-partial-evidence-cross-source-blocked', async () => {
    const fixture = createIntegrationFixture();

    try {
        fixture.writeJournal('betfair-partial-1', makeJournalRecord({
            commitId: 'betfair-partial-1',
            eventId: 'integration-betfair-partial',
            source: 'betfair',
            historyCompleted: true,
            timelineCompleted: false
        }));

        const result = buildLatestMatchEvidenceFromTimelines({
            eventId: 'integration-betfair-partial',
            now: new Date('2026-07-09T12:00:05.000Z'),
            sofaTimeline: buildSofaTimelineOnly(),
            betfairTimeline: buildBetfairTimelineOnly(),
            dependencies: {
                getMatchPersistenceIntegrity: makeIntegrityAdapter(fixture.journalStore)
            }
        });

        assert.equal(result.integrity.status, 'partial_persistence', 'Evidence top-level integrity status');
        assert.ok(
            result.integrity.affectedSources.includes('betfair'),
            'Evidence affectedSources includes betfair'
        );
        assert.equal(result.evidence.dataQuality.persistenceComplete, false, 'Evidence persistenceComplete false');
        assert.equal(result.evidence.dataQuality.betfairRecent, true, 'Betfair remains technically recent');
        assert.equal(result.evidence.marketEvidence.runners.length, 0, 'Market runners blocked');
        assert.equal(result.evidence.marketReactionEvidence.available, false, 'Market reactions blocked');
        assert.equal(
            result.evidence.marketReactionEvidence.summary.causalityClaimed,
            false,
            'Causality not claimed'
        );
        assert.ok(
            result.evidence.noTradeReasons.includes(PERSISTENCE_INCOMPLETE_REASON),
            'Evidence noTradeReasons includes persistence incomplete reason'
        );
    } finally {
        fixture.cleanup();
    }
});

await test('S03-sofa-recovery-failed-propagated-to-api-and-evidence', async () => {
    const fixture = createIntegrationFixture();

    try {
        fixture.writeJournal('sofa-failed-1', makeJournalRecord({
            commitId: 'sofa-failed-1',
            eventId: 'integration-sofa-recovery-failed',
            source: 'sofa',
            status: 'recovery_failed',
            reason: 'history_write_failed',
            historyCompleted: false,
            timelineCompleted: false
        }));

        const matchResponse = buildSofaTimelineResponse(
            'integration-sofa-recovery-failed',
            {
                loadTimeline: () => null,
                getMatchPersistenceIntegrity: makeIntegrityAdapter(fixture.journalStore)
            }
        );

        assert.equal(matchResponse.httpStatus, 409, 'Match API returns 409 for recovery_failed');
        assert.equal(matchResponse.body.error, 'persistence_integrity', 'Match API error is persistence_integrity');
        assert.equal(matchResponse.body.integrity.status, 'recovery_failed', 'Match API integrity status recovery_failed');
        assert.equal(matchResponse.body.integrity.source, 'sofa', 'Match API integrity source sofa');

        const evidenceResult = buildLatestMatchEvidenceFromTimelines({
            eventId: 'integration-sofa-recovery-failed',
            now: new Date('2026-07-09T12:00:05.000Z'),
            sofaTimeline: buildSofaTimelineOnly(),
            betfairTimeline: buildBetfairTimelineOnly(),
            dependencies: {
                getMatchPersistenceIntegrity: makeIntegrityAdapter(fixture.journalStore)
            }
        });

        assert.equal(evidenceResult.integrity.status, 'recovery_failed', 'Evidence top-level integrity recovery_failed');
        assert.ok(
            evidenceResult.integrity.affectedSources.includes('sofa'),
            'Evidence affectedSources includes sofa'
        );
        assert.equal(evidenceResult.evidence.dataQuality.persistenceComplete, false, 'Evidence persistenceComplete false');
        assert.ok(
            evidenceResult.evidence.noTradeReasons.includes(PERSISTENCE_INCOMPLETE_REASON),
            'Evidence noTradeReasons includes persistence incomplete reason'
        );
    } finally {
        fixture.cleanup();
    }
});

await test('S04-completed-residual-missing-target-reopened-not-no-known-partial', async () => {
    const fixture = createIntegrationFixture();

    try {
        const eventId = 'integration-completed-residual';

        fixture.writeJournal('completed-residual-1', makeJournalRecord({
            commitId: 'completed-residual-1',
            eventId,
            source: 'sofa',
            status: 'pending',
            reason: null,
            historyCompleted: true,
            timelineCompleted: true
        }));

        const createResult = fixture.journalStore.createPendingCommit(makeJournalRecord({
            commitId: 'completed-residual-2',
            eventId,
            source: 'sofa',
            historyCompleted: false,
            timelineCompleted: false
        }));

        assert.equal(createResult.status, 'failed', 'Create is blocked by reopened residual');
        assert.equal(createResult.reason, 'pending_exists', 'Reopened residual is active');

        const integrity = fixture.journalStore.getPersistenceIntegrityStatus(eventId, 'sofa');

        assert.notEqual(integrity.status, 'no_known_partial', 'Integrity is not false no_known_partial');
        assert.equal(integrity.status, 'partial_persistence', 'Reopened residual is partial_persistence');
        assert.ok(
            Array.isArray(integrity.affectedDocuments) &&
            integrity.affectedDocuments.includes('history'),
            'AffectedDocuments includes reopened history'
        );
    } finally {
        fixture.cleanup();
    }
});

finish('persistenceIntegrity/all');
