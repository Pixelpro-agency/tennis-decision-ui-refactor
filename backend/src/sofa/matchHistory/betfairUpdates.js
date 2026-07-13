function cloneJson(value) {
    return JSON.parse(JSON.stringify(value));
}

function createSeedHistory(eventId, betfairData, getNow) {
    const dateStr = getNow().toISOString().split('T')[0];

    return {
        metadata: {
            eventId,
            date: dateStr,
            tournament: 'unknown_tournament',
            players: {
                home: betfairData.runners?.[0]?.name || 'Player 1',
                away: betfairData.runners?.[1]?.name || 'Player 2'
            },
            sofaUrl: '',
            betfairUrl: ''
        },
        history: []
    };
}

function buildBetfairRepresentation(betfairData) {
    return JSON.stringify({
        market_total_matched: betfairData.market_info?.total_matched,
        runner_money_flows: (betfairData.runners || []).map(runner => ({
            name: runner.name,
            back: runner.moneyFlow?.back || 0,
            lay: runner.moneyFlow?.lay || 0,
            wom: runner.wom
        }))
    });
}

export function createBetfairUpdateHandler({
    latestSofaState,
    latestBetfairState,
    loadHistory,
    loadHistoryResult,
    getNow = () => new Date()
}) {
    function failedResult(eventId, reason = 'invalid_event_id') {
        return {
            ok: false,
            operation: 'history_prepare',
            source: 'betfair',
            eventId: eventId || null,
            status: 'failed',
            reason,
            document: null,
            metadata: null,
            row: null
        };
    }

    function prepareBetfairHistory(
        eventId,
        betfairData,
        marketUrl = '',
        { append = true, commitId = null } = {}
    ) {
        if (!eventId) {
            return failedResult(eventId);
        }

        const runners = Array.isArray(betfairData?.runners)
            ? betfairData.runners
            : [];
        const runnersWithFlow = runners.map(runner => ({
            name: runner.name,
            selectionId: runner.selectionId ?? null,
            moneyFlow: runner.moneyFlow || { back: 0, lay: 0 },
            wom: runner.wom,
            ladder: runner.ladder || [],
            ladderSource: runner.ladderSource || null,
            ladderStats: runner.ladderStats || null,
            matchedTotal: Number.isFinite(runner.matchedTotal)
                ? runner.matchedTotal
                : (Number.isFinite(runner.totalMatchedOnSelection)
                    ? runner.totalMatchedOnSelection
                    : null),
            totalMatchedOnSelection: Number.isFinite(runner.totalMatchedOnSelection)
                ? runner.totalMatchedOnSelection
                : null,
            lastTradedPrice: typeof runner.state?.lastPriceTraded === 'number'
                ? runner.state.lastPriceTraded
                : (typeof runner.lastTradedPrice === 'number' ? runner.lastTradedPrice : null)
        }));
        const currentRepresentation = buildBetfairRepresentation(
            betfairData || {}
        );

        const readResult = loadHistoryResult(eventId);

        if (readResult.status === 'failed') {
            return failedResult(eventId, readResult.reason);
        }

        let historyObj = readResult.status === 'found'
            ? cloneJson(readResult.history)
            : createSeedHistory(eventId, betfairData || {}, getNow);

        if (!Array.isArray(historyObj.history)) {
            historyObj.history = [];
        }

        const existingMetadata = historyObj.metadata || {};
        const metadata = {
            ...existingMetadata,
            eventId,
            players: {
                ...(existingMetadata.players || {}),
                home: existingMetadata.players?.home ||
                    runners[0]?.name ||
                    'Player 1',
                away: existingMetadata.players?.away ||
                    runners[1]?.name ||
                    'Player 2'
            },
            betfairUrl: marketUrl || existingMetadata.betfairUrl || ''
        };
        historyObj.metadata = metadata;

        const latestSofa = latestSofaState.get(eventId) || null;
        const newRow = {
            timestamp: getNow().toISOString(),
            sofa: latestSofa ? {
                score: latestSofa.score,
                serving: latestSofa.serving,
                stats: latestSofa.stats,
                status: latestSofa.status,
                surface: latestSofa.surface
            } : null,
            betfair: {
                totalMatched: betfairData?.market_info?.total_matched || '0 €',
                runners: runnersWithFlow
            },
            latestBetfairState: {
                runners: runners.map(runner => ({
                    name: runner.name,
                    selectionId: runner.selectionId ?? null,
                    ladder: runner.ladder || [],
                    ladderSource: runner.ladderSource || null,
                    matchedTotal: Number.isFinite(runner.matchedTotal)
                        ? runner.matchedTotal
                        : (Number.isFinite(runner.totalMatchedOnSelection)
                            ? runner.totalMatchedOnSelection
                            : null),
                    totalMatchedOnSelection: Number.isFinite(runner.totalMatchedOnSelection)
                        ? runner.totalMatchedOnSelection
                        : null,
                    lastTradedPrice: typeof runner.state?.lastPriceTraded === 'number'
                        ? runner.state.lastPriceTraded
                        : (typeof runner.lastTradedPrice === 'number' ? runner.lastTradedPrice : null)
                }))
            }
        };

        const lastRow = historyObj.history[historyObj.history.length - 1];
        const lastRepresentation = lastRow
            ? JSON.stringify({
                market_total_matched: lastRow.betfair?.totalMatched,
                runner_money_flows: (lastRow.betfair?.runners || []).map(runner => ({
                    name: runner?.name,
                    back: runner?.moneyFlow?.back || 0,
                    lay: runner?.moneyFlow?.lay || 0,
                    wom: runner?.wom
                }))
            })
            : null;
        const duplicateHistoryRow = lastRepresentation === currentRepresentation;
        const appendRow = append === true && !duplicateHistoryRow;

        if (appendRow) {
            newRow.commitId = commitId;
            historyObj.history.push(newRow);
        }

        latestBetfairState.set(eventId, {
            runners: runnersWithFlow,
            market_info: betfairData?.market_info || {},
            _repr: currentRepresentation
        });

        return {
            ok: true,
            operation: 'history_prepare',
            source: 'betfair',
            eventId,
            status: append === true && duplicateHistoryRow
                ? 'unchanged'
                : 'prepared',
            reason: null,
            document: historyObj,
            metadata,
            row: appendRow ? newRow : null
        };
    }

    return prepareBetfairHistory;
}
