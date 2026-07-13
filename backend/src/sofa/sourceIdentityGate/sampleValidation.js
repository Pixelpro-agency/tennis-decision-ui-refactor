import { buildBetfairIdentitySignature } from '../matchEvidence/sourceIdentity.js';

export function isValidSofaSample(sample) {
    if (!sample) return false;
    const players = sample.snapshot?.players || sample.players;
    if (!players) return false;
    const home = players.home?.name || players.home?.fullName || '';
    const away = players.away?.name || players.away?.fullName || '';
    return home.trim().length > 0 && away.trim().length > 0;
}

export function wrapBetfairTick(sample, key) {
    if (sample && sample.data && typeof sample.data === 'object') {
        return sample;
    }
    return {
        data: {
            runners: sample?.runners || [],
            market: {
                marketId: sample?.market_info?.market_id || sample?.market?.marketId || ''
            },
            marketKey: sample?.marketKey || key || ''
        }
    };
}

export function isValidBetfairSample(sample, key) {
    if (!sample) return false;
    const runners = sample.runners || (sample.data && sample.data.runners) || [];
    if (runners.length !== 2) return false;

    const r1 = runners[0];
    const r2 = runners[1];
    if (!r1?.name?.trim() || !r2?.name?.trim()) return false;

    const selId1 = String(r1.selectionId ?? '').trim();
    const selId2 = String(r2.selectionId ?? '').trim();
    if (!selId1 || !selId2 || selId1 === selId2) return false;

    const tick = wrapBetfairTick(sample, key);
    const signature = buildBetfairIdentitySignature(tick);
    return !!signature;
}
