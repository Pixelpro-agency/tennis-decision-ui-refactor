function classifyGraphHealth({
    eventStatus,
    authSuspectedRaw,
    graphUrlsProvided,
    graphUrlsAttempted,
    graphUrlsSucceeded,
    graphUrlsFailed,
    graphRowsTotal,
    failures,
    ladderSummary,
    runners,
    marketTotalMatched
}) {
    if (eventStatus.hasFinished === true) {
        return {
            status: 'finished',
            available: false,
            reason: 'market_finished'
        };
    }

    if (authSuspectedRaw) {
        return {
            status: 'auth_suspected',
            available: false,
            reason: 'graph_login_required'
        };
    }

    if (graphUrlsProvided === 0) {
        return {
            status: 'unavailable',
            available: false,
            reason: 'no_graph_urls_provided'
        };
    }

    if (
        graphUrlsSucceeded > 0 &&
        graphUrlsSucceeded >= graphUrlsProvided &&
        graphRowsTotal > 0
    ) {
        return {
            status: 'ok',
            available: true,
            reason: null
        };
    }

    if (graphUrlsSucceeded > 0 && graphUrlsFailed > 0) {
        return {
            status: ladderSummary.anyUsableGraphLadder ? 'stale' : 'temporary_error',
            available: ladderSummary.anyUsableGraphLadder,
            reason: 'partial_graph_success'
        };
    }

    if (failures.some(failure =>
        failure &&
        (
            String(failure.reason || '').includes('bad_graph_url') ||
            String(failure.reason || '').includes('selection_not_found')
        )
    )) {
        return {
            status: 'bad_graph_url',
            available: false,
            reason: 'graph_url_selection_mismatch'
        };
    }

    if (graphUrlsAttempted > 0 && graphRowsTotal === 0 && graphUrlsFailed > 0) {
        return {
            status: 'temporary_error',
            available: false,
            reason: 'graph_fetch_failed'
        };
    }

    if (!runners.length || (marketTotalMatched <= 0 && !ladderSummary.baseQuotesAvailable)) {
        return {
            status: 'unavailable',
            available: false,
            reason: 'empty_or_thin_market'
        };
    }

    return {
        status: 'unknown',
        available: false,
        reason: null
    };
}

export function readGraphDiagnostics(processedResult) {
    const graphDiag = processedResult.graph_diagnostics || {};

    return {
        graphUrlsProvided: graphDiag.graphUrlsProvided || 0,
        graphUrlsAttempted: graphDiag.graphUrlsAttempted || 0,
        graphUrlsSucceeded: graphDiag.graphUrlsSucceeded || 0,
        graphUrlsFailed: graphDiag.graphUrlsFailed || 0,
        graphRowsTotal: graphDiag.graphRowsTotal || 0,
        authSuspectedRaw: !!graphDiag.authSuspected ||
            !!processedResult.diagnostics?.graphLoginRequired,
        failures: Array.isArray(graphDiag.failures) ? graphDiag.failures : []
    };
}

export function buildGraphHealth({
    now,
    eventStatus,
    graphDiagnostics,
    ladderSummary,
    statusSummary,
    runners,
    marketTotalMatched,
    previousTick
}) {
    const classification = classifyGraphHealth({
        eventStatus,
        ...graphDiagnostics,
        ladderSummary,
        runners,
        marketTotalMatched
    });
    const previousGraphHealth = previousTick?.graphHealth || null;

    let lastOkAt;
    let lastFailAt;
    let consecutiveFailures;
    let staleSeconds;

    if (classification.status === 'ok') {
        lastOkAt = now.toISOString();
        lastFailAt = previousGraphHealth?.lastFailAt || null;
        consecutiveFailures = 0;
        staleSeconds = 0;
    } else if (classification.status === 'finished') {
        lastOkAt = previousGraphHealth?.lastOkAt || null;
        lastFailAt = previousGraphHealth?.lastFailAt || null;
        consecutiveFailures = previousGraphHealth?.consecutiveFailures || 0;
        staleSeconds = previousGraphHealth?.lastOkAt
            ? Math.round((now.getTime() - new Date(previousGraphHealth.lastOkAt).getTime()) / 1000)
            : null;
    } else {
        lastOkAt = previousGraphHealth?.lastOkAt || null;
        lastFailAt = now.toISOString();
        consecutiveFailures = (previousGraphHealth?.consecutiveFailures || 0) + 1;
        staleSeconds = lastOkAt
            ? Math.round((now.getTime() - new Date(lastOkAt).getTime()) / 1000)
            : null;
    }

    return {
        available: classification.available,
        status: classification.status,
        lastOkAt,
        lastFailAt,
        consecutiveFailures,
        authSuspected: graphDiagnostics.authSuspectedRaw,
        staleSeconds,
        reason: classification.reason,
        graphUrlsProvided: graphDiagnostics.graphUrlsProvided,
        graphUrlsAttempted: graphDiagnostics.graphUrlsAttempted,
        graphUrlsSucceeded: graphDiagnostics.graphUrlsSucceeded,
        graphUrlsFailed: graphDiagnostics.graphUrlsFailed,
        ladderRows: statusSummary.ladderRows,
        graphLadderRows: statusSummary.graphLadderRows,
        hasUsableLadder: statusSummary.hasUsableLadder,
        hasUsableGraphLadder: statusSummary.hasUsableGraphLadder,
        baseQuotesAvailable: statusSummary.baseQuotesAvailable,
        ladderSource: statusSummary.ladderSource
    };
}

export function buildNetworkCaptureSummary(networkCapture) {
    return {
        enabled: !!networkCapture.enabled,
        response_count: networkCapture.response_count || 0,
        json_count: networkCapture.json_count || 0,
        errors_count: networkCapture.errors_count || 0,
        candidates_count: Array.isArray(networkCapture.candidates)
            ? networkCapture.candidates.length
            : 0
    };
}
