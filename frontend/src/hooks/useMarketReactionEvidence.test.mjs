import assert from 'node:assert/strict';
import { normalizeEvidencePayload } from './useMarketReactionEvidence.js';

const fetchedAt = new Date('2026-08-09T12:00:05.000Z');
const model = normalizeEvidencePayload({
    latest: {
        metadata: { updatedAt: '2026-08-09T12:00:00.000Z' },
        dataQuality: { persistenceComplete: false },
        marketReactionEvidence: { available: false }
    },
    sources: { sofaTimelineFound: true, betfairTimelineFound: false },
    integrity: { status: 'partial_persistence' }
}, fetchedAt);

assert.deepEqual(model.evidence, { available: false });
assert.equal(model.persistenceComplete, false);
assert.equal(model.sourceUpdatedAt.toISOString(), '2026-08-09T12:00:00.000Z');
assert.equal(model.fetchedAt, fetchedAt);
assert.equal(model.integrity.status, 'partial_persistence');
assert.equal(model.sources.betfairTimelineFound, false);

console.log('useMarketReactionEvidence payload tests passed');
