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
        sourceIdentity: alignedIdentity,
        now
    });

    assert(alignedIdentity.status === 'aligned', 'aligned identity fixture is valid');
    assert(evidence.marketReactionEvidence.sourceIdentity.status === 'aligned', 'aligned identity is exposed in Market Reactions');
    assert(evidence.marketReactionEvidence.available === true, 'aligned source identity permits Market Reactions');
    assert(evidence.marketReactionEvidence.marketLedObservation.available === true, 'aligned source identity permits cross-source observation');
    assert(evidence.marketReactionEvidence.summary.causalityClaimed === false, 'causality remains disabled when aligned');
}

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
        now
    });

    assert(
        evidence.marketReactionEvidence.sourceIdentity.status === 'pending',
        'direct builder call without source identity defaults to pending'
    );
    assert(evidence.marketReactionEvidence.available === false, 'missing source identity suspends Market Reactions');
    assert(
        evidence.noTradeReasons.includes('Source identity pending: cross-source observations unavailable'),
        'missing source identity adds pending no-trade reason'
    );
    assert(evidence.dataQuality.betfairRecent === true, 'direct builder keeps fresh technical Betfair quality');
    assert(evidence.marketEvidence.runners.length === 0, 'direct builder without identity does not attribute runners');
    assert(
        !evidence.noTradeReasons.includes('Betfair tick too old or missing'),
        'direct builder with fresh Betfair tick has no stale-or-missing reason'
    );
}

finish('evidenceBuilder/identity');
