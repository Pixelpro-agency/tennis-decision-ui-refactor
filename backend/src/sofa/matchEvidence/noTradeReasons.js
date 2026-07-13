const PERSISTENCE_INCOMPLETE_REASON = 'Persistence incomplete: canonical cross-source evidence unavailable';

export function buildNoTradeReasons(dataQuality, alignment, integrity) {
    const reasons = [];
    if (!dataQuality.sofaLive) reasons.push('Sofa market not live');
    if (!dataQuality.sofaRecent) reasons.push('SofaScore tick too old');
    if (!dataQuality.betfairRecent) reasons.push('Betfair tick too old or missing');
    if (!dataQuality.marketTradable) reasons.push('Book is not two-sided');
    if (!dataQuality.ladderReliable) reasons.push('Ladder not reliable; skip moneyFlow analysis');
    if (alignment.alignmentQuality === 'poor') reasons.push('Poor alignment between Sofa and Betfair data');
    if (dataQuality.persistenceComplete === false && !reasons.includes(PERSISTENCE_INCOMPLETE_REASON)) {
        reasons.push(PERSISTENCE_INCOMPLETE_REASON);
    }
    return reasons;
}
