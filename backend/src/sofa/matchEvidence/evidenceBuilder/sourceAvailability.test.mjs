import { buildEvidenceFromTicks } from '../evidenceBuilder.js';
import { buildSourceIdentity, createPendingSourceIdentity } from '../sourceIdentity.js';
import {
    alignedIdentity,
    assert,
    betfairAfter,
    betfairBefore,
    finish,
    makeBetfairTick,
    makeSofaTick,
    now,
    sofaAfter,
    sofaBefore
} from './evidenceBuilderTestFixtures.mjs';

{
    const evidence = buildEvidenceFromTicks({
        sofaTick: sofaAfter,
        betfairTick: betfairAfter,
        recentSofaTicks: [sofaBefore, sofaAfter],
        lookbackEntries: [betfairBefore],
        allSofaTicks: [sofaBefore, sofaAfter],
        allBetfairTicks: [betfairBefore, betfairAfter],
        marketReactionSofaTicks: [sofaBefore, sofaAfter],
        marketReactionBetfairTicks: [betfairBefore, betfairAfter],
        sourceIdentity: createPendingSourceIdentity(['Betfair runner names unavailable or incomplete']),
        now
    });

    const reason = 'Source identity pending: cross-source observations unavailable';

    assert(evidence.marketReactionEvidence.sourceIdentity.status === 'pending', 'pending identity is exposed');
    assert(evidence.marketReactionEvidence.available === false, 'pending identity suspends Market Reactions');
    assert(evidence.marketReactionEvidence.summary.causalityClaimed === false, 'pending keeps causality disabled');
    assert(evidence.marketReactionEvidence.summary.reasons.includes(reason), 'pending summary reason is explicit');
    assert(evidence.noTradeReasons.includes(reason), 'pending reason is added to no-trade reasons');
    assert(evidence.dataQuality.betfairRecent === true, 'fresh pending Betfair tick remains technically recent');
    assert(evidence.marketEvidence.runners.length === 0, 'fresh pending Betfair tick remains unattributed');
    assert(
        !evidence.dataQuality.reasons.includes('Betfair timeline missing'),
        'fresh pending Betfair tick is not reported as missing'
    );
    assert(
        !evidence.noTradeReasons.includes('Betfair tick too old or missing'),
        'fresh pending Betfair tick does not add stale-or-missing reason'
    );
}

{
    const mismatchBetfairTick = makeBetfairTick(
        '2026-06-21T12:00:30.000Z',
        2,
        1.7,
        6200,
        1200,
        'back',
        ['Jan-Lennard Struff', 'Nuno Borges']
    );

    const mismatchIdentity = buildSourceIdentity({
        sofaTick: sofaAfter,
        betfairTick: mismatchBetfairTick
    });

    const evidence = buildEvidenceFromTicks({
        sofaTick: sofaAfter,
        betfairTick: mismatchBetfairTick,
        recentSofaTicks: [sofaBefore, sofaAfter],
        lookbackEntries: [betfairBefore],
        allSofaTicks: [sofaBefore, sofaAfter],
        allBetfairTicks: [betfairBefore, mismatchBetfairTick],
        marketReactionSofaTicks: [sofaBefore, sofaAfter],
        marketReactionBetfairTicks: [betfairBefore, mismatchBetfairTick],
        sourceIdentity: mismatchIdentity,
        now
    });

    const reason = 'Source identity mismatch: cross-source observations unavailable';

    assert(mismatchIdentity.status === 'mismatch', 'mismatch fixture is valid');
    assert(evidence.marketEvidence.runners.length === 0, 'mismatch does not attribute market runners');
    assert(evidence.marketReactionEvidence.available === false, 'mismatch suspends Market Reactions');
    assert(evidence.marketReactionEvidence.summary.reasons.includes(reason), 'mismatch summary reason is explicit');
    assert(evidence.noTradeReasons.includes(reason), 'mismatch reason is added to no-trade reasons');
    assert(evidence.dataQuality.betfairRecent === true, 'fresh mismatched Betfair tick remains technically recent');
    assert(
        !evidence.dataQuality.reasons.includes('Betfair timeline missing'),
        'fresh mismatched Betfair tick is not reported as missing'
    );
    assert(
        !evidence.noTradeReasons.includes('Betfair tick too old or missing'),
        'fresh mismatched Betfair tick does not add stale-or-missing reason'
    );
}

{
    const sofaOnlyEvidence = buildEvidenceFromTicks({
        sofaTick: sofaAfter,
        betfairTick: null,
        recentSofaTicks: [sofaBefore, sofaAfter],
        lookbackEntries: [],
        allSofaTicks: [sofaBefore, sofaAfter],
        allBetfairTicks: [],
        marketReactionSofaTicks: [sofaBefore, sofaAfter],
        marketReactionBetfairTicks: [],
        sourceIdentity: createPendingSourceIdentity(['Betfair runner names unavailable or incomplete']),
        now
    });

    assert(sofaOnlyEvidence.dataQuality.betfairRecent === false, 'Sofa-only evidence has no recent Betfair tick');
    assert(
        sofaOnlyEvidence.dataQuality.reasons.includes('Betfair timeline missing'),
        'Sofa-only evidence reports missing Betfair timeline'
    );
    assert(
        sofaOnlyEvidence.noTradeReasons.includes('Betfair tick too old or missing'),
        'Sofa-only evidence retains stale-or-missing Betfair reason'
    );
    assert(sofaOnlyEvidence.marketEvidence.runners.length === 0, 'Sofa-only evidence has no market runners');
    assert(sofaOnlyEvidence.marketReactionEvidence.available === false, 'Sofa-only evidence suspends Market Reactions');
    assert(sofaOnlyEvidence.marketReactionEvidence.summary.causalityClaimed === false, 'Sofa-only causality remains disabled');
}

finish('evidenceBuilder/availability');
