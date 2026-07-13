import assert from 'node:assert/strict';
import { createBetfairUpdateHandler } from './betfairUpdates.js';

let passed = 0;
let failed = 0;

function check(label, condition) {
    try {
        assert.equal(condition, true);
        console.log(`PASS ${label}`);
        passed += 1;
    } catch {
        console.error(`FAIL ${label}`);
        failed += 1;
    }
}

function createPayload(total = 1000) {
    return {
        market_info: { total_matched: total },
        runners: [
            {
                name: 'Player A',
                selectionId: '101',
                moneyFlow: { back: 12, lay: 4, trend: 'back', confidence: 'high' },
                ladder: [{ price: 1.5, traded: 50 }],
                ladderSource: 'book_depth',
                matchedTotal: 400,
                totalMatchedOnSelection: 400,
                state: { lastPriceTraded: 1.5 }
            },
            {
                name: 'Player B',
                selectionId: '102',
                moneyFlow: { back: 3, lay: 8, trend: 'lay', confidence: 'high' },
                ladder: [{ price: 2.6, traded: 40 }],
                ladderSource: 'graph',
                matchedTotal: 300,
                totalMatchedOnSelection: 300,
                lastTradedPrice: 2.5
            }
        ]
    };
}

function createHandler({ history = null, loadHistoryResult } = {}) {
    const latestSofaState = new Map();
    const latestBetfairState = new Map();
    const handler = createBetfairUpdateHandler({
        latestSofaState,
        latestBetfairState,
        loadHistory: () => history && structuredClone(history),
        loadHistoryResult: loadHistoryResult || (eventId => {
            if (!history) {
                return {
                    ok: true,
                    operation: 'history_read',
                    eventId,
                    status: 'missing',
                    reason: null,
                    history: null,
                    file: null
                };
            }
            return {
                ok: true,
                operation: 'history_read',
                eventId,
                status: 'found',
                reason: null,
                history: structuredClone(history),
                file: `/history/${eventId}.json`
            };
        }),
        getNow: () => new Date('2026-07-06T12:00:00.000Z')
    });

    return { handler, latestBetfairState };
}

{
    const { handler } = createHandler();
    const result = handler('', createPayload());

    check(
        'empty-event-is-rejected-without-document',
        result.ok === false &&
            result.operation === 'history_prepare' &&
            result.reason === 'invalid_event_id' &&
            result.document === null
    );
}

{
    const { handler, latestBetfairState } = createHandler();
    const result = handler('event-new', createPayload(), 'market-key');

    check(
        'prepares-full-history-document',
        result.ok === true &&
            result.status === 'prepared' &&
            result.document.metadata.eventId === 'event-new' &&
            result.document.metadata.betfairUrl === 'market-key' &&
            result.document.history.length === 1
    );
    check(
        'prepared-row-retains-money-flow-and-ladder',
        result.document.history[0].betfair.runners[0].moneyFlow.back === 12 &&
            result.document.history[0].latestBetfairState.runners[0].ladder.length === 1
    );
    check(
        'preparation-updates-only-in-memory-betfair-state',
        latestBetfairState.get('event-new')?._repr &&
            latestBetfairState.get('event-new').runners.length === 2
    );
}

{
    const base = {
        metadata: {
            eventId: 'event-duplicate',
            date: '2026-07-06',
            tournament: 'T',
            players: { home: 'Player A', away: 'Player B' },
            sofaUrl: '',
            betfairUrl: 'old'
        },
        history: [{
            timestamp: '2026-07-06T11:59:00.000Z',
            sofa: null,
            betfair: {
                totalMatched: 1000,
                runners: [
                    { name: 'Player A', moneyFlow: { back: 12, lay: 4 }, wom: undefined },
                    { name: 'Player B', moneyFlow: { back: 3, lay: 8 }, wom: undefined }
                ]
            }
        }]
    };
    const { handler } = createHandler({ history: base });
    const result = handler('event-duplicate', createPayload(1000), 'market-key');

    check(
        'identical-history-row-is-not-duplicated',
        result.ok === true &&
            result.status === 'unchanged' &&
            result.document.history.length === 1 &&
            result.row === null
    );
}

{
    const { handler } = createHandler();
    const result = handler(
        'event-status-only',
        createPayload(),
        'market-key',
        { append: false }
    );

    check(
        'status-only-preparation-keeps-history-document-unchanged',
        result.ok === true &&
            result.status === 'prepared' &&
            result.document.history.length === 0 &&
            result.row === null
    );
}

{
    const { handler, latestBetfairState } = createHandler({
        loadHistoryResult: eventId => ({
            ok: false,
            operation: 'history_read',
            eventId,
            status: 'failed',
            reason: 'invalid_json',
            history: null,
            file: `/history/${eventId}.json`
        })
    });
    const beforeState = latestBetfairState.get('event-bad-history');
    const result = handler('event-bad-history', createPayload(), 'market-key');

    check(
        'history-read-failure-blocks-preparation',
        result.ok === false &&
            result.operation === 'history_prepare' &&
            result.source === 'betfair' &&
            result.status === 'failed' &&
            result.reason === 'invalid_json' &&
            result.document === null &&
            result.metadata === null &&
            result.row === null
    );
    check(
        'history-read-failure-leaves-latest-betfair-state-unchanged',
        latestBetfairState.get('event-bad-history') === beforeState
    );
}

{
    const { handler } = createHandler();
    const result = handler('event-commitId', createPayload(), 'market-key', { commitId: 'betfair-commit-123' });
    const row = result.document.history[result.document.history.length - 1];

    check(
        'commitId-is-added-to-new-row',
        result.ok === true &&
            result.status === 'prepared' &&
            row.commitId === 'betfair-commit-123'
    );
}

{
    const { handler } = createHandler();
    const result = handler('event-runner-fields', createPayload(), 'market-key');
    const row = result.document.history[result.document.history.length - 1];
    const runner = row.betfair.runners[0];
    const latestRunner = row.latestBetfairState.runners[0];

    check(
        'runner-history-preserves-selectionId-and-canonical-fields',
        runner.selectionId === '101' &&
            Array.isArray(runner.ladder) &&
            runner.ladderSource === 'book_depth' &&
            runner.matchedTotal === 400 &&
            runner.totalMatchedOnSelection === 400 &&
            runner.lastTradedPrice === 1.5
    );
    check(
        'latestBetfairState-runner-preserves-selectionId-and-canonical-fields',
        latestRunner.selectionId === '101' &&
            Array.isArray(latestRunner.ladder) &&
            latestRunner.ladderSource === 'book_depth' &&
            latestRunner.matchedTotal === 400 &&
            latestRunner.totalMatchedOnSelection === 400 &&
            latestRunner.lastTradedPrice === 1.5
    );
}

{
    const { handler } = createHandler();
    const result = handler('event-append-false', createPayload(), 'market-key', { append: false });

    check(
        'append-false-adds-no-row-and-no-commitId',
        result.ok === true &&
            result.status === 'prepared' &&
            result.document.history.length === 0 &&
            result.row === null
    );
}

{
    const { handler } = createHandler();
    const payload = createPayload();
    payload.runners[0].matchedTotal = 700;
    payload.runners[0].totalMatchedOnSelection = 450;
    const result = handler('event-separate-values', payload, 'market-key');
    const row = result.document.history[result.document.history.length - 1];
    const historyRunner = row.betfair.runners[0];
    const latestRunner = row.latestBetfairState.runners[0];

    check(
        'matchedTotal-and-totalMatchedOnSelection-are-preserved-separately',
        historyRunner.matchedTotal === 700 &&
            historyRunner.totalMatchedOnSelection === 450 &&
            latestRunner.matchedTotal === 700 &&
            latestRunner.totalMatchedOnSelection === 450
    );
}

{
    const { handler } = createHandler();
    const payload = createPayload();
    payload.runners[0].matchedTotal = 700;
    delete payload.runners[0].totalMatchedOnSelection;
    const result = handler('event-no-totalMatchedOnSelection', payload, 'market-key');
    const row = result.document.history[result.document.history.length - 1];
    const historyRunner = row.betfair.runners[0];
    const latestRunner = row.latestBetfairState.runners[0];

    check(
        'missing-totalMatchedOnSelection-leaves-null',
        historyRunner.matchedTotal === 700 &&
            historyRunner.totalMatchedOnSelection === null &&
            latestRunner.matchedTotal === 700 &&
            latestRunner.totalMatchedOnSelection === null
    );
}

console.log(`betfairUpdates: ${passed} passed, ${failed} failed`);

if (failed > 0) {
    throw new Error(`${failed} betfairUpdates assertions failed`);
}
