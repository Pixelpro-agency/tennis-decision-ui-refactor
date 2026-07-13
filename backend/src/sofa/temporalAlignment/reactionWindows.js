const REACTION_WINDOW_SEC = 30;

function parseTs(ts) {
    if (!ts) return null;
    const d = new Date(ts);
    return isNaN(d.getTime()) ? null : d;
}

function roundN(v, n) {
    if (typeof v !== 'number' || !isFinite(v)) return null;
    const f = Math.pow(10, n);
    return Math.round(v * f) / f;
}

export function computeReactionWindows(latestSofaMarker, latestBetfairMove) {
    const reasons = [];
    const base = {
        windowSec: REACTION_WINDOW_SEC,
        sofaBeforeBetfair: false,
        betfairBeforeSofa: false,
        sameWindow: false,
        gapSec: null,
        relation: 'unknown',
        interpretation: 'temporal_proximity_only',
        causalityClaimed: false,
        reasons
    };

    const sofaTs = latestSofaMarker?.available ? latestSofaMarker.stateFirstSeenAt : null;
    const betfairTs = latestBetfairMove?.available ? latestBetfairMove.timestamp : null;

    if (!sofaTs && !betfairTs) {
        reasons.push('Both Sofa marker and Betfair move unavailable');
        return base;
    }
    if (!sofaTs) {
        reasons.push('Sofa field event unavailable; temporal relation cannot be established');
        return base;
    }
    if (!betfairTs) {
        reasons.push('Betfair move unavailable; temporal relation cannot be established');
        return base;
    }

    const st = parseTs(sofaTs);
    const bt = parseTs(betfairTs);
    if (!st || !bt) {
        reasons.push('Could not parse timestamps');
        return base;
    }

    const gapSec = roundN((bt.getTime() - st.getTime()) / 1000, 1);
    const absGap = Math.abs(gapSec);

    let relation;
    if (absGap <= REACTION_WINDOW_SEC) {
        relation = 'same_window';
        base.sameWindow = true;
        reasons.push(`Sofa marker and Betfair move occurred within ${REACTION_WINDOW_SEC}s window (gap: ${gapSec}s)`);
    } else if (gapSec > 0) {
        relation = 'sofa_before_betfair';
        base.sofaBeforeBetfair = true;
        reasons.push(`Sofa marker detected before Betfair move by ${gapSec}s, but causality not established`);
    } else {
        relation = 'betfair_before_sofa';
        base.betfairBeforeSofa = true;
        reasons.push(`Market moved before latest Sofa marker by ${Math.abs(gapSec)}s`);
    }

    return {
        ...base,
        gapSec,
        relation
    };
}
