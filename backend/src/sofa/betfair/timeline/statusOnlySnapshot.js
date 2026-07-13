export function cloneCanonicalRunnersForStatusOnly(runners) {
    return (runners || []).map(runner => ({
        ...runner,
        bookBack: Array.isArray(runner.bookBack)
            ? runner.bookBack.map(level => ({ ...level }))
            : [],
        bookLay: Array.isArray(runner.bookLay)
            ? runner.bookLay.map(level => ({ ...level }))
            : [],
        ladder: Array.isArray(runner.ladder)
            ? runner.ladder.map(row => ({ ...row }))
            : [],
        moneyFlow: {
            back: 0,
            lay: 0,
            trend: 'neutral',
            confidence: 'suppressed',
            reason: 'graph_login_required'
        }
    }));
}

export function shouldPreserveLastCanonicalSnapshot({
    previousTick,
    processedResult,
    graphRowsTotal
}) {
    return previousTick !== null &&
        processedResult.diagnostics?.graphLoginRequired === true &&
        graphRowsTotal === 0 &&
        processedResult.timelineIntegrity?.accepted === false;
}

export function applyStatusOnlySummary(ladderSummary, preserveLastCanonicalSnapshot) {
    if (!preserveLastCanonicalSnapshot) {
        return {
            ladderRows: ladderSummary.ladderRows,
            graphLadderRows: ladderSummary.graphLadderRows,
            hasUsableLadder: ladderSummary.anyUsableLadder,
            hasUsableGraphLadder: ladderSummary.anyUsableGraphLadder,
            baseQuotesAvailable: ladderSummary.baseQuotesAvailable,
            ladderSource: ladderSummary.overallLadderSource
        };
    }

    return {
        ladderRows: 0,
        graphLadderRows: 0,
        hasUsableLadder: false,
        hasUsableGraphLadder: false,
        baseQuotesAvailable: false,
        ladderSource: 'none'
    };
}
