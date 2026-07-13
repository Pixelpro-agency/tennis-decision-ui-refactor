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
        integrity: {
            status: 'partial_persistence',
            reason: 'pending_commit',
            affectedSources: ['betfair'],
            sources: {
                sofa: { status: 'no_known_partial', reason: null, source: 'sofa', commitId: null, affectedDocuments: [] },
                betfair: { status: 'partial_persistence', reason: 'pending_commit', source: 'betfair', commitId: 'betfair-commit', affectedDocuments: ['history'] }
            }
        },
        now
    });

    assert(evidence.dataQuality.betfairRecent === true, 'fresh Betfair tick remains technically recent with partial persistence');
    assert(evidence.dataQuality.persistenceComplete === false, 'persistenceComplete false with partial persistence');
    assert(evidence.marketEvidence.runners.length === 0, 'partial persistence blocks runner attribution');
    assert(evidence.marketReactionEvidence.available === false, 'partial persistence suspends Market Reactions');
    assert(evidence.marketReactionEvidence.summary.causalityClaimed === false, 'partial persistence keeps causality disabled');
    assert(evidence.marketReactionEvidence.sourceIdentity.status === 'aligned', 'source identity effective stays aligned');
    assert(
        evidence.noTradeReasons.includes(
            'Persistence incomplete: canonical cross-source evidence unavailable'
        ),
        'partial persistence adds persistence no-trade reason'
    );
}

{
    const pendingIdentity = createPendingSourceIdentity(['Betfair runner names unavailable or incomplete']);
    const evidence = buildEvidenceFromTicks({
        sofaTick: sofaAfter,
        betfairTick: betfairAfter,
        recentSofaTicks: [sofaBefore, sofaAfter],
        lookbackEntries: [betfairBefore],
        allSofaTicks: [sofaBefore, sofaAfter],
        allBetfairTicks: [betfairBefore, betfairAfter],
        marketReactionSofaTicks: [sofaBefore, sofaAfter],
        marketReactionBetfairTicks: [betfairBefore, betfairAfter],
        sourceIdentity: pendingIdentity,
        integrity: {
            status: 'partial_persistence',
            reason: 'pending_commit',
            affectedSources: ['betfair'],
            sources: {
                sofa: { status: 'no_known_partial', reason: null, source: 'sofa', commitId: null, affectedDocuments: [] },
                betfair: { status: 'partial_persistence', reason: 'pending_commit', source: 'betfair', commitId: 'betfair-commit', affectedDocuments: ['history'] }
            }
        },
        now
    });

    assert(evidence.marketReactionEvidence.sourceIdentity.status === 'pending', 'pending identity preserved with partial persistence');
    assert(evidence.marketReactionEvidence.available === false, 'pending + partial persistence suspends Market Reactions');
    assert(
        evidence.noTradeReasons.includes('Source identity pending: cross-source observations unavailable'),
        'pending reason preserved'
    );
    assert(
        evidence.noTradeReasons.includes('Persistence incomplete: canonical cross-source evidence unavailable'),
        'persistence reason added alongside pending'
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
        integrity: {
            status: 'no_known_partial',
            reason: null,
            affectedSources: [],
            sources: {}
        },
        now
    });

    assert(sofaOnlyEvidence.dataQuality.persistenceComplete === true, 'Sofa-only without journal is persistence complete');
    assert(
        !sofaOnlyEvidence.noTradeReasons.includes(
            'Persistence incomplete: canonical cross-source evidence unavailable'
        ),
        'Sofa-only without journal has no persistence no-trade reason'
    );
}

finish('evidenceBuilder/persistence');
