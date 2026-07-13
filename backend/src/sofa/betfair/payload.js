
import { normalizeMoney } from './numbers.js';

export function getRestoredMarketTotal(row) {
    const candidates = [
        row?.betfair?.market_info?.total_matched,
        row?.betfair?.totalMatched,
        row?.betfair?.market?.totalMatched,
        row?.latestBetfairState?.market?.totalMatched
    ];
    for (const candidate of candidates) {
        if (candidate == null) continue;
        const v = normalizeMoney(candidate);
        if (Number.isFinite(v) && v > 0) return v;
    }
    return null;
}


export function buildLadderFromRunner(runner, defaultTraded = 0) {
    if (Array.isArray(runner.ladder) && runner.ladder.length > 0) return runner.ladder;

    const backArr = runner.exchange?.availableToBack || runner.back || [];
    const layArr = runner.exchange?.availableToLay || runner.lay || [];
    const rows = new Map();

    backArr.forEach(entry => {
        const price = parseFloat(entry.price);
        if (!price) return;
        rows.set(price, {
            price,
            back_available: normalizeMoney(entry.size ?? entry.vol),
            lay_available: 0,
            traded: defaultTraded
        });
    });

    layArr.forEach(entry => {
        const price = parseFloat(entry.price);
        if (!price) return;
        if (rows.has(price)) {
            rows.get(price).lay_available = normalizeMoney(entry.size ?? entry.vol);
        } else {
            rows.set(price, {
                price,
                back_available: 0,
                lay_available: normalizeMoney(entry.size ?? entry.vol),
                traded: defaultTraded
            });
        }
    });

    return Array.from(rows.values()).sort((a, b) => a.price - b.price);
}

export function sanitizeBetfairPayloadForHistory(payload) {
    if (!payload || typeof payload !== 'object') {
        return { runners: [], market_info: {}, network_capture: undefined };
    }
    const sanitized = {
        runners: [],
        market_info: payload.market_info && typeof payload.market_info === 'object' ? payload.market_info : {},
        network_capture: payload.network_capture
    };

    const inputRunners = Array.isArray(payload.runners) ? payload.runners : [];
    for (const r of inputRunners) {
        if (!r || typeof r !== 'object') continue;
        sanitized.runners.push({
            name: typeof r.name === 'string' ? r.name : String(r.selectionId || 'Runner'),
            selectionId: r.selectionId,
            back: Array.isArray(r.back) ? r.back : [],
            lay: Array.isArray(r.lay) ? r.lay : [],
            ladder: Array.isArray(r.ladder) ? r.ladder : [],
            ladderFlow: Array.isArray(r.ladderFlow) ? r.ladderFlow : [],
            moneyFlow: r.moneyFlow && typeof r.moneyFlow === 'object'
                ? {
                    back: typeof r.moneyFlow.back === 'number' ? r.moneyFlow.back : 0,
                    lay: typeof r.moneyFlow.lay === 'number' ? r.moneyFlow.lay : 0,
                    trend: r.moneyFlow.trend || 'neutral',
                    confidence: r.moneyFlow.confidence || 'suppressed',
                    reason: r.moneyFlow.reason ?? null,
                    ...(typeof r.moneyFlow.marketDelta === 'number' ? { marketDelta: r.moneyFlow.marketDelta } : {}),
                    ...(typeof r.moneyFlow.runnerDelta === 'number' ? { runnerDelta: r.moneyFlow.runnerDelta } : {}),
                    ...(typeof r.moneyFlow.ladderTradedDelta === 'number' ? { ladderTradedDelta: r.moneyFlow.ladderTradedDelta } : {})
                  }
                : { back: 0, lay: 0, trend: 'neutral', confidence: 'suppressed', reason: 'no_previous_state' },
            market_graph: r.market_graph && typeof r.market_graph === 'object' ? r.market_graph : {},
            exchange: r.exchange && typeof r.exchange === 'object' ? r.exchange : {},
            state: r.state && typeof r.state === 'object' ? r.state : {},
            wom: typeof r.wom === 'number' ? r.wom : 0.5,
            matchedTotal: typeof r.matchedTotal === 'number' ? r.matchedTotal : 0,
            totalMatchedOnSelection: typeof r.totalMatchedOnSelection === 'number' ? r.totalMatchedOnSelection : 0
        });
    }

    return sanitized;
}

