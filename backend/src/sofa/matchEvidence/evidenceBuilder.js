import { buildAlignment } from './alignment.js';
import { buildAlignmentExtension } from './alignmentExtension.js';
import { buildDataQuality } from './dataQuality.js';
import { buildNoTradeReasons } from './noTradeReasons.js';
import { buildSofaEvidence } from './sofaEvidence.js';
import { buildMarketEvidence } from './marketEvidence.js';
import { buildMarketReactionEvidence } from '../marketReactionEvidence.js';
import { createPendingSourceIdentity } from './sourceIdentity.js';

const PERSISTENCE_INCOMPLETE_REASON = 'Persistence incomplete: canonical cross-source evidence unavailable';

function uniqueStrings(values) {
    return [...new Set(
        (Array.isArray(values) ? values : [])
            .filter(value => typeof value === 'string' && value.length > 0)
    )];
}

function copyStringArray(value) {
    return Array.isArray(value)
        ? value.filter(item => typeof item === 'string').slice()
        : [];
}

function normalizeSourceIdentity(sourceIdentity) {
    if (!sourceIdentity || !['aligned', 'pending', 'mismatch'].includes(sourceIdentity.status)) {
        return createPendingSourceIdentity(['Source identity has not been evaluated']);
    }

    const normalizedPairs = Array.isArray(sourceIdentity.normalizedPairs)
        ? sourceIdentity.normalizedPairs.map(pair => ({
            sofaPlayer: typeof pair?.sofaPlayer === 'string' ? pair.sofaPlayer : '',
            betfairRunner: typeof pair?.betfairRunner === 'string' ? pair.betfairRunner : '',
            normalizedSofaPlayer: typeof pair?.normalizedSofaPlayer === 'string' ? pair.normalizedSofaPlayer : '',
            normalizedBetfairRunner: typeof pair?.normalizedBetfairRunner === 'string' ? pair.normalizedBetfairRunner : '',
            match: pair?.match === true
        }))
        : [];

    return {
        status: sourceIdentity.status,
        sofaPlayers: copyStringArray(sourceIdentity.sofaPlayers),
        betfairRunners: copyStringArray(sourceIdentity.betfairRunners),
        normalizedSofaPlayers: copyStringArray(sourceIdentity.normalizedSofaPlayers),
        normalizedBetfairRunners: copyStringArray(sourceIdentity.normalizedBetfairRunners),
        normalizedPairs,
        reasons: uniqueStrings(sourceIdentity.reasons)
    };
}

function isPersistenceConflict(integrity) {
    return integrity?.status === 'partial_persistence' ||
        integrity?.status === 'recovery_failed';
}

function getCrossSourceUnavailableReason(status) {
    if (status === 'mismatch') {
        return 'Source identity mismatch: cross-source observations unavailable';
    }

    return 'Source identity pending: cross-source observations unavailable';
}

export function buildEvidenceFromTicks({
    sofaTick,
    betfairTick,
    recentSofaTicks = [],
    lookbackEntries = [],
    allSofaTicks,
    allBetfairTicks,
    now,
    marketReactionSofaTicks = [],
    marketReactionBetfairTicks = [],
    sourceIdentity,
    integrity = {
        status: 'no_known_partial',
        reason: null,
        affectedSources: [],
        sources: {}
    }
}) {
    const resolvedSourceIdentity = normalizeSourceIdentity(sourceIdentity);
    const persistenceConflict = isPersistenceConflict(integrity);
    const crossSourceAllowed = resolvedSourceIdentity.status === 'aligned' &&
        !persistenceConflict;
    const scopedBetfairTick = crossSourceAllowed ? betfairTick : null;
    const scopedLookbackEntries = crossSourceAllowed ? lookbackEntries : [];
    const scopedAllBetfairTicks = crossSourceAllowed ? allBetfairTicks : [];
    const scopedMarketReactionSofaTicks = crossSourceAllowed ? marketReactionSofaTicks : [];
    const scopedMarketReactionBetfairTicks = crossSourceAllowed ? marketReactionBetfairTicks : [];

    const alignment = buildAlignment({ sofaTick, betfairTick: scopedBetfairTick, now });
    const dataQuality = buildDataQuality({ sofaTick, betfairTick, alignment, now, integrity });
    const sofaEvidence = buildSofaEvidence(sofaTick, recentSofaTicks, now);
    const marketEvidence = buildMarketEvidence(
        scopedBetfairTick,
        dataQuality.betfairRecent,
        dataQuality.graphHealth,
        scopedLookbackEntries
    );

    const alignmentExt = buildAlignmentExtension({
        sofaEvidence,
        marketEvidence,
        betfairTick: scopedBetfairTick,
        now,
        allSofaTicks: Array.isArray(allSofaTicks) ? allSofaTicks : recentSofaTicks,
        allBetfairTicks: Array.isArray(scopedAllBetfairTicks) ? scopedAllBetfairTicks : scopedLookbackEntries
    });
    Object.assign(alignment, alignmentExt);

    const noTradeReasons = buildNoTradeReasons(dataQuality, alignment, integrity);

    const baseMarketReactionEvidence = buildMarketReactionEvidence({
        sofaTicks: Array.isArray(scopedMarketReactionSofaTicks) ? scopedMarketReactionSofaTicks : [],
        betfairTicks: Array.isArray(scopedMarketReactionBetfairTicks) ? scopedMarketReactionBetfairTicks : [],
        now
    });

    const identityReasons = resolvedSourceIdentity.status === 'aligned'
        ? resolvedSourceIdentity.reasons
        : [...resolvedSourceIdentity.reasons, getCrossSourceUnavailableReason(resolvedSourceIdentity.status)];

    const summaryReasons = uniqueStrings([
        ...(baseMarketReactionEvidence.summary?.reasons || []),
        ...identityReasons,
        ...(persistenceConflict ? [PERSISTENCE_INCOMPLETE_REASON] : [])
    ]);

    const marketReactionEvidence = {
        ...baseMarketReactionEvidence,
        available: crossSourceAllowed ? baseMarketReactionEvidence.available : false,
        sourceIdentity: resolvedSourceIdentity,
        summary: {
            ...baseMarketReactionEvidence.summary,
            causalityClaimed: false,
            reasons: summaryReasons
        }
    };

    if (!crossSourceAllowed && resolvedSourceIdentity.status !== 'aligned') {
        const crossSourceUnavailableReason = getCrossSourceUnavailableReason(resolvedSourceIdentity.status);
        if (!noTradeReasons.includes(crossSourceUnavailableReason)) {
            noTradeReasons.push(crossSourceUnavailableReason);
        }
    }

    if (persistenceConflict) {
        if (!noTradeReasons.includes(PERSISTENCE_INCOMPLETE_REASON)) {
            noTradeReasons.push(PERSISTENCE_INCOMPLETE_REASON);
        }
    }

    const sofaData = sofaTick?.data || {};
    const betfairMeta = scopedBetfairTick?.data || {};
    const players = sofaData.players || betfairMeta.players || null;
    const tournament = null;

    return {
        metadata: {
            eventId: sofaData.eventId || betfairMeta.eventId || null,
            players,
            tournament,
            updatedAt: now.toISOString()
        },
        alignment,
        dataQuality,
        sofaEvidence,
        marketEvidence,
        marketReactionEvidence,
        valueHypothesis: {
            enabled: false,
            reason: 'Sofa-only model not calibrated yet',
            sofaContextOdds: null,
            marketOdds: null,
            valueGap: null,
            direction: 'none',
            confidence: 'low'
        },
        externalEvidence: {
            tradeOnTennis: {
                available: false,
                prematchWinProbability: null,
                liveWinProbability: null,
                fairOdds: null,
                playerForm6m: null,
                playerForm12m: null,
                playerForm18m: null,
                notes: 'Placeholder for future integration'
            }
        },
        noTradeReasons
    };
}
