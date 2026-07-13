export const stateRunners = [
    {
        selectionId: '101',
        name: 'Old Name',
        matchedTotal: 120,
        ladder: [{ price: 2, traded: 50 }]
    },
    {
        selectionId: '202',
        name: 'Same Name',
        matchedTotal: 220,
        ladder: [{ price: 3, traded: 70 }]
    },
    {
        selectionId: null,
        name: 'No Id Runner',
        matchedTotal: 10
    }
];

export function createMemoryJournal(hooks = {}) {
    const records = new Map();

    return {
        records,
        calls: { create: 0, marks: [], remove: 0 },
        createPendingCommit(record) {
            this.calls.create += 1;
            if (hooks.createPendingCommit) {
                return hooks.createPendingCommit(record, records);
            }
            records.set(record.commitId, structuredClone({
                ...record,
                status: 'pending'
            }));
            return { ok: true, status: 'created' };
        },
        findPendingCommit({ eventId, source }) {
            return [...records.values()].find(record =>
                record.eventId === eventId &&
                record.source === source &&
                (record.status === 'pending' || record.status === 'recovery_failed')
            ) || null;
        },
        findCompletedCommit({ eventId, source }) {
            return [...records.values()].find(record =>
                record.eventId === eventId &&
                record.source === source &&
                record.documents.history.completed === true &&
                record.documents.timeline.completed === true
            ) || null;
        },
        getPendingCommit(commitId) {
            return records.get(commitId) || null;
        },
        markDocumentComplete(commitId, documentName) {
            this.calls.marks.push(documentName);
            if (hooks.markDocumentComplete) {
                return hooks.markDocumentComplete(commitId, documentName, records);
            }
            const record = records.get(commitId);
            if (!record) return { ok: false, status: 'failed' };
            record.documents[documentName].completed = true;
            return { ok: true, status: 'updated' };
        },
        removeCompletedCommit(commitId) {
            this.calls.remove += 1;
            if (hooks.removeCompletedCommit) {
                return hooks.removeCompletedCommit(commitId, records);
            }
            records.delete(commitId);
            return { ok: true, status: 'removed' };
        }
    };
}

export function createValidProcessedResult() {
    return {
        market_info: {
            market_id: '1.2020',
            total_matched: 1000
        },
        event_status: { hasFinished: false },
        diagnostics: {},
        graph_diagnostics: {},
        runners: [
            {
                name: 'Player A',
                selectionId: '101',
                back: [{ price: 1.5, vol: 120 }],
                lay: [{ price: 1.52, vol: 150 }],
                ladder: [{ price: 1.5, back_available: 120, lay_available: 0, traded: 120 }],
                state: { lastPriceTraded: 1.5, totalMatched: 400 },
                matchedTotal: 400,
                totalMatchedOnSelection: 400,
                moneyFlow: { back: 10, lay: 5, trend: 'back', confidence: 'high' }
            },
            {
                name: 'Player B',
                selectionId: '102',
                back: [{ price: 2.5, vol: 80 }],
                lay: [{ price: 2.55, vol: 100 }],
                ladder: [{ price: 2.5, back_available: 80, lay_available: 0, traded: 90 }],
                state: { lastPriceTraded: 2.5, totalMatched: 300 },
                matchedTotal: 300,
                totalMatchedOnSelection: 300,
                moneyFlow: { back: 3, lay: 7, trend: 'lay', confidence: 'high' }
            }
        ]
    };
}
