import { isReliableLadderSource } from './ladder.js';
import { buildRunnerFlowEvidence, computeSpreadQuality } from '../marketFlowEvidence.js';

export function buildRunnerEvidence(runner, betfairRecent, graphHealthStatus, currentEntry, lookbackEntries) {
    if (!runner) return null;

    const bb = typeof runner.bestBack === 'number' ? runner.bestBack : null;
    const bl = typeof runner.bestLay === 'number' ? runner.bestLay : null;
    const ltp = typeof runner.lastTradedPrice === 'number' ? runner.lastTradedPrice : null;

    const bookTradable = bb !== null && bl !== null && bb > 0 && bl > 0 && bl > bb;
    const spread = bookTradable ? Math.round((bl - bb) * 1000) / 1000 : null;
    const midPrice = bookTradable ? Math.round(((bb + bl) / 2) * 1000) / 1000 : null;

    const ladder = Array.isArray(runner.ladder) ? runner.ladder : [];
    const ladderSource = runner.ladderSource || null;

    const runnerLadderReliable =
        betfairRecent &&
        graphHealthStatus === 'ok' &&
        isReliableLadderSource(ladderSource) &&
        ladder.length > 0;

    const ladderAvailable = runnerLadderReliable;

    let tradedVolume = null;
    if (ladder.length > 0) {
        let sum = 0;
        for (const row of ladder) {
            if (row && typeof row.traded === 'number') sum += row.traded;
        }
        tradedVolume = sum > 0 ? sum : null;
    }

    const rawMf = runner.moneyFlow && typeof runner.moneyFlow === 'object' ? runner.moneyFlow : null;
    const mf = runnerLadderReliable ? rawMf : null;

    const bookReasons = [];
    if (!bookTradable) bookReasons.push('Book is not two-sided');

    const ladderReasons = [];
    if (!ladderAvailable) {
        if (!isReliableLadderSource(ladderSource)) {
            ladderReasons.push('Ladder source is not reliable for moneyFlow');
        } else if (ladder.length === 0) {
            ladderReasons.push('Ladder absent or empty');
        } else {
            ladderReasons.push('Ladder not reliable or absent');
        }
    }

    const flowEvidence = buildRunnerFlowEvidence(
        runner,
        currentEntry || null,
        Array.isArray(lookbackEntries) ? lookbackEntries : [],
        betfairRecent,
        graphHealthStatus
    );

    const spreadQuality = computeSpreadQuality(bb, bl);

    return {
        name: runner.name || null,
        selectionId: runner.selectionId ?? null,
        bestBack: bb,
        bestLay: bl,
        spread,
        lastTradedPrice: ltp,
        marketMidPrice: midPrice,
        tradablePrice: bl,
        matchedTotal: typeof runner.matchedTotal === 'number' ? runner.matchedTotal : null,
        moneyFlow: mf ? { back: mf.back ?? null, lay: mf.lay ?? null, trend: mf.trend || 'neutral' } : null,
        wom: runnerLadderReliable && typeof runner.wom === 'number' ? runner.wom : null,
        priceDrift: null,
        volumeAcceleration: null,
        marketCompression: null,
        flowEvidence,
        bookEvidence: {
            available: bb !== null || bl !== null,
            bestBack: bb,
            bestLay: bl,
            spread,
            midPrice,
            backSize: typeof runner.bestBackSize === 'number' ? runner.bestBackSize : null,
            laySize: typeof runner.bestLaySize === 'number' ? runner.bestLaySize : null,
            tradable: bookTradable,
            spreadQuality,
            confidence: bookTradable ? 'medium' : 'low',
            reasons: bookReasons
        },
        ltpEvidence: {
            available: ltp !== null,
            lastTradedPrice: ltp,
            ageSec: null,
            confidence: 'low'
        },
        ladderEvidence: {
            available: ladderAvailable,
            source: ladderSource,
            rows: ladder.length,
            tradedVolume,
            wom: runnerLadderReliable && typeof runner.wom === 'number' ? runner.wom : null,
            moneyFlow: mf ? { back: mf.back ?? null, lay: mf.lay ?? null } : null,
            confidence: ladderAvailable ? 'medium' : 'low',
            reasons: ladderReasons
        }
    };
}

