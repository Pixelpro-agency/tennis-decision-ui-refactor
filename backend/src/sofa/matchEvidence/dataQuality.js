import { SOFA_RECENT_SEC, BETFAIR_RECENT_SEC, ageSec } from './time.js';
import { isReliableLadderSource } from './ladder.js';

const PERSISTENCE_INCOMPLETE_REASON = 'Persistence incomplete: canonical cross-source evidence unavailable';

const INVALID_MONEY_FLOW_REASONS_ME = new Set([
    'matched_total_decreased',
    'runner_delta_exceeds_market_delta',
    'classified_volume_exceeds_runner_delta',
    'runner_delta_raw_computed_mismatch',
    'market_delta_raw_computed_mismatch'
]);

function isStatusFinished(status) {
    if (!status) return false;
    if (typeof status === 'string') return /finished|ended|completed|fin/i.test(status);
    if (typeof status === 'object') {
        if (status.finished === true || status.ended === true || status.completed === true) return true;
        return /finished|ended|completed|fin/i.test(String(status.description || status.type || ''));
    }
    return false;
}

function isPersistenceConflict(integrity) {
    return integrity?.status === 'partial_persistence' ||
        integrity?.status === 'recovery_failed';
}

export function buildDataQuality({ sofaTick, betfairTick, alignment, now, integrity }) {
    const reasons = [];

    const sofaData = sofaTick?.data || null;
    const sofaTs = sofaTick?.timestamp || null;
    const sofaAge = sofaTick ? ageSec(sofaTs, now) : null;

    const sofaLive = sofaData !== null && !isStatusFinished(sofaData.status);
    const sofaRecent = sofaAge !== null && sofaAge <= SOFA_RECENT_SEC;

    if (!sofaData) reasons.push('SofaScore timeline missing');
    else if (!sofaRecent) reasons.push('SofaScore tick too old');

    const betfairData = betfairTick?.data || null;
    const betfairTs = betfairTick?.timestamp || null;
    const betfairAge = betfairTick ? ageSec(betfairTs, now) : null;
    const betfairRecent = betfairAge !== null && betfairAge <= BETFAIR_RECENT_SEC;

    if (!betfairData) reasons.push('Betfair timeline missing');
    else if (!betfairRecent) reasons.push('Betfair tick too old');

    const gh = betfairData?.graphHealth || null;
    const graphHealthStatus = gh?.status || 'unknown';
    const graphOk = graphHealthStatus === 'ok';

    if (betfairData && !gh) {
        reasons.push('Graph health unknown');
    } else if (gh) {
        if (gh.status === 'auth_suspected') reasons.push('Graph health indicates possible auth issue');
        else if (gh.status === 'stale') reasons.push('Graph health is stale');
        else if (gh.status === 'temporary_error') reasons.push('Graph health temporary error');
        else if (gh.status === 'bad_graph_url') reasons.push('Graph health:bad graph URL');
        else if (gh.status !== 'ok') reasons.push('Graph health is not ok');
    }

    let ladderReliable = false;
    if (betfairRecent && betfairData && graphOk) {
        const runners = Array.isArray(betfairData.runners) ? betfairData.runners : [];
        const hasReliableRunner = runners.some(r =>
            r &&
            isReliableLadderSource(r.ladderSource) &&
            Array.isArray(r.ladder) &&
            r.ladder.length > 0
        );

        if (hasReliableRunner) {
            ladderReliable = true;
        } else {
            const anyLadder = runners.some(r => r && Array.isArray(r.ladder) && r.ladder.length > 0);
            if (!anyLadder) {
                reasons.push('Ladder absent or empty');
            } else {
                reasons.push('Ladder source is book only; moneyFlow not reliable');
            }
        }
    } else if (betfairRecent && betfairData && !graphOk) {
        reasons.push('Ladder not reliable: graph health is not ok');
    }

    let moneyFlowReliable = false;
    if (ladderReliable && betfairData) {
        const runners = Array.isArray(betfairData.runners) ? betfairData.runners : [];
        const hasReliableMF = runners.some(r => {
            if (!r || !isReliableLadderSource(r.ladderSource)) return false;
            if (!Array.isArray(r.ladder) || r.ladder.length === 0) return false;
            const mf = r.moneyFlow;
            if (!mf || typeof mf !== 'object') return false;
            if (typeof mf.back !== 'number' && typeof mf.lay !== 'number') return false;
            if (INVALID_MONEY_FLOW_REASONS_ME.has(mf.reason)) return false;
            if (typeof mf.runnerDelta === 'number' && mf.runnerDelta < 0) return false;
            if (typeof mf.marketDelta === 'number' && mf.marketDelta < 0) return false;
            return true;
        });
        if (hasReliableMF) {
            moneyFlowReliable = true;
        } else if (ladderReliable) {
            reasons.push('Money flow invalidated by TotalMatched gate');
        }
    }

    let marketTradable = false;
    if (betfairRecent && betfairData) {
        const runners = Array.isArray(betfairData.runners) ? betfairData.runners : [];
        for (const r of runners) {
            if (!r) continue;
            const bb = typeof r.bestBack === 'number' ? r.bestBack : null;
            const bl = typeof r.bestLay === 'number' ? r.bestLay : null;
            if (bb !== null && bl !== null && bb > 0 && bl > 0 && bl > bb) {
                marketTradable = true;
                break;
            }
        }
        if (!marketTradable) {
            const hasLtp = runners.some(r => r && typeof r.lastTradedPrice === 'number');
            if (hasLtp) reasons.push('LTP available but book is not tradable');
            else reasons.push('Book is not two-sided');
        }
    }

    if (!reasons.includes('Trade on Tennis unavailable')) {
        reasons.push('Trade on Tennis unavailable');
    }
    if (!reasons.includes('Sofa-only value model not calibrated')) {
        reasons.push('Sofa-only value model not calibrated');
    }

    const persistenceComplete = !isPersistenceConflict(integrity);

    if (!persistenceComplete && !reasons.includes(PERSISTENCE_INCOMPLETE_REASON)) {
        reasons.push(PERSISTENCE_INCOMPLETE_REASON);
    }

    return {
        sofaLive,
        sofaRecent,
        betfairRecent,
        graphHealth: graphHealthStatus,
        ladderReliable,
        moneyFlowReliable,
        marketTradable,
        persistenceComplete,
        reasons
    };
}
