export const BETFAIR_STALE_AFTER_SEC = 45;

function isStaleAge(ageSec) {
    return typeof ageSec === 'number' && ageSec > BETFAIR_STALE_AFTER_SEC;
}

export function classifyBetfairSessionHealth({
    gh,
    loginReqTick,
    finished,
    latestBetfairAgeSec,
    latestUsableLadderAgeSec,
    consecutiveNoLadderTicks,
    cdpStatus,
    marketOk,
    ladderOk,
    networkErrorsRecent,
    checks,
    technicalErrorActive = false,
    lastTechnicalErrorReason = null
}) {
    const graphAuthSuspected = gh?.status === 'auth_suspected';
    const legacyLoginRequired = !!loginReqTick;
    const isRed = (graphAuthSuspected || legacyLoginRequired) && !finished;

    const ghStatus = gh?.status || null;
    const latestTickStale = isStaleAge(latestBetfairAgeSec);
    const usableLadderStale = isStaleAge(latestUsableLadderAgeSec);
    const ageStale = latestTickStale || usableLadderStale;
    const graphStale = ghStatus === 'stale' || ghStatus === 'temporary_error';
    const graphBadUrl = ghStatus === 'bad_graph_url';
    const graphUnavailable = ghStatus === 'unavailable';

    const isYellow =
        !isRed &&
        (
            technicalErrorActive ||
            ageStale ||
            consecutiveNoLadderTicks >= 1 ||
            cdpStatus === false ||
            marketOk === false ||
            graphStale ||
            graphBadUrl ||
            graphUnavailable
        );

    const isGreen =
        !isRed &&
        !isYellow &&
        (gh ? ghStatus === 'ok' : true) &&
        ladderOk === true &&
        marketOk === true &&
        cdpStatus !== false;

    const reasons = [];

    let status = 'unknown';
    let severity = 'neutral';
    let label = 'UNKNOWN';
    let message = 'Stato Betfair non determinato';
    let alert = false;

    if (isRed) {
        status = 'red';
        severity = 'danger';
        label = 'ALERT';
        alert = true;
        message = 'Possible Betfair logout — graph requires authentication';

        const loginDiag = loginReqTick ? (loginReqTick.data.diagnostics || {}) : {};
        const legacyText = loginDiag.graphLoginRequiredText
            ? `Graph URL Betfair mostra: ${loginDiag.graphLoginRequiredText}`
            : 'Graph URL Betfair richiede login/autenticazione';

        reasons.push(legacyText);
        checks.loginOk = false;
        checks.graphUrlsOk = false;
        checks.strategyDataOk = false;
    } else if (isYellow) {
        status = 'yellow';
        severity = 'warning';
        label = technicalErrorActive ? 'DEGRADED' : 'STALE';
        alert = false;

        if (technicalErrorActive) {
            message = 'Betfair scrape failed — retry active';
        } else if (graphBadUrl) {
            message = 'Graph URL may not match current runners/market';
            checks.graphUrlsOk = false;
        } else if (graphStale) {
            message = 'Betfair graph data stale';
        } else if (cdpStatus === false) {
            message = 'CDP not reachable — Betfair data may be stale';
        } else if (latestTickStale) {
            message = 'Betfair data stale — latest canonical tick is delayed';
        } else if (usableLadderStale) {
            message = 'Betfair ladder stale — latest canonical tick is recent';
        } else if (marketOk === false) {
            message = 'Betfair market data unavailable or incomplete';
        } else {
            message = 'Betfair graph data stale';
        }

        if (technicalErrorActive) {
            reasons.push(
                lastTechnicalErrorReason
                    ? `Betfair scrape failed — retry active (${lastTechnicalErrorReason})`
                    : 'Betfair scrape failed — retry active'
            );
        }
        if (latestTickStale) {
            reasons.push(`Ultimo tick Betfair ricevuto ${Math.round(latestBetfairAgeSec)}s fa`);
        }
        if (usableLadderStale) {
            reasons.push(`Ultima ladder usabile ${Math.round(latestUsableLadderAgeSec)}s fa`);
        }
        if (consecutiveNoLadderTicks > 0) {
            reasons.push(`${consecutiveNoLadderTicks} tick consecutivi senza ladder usabile`);
        }
        if (networkErrorsRecent > 0) {
            reasons.push(`${networkErrorsRecent} errori di rete negli ultimi 3 tick`);
        }
        if (marketOk === false) {
            reasons.push('Mercato non valido: nessun runner o totalMatched assente/zero');
        }
        if (cdpStatus === false) {
            reasons.push('CDP non raggiungibile');
        }
        checks.strategyDataOk = false;
    } else if (isGreen) {
        status = 'green';
        severity = 'ok';
        label = 'OK';
        message = 'Betfair live: graph ladder aggiornata';
        alert = false;
        checks.strategyDataOk = marketOk === true;
    } else {
        checks.strategyDataOk = false;
    }

    return {
        status,
        severity,
        label,
        message,
        alert,
        reasons
    };
}
