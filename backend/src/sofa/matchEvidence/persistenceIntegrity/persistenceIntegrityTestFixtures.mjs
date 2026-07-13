import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { createCommitJournalStore } from '../../matchHistory/commitJournal.js';
import { buildSofaTimelineResponse } from '../../../routes/match/readResponses.js';
import { buildBetfairJsonResponse } from '../../../routes/betfair/latestPayload.js';
import { buildLatestMatchEvidenceFromTimelines } from '../latestMatchEvidence.js';

let passed = 0;
let failed = 0;
let fixtureNumber = 0;

export async function test(name, callback) {
    try {
        await callback();
        passed += 1;
        console.log(`  PASS [${name}]`);
    } catch (error) {
        failed += 1;
        console.error(`  FAIL [${name}]`);
        console.error(error);
    }
}

export function makeTempRoot() {
    fixtureNumber += 1;
    return path.join(
        os.tmpdir(),
        `persistence-integrity-integration-${process.pid}-${fixtureNumber}-${Date.now()}`
    );
}

export function createIntegrationFixture() {
    const root = makeTempRoot();
    const journalDir = path.join(root, 'match_history', '.pending_commits');

    fs.mkdirSync(journalDir, { recursive: true });

    const journalStore = createCommitJournalStore({
        fs,
        path,
        journalDir,
        logError: () => {}
    });

    function journalFile(commitId) {
        return path.join(journalDir, `${commitId}.json`);
    }

    function writeJournal(commitId, record) {
        fs.writeFileSync(journalFile(commitId), JSON.stringify(record, null, 2), 'utf8');
    }

    return {
        root,
        journalDir,
        journalStore,
        journalFile,
        writeJournal,
        cleanup() {
            try {
                fs.rmSync(root, { recursive: true, force: true });
            } catch (_) {
            }
        }
    };
}

export function makeJournalRecord({
    commitId = 'commit-a',
    eventId = 'event-a',
    source = 'sofa',
    status = 'pending',
    reason = null,
    historyCompleted = false,
    timelineCompleted = false,
    historyDocument = { metadata: { eventId: 'event-a' }, history: [] },
    timelineDocument = { metadata: { eventId: 'event-a' }, timeline: [] }
} = {}) {
    return {
        version: 1,
        commitId,
        eventId,
        source,
        createdAt: new Date().toISOString(),
        status,
        reason,
        documents: {
            history: {
                target: `/history/${eventId}.json`,
                payload: {
                    document: historyDocument,
                    metadata: historyDocument.metadata
                },
                completed: historyCompleted
            },
            timeline: {
                target: `/timeline/${source}_${eventId}.json`,
                payload: {
                    document: timelineDocument,
                    metadata: timelineDocument.metadata
                },
                completed: timelineCompleted
            }
        }
    };
}

export function makeIntegrityAdapter(journalStore) {
    return (eventId, source) => journalStore.getPersistenceIntegrityStatus(eventId, source);
}

export function makeSofaTick(timestamp, homeName = 'Lorenzo Sonego', awayName = 'Miomir Kecmanovic', seq = 1) {
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

export const PERSISTENCE_INCOMPLETE_REASON = 'Persistence incomplete: canonical cross-source evidence unavailable';

export function buildSofaTimelineOnly() {
    return {
        metadata: {
            players: { home: 'Lorenzo Sonego', away: 'Miomir Kecmanovic' },
            tournament: 'Integration'
        },
        timeline: [makeSofaTick('2026-07-09T12:00:00.000Z')]
    };
}

export function buildBetfairTimelineOnly() {
    return {
        metadata: {
            players: { home: 'Sonego', away: 'Kecmanovic' },
            tournament: 'Integration'
        },
        timeline: [
            makeBetfairTick({
                timestamp: '2026-07-09T12:00:00.000Z',
                seq: 1,
                marketId: 'integration-market',
                marketKey: 'integration-market-key',
                totalMatched: 2000,
                runners: [
                    { name: 'Sonego', selectionId: 1, lastTradedPrice: 1.95 },
                    { name: 'Kecmanovic', selectionId: 2, lastTradedPrice: 2.05 }
                ]
            })
        ]
    };
}

export function finish(scope = 'modular test') {
    console.log(`${scope}: ${passed} passed, ${failed} failed`);
    if (failed > 0) {
        throw new Error(`${failed} ${scope} assertions failed`);
    }
}
