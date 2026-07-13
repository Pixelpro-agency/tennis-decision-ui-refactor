import { loadTimeline } from '../timelineStore.js';
import { getLatestValidBetfairTick } from '../betfairHealth.js';
import { extractLookbackEntries } from '../marketFlowEvidence.js';
import { getLatestSofaTick, getRecentSofaTicks } from './timeline.js';
import { buildEvidenceFromTicks } from './evidenceBuilder.js';
import { buildSourceIdentity, selectActiveBetfairMarketEpoch } from './sourceIdentity.js';
import {
    applyManualConfirmation,
    buildConfirmationContext
} from './sourceIdentityConfirmation.js';
import {
    findApplicableSourceIdentityConfirmation
} from './sourceIdentityConfirmationStore.js';
import { getMatchPersistenceIntegrity as getMatchPersistenceIntegrityDefault } from '../matchHistory.js';

const PERSISTENCE_INCOMPLETE_REASON = 'Persistence incomplete: canonical cross-source evidence unavailable';
const VALID_INTEGRITY_STATUSES = new Set([
    'no_known_partial',
    'partial_persistence',
    'recovery_failed'
]);
const VALID_AFFECTED_DOCUMENTS = new Set(['history', 'timeline']);

function normalizeAffectedDocuments(value) {
    return Array.isArray(value)
        ? value.filter(name => VALID_AFFECTED_DOCUMENTS.has(name))
        : [];
}

function hasTimelineEntries(timeline) {
    return !!(timeline && Array.isArray(timeline.timeline) && timeline.timeline.length > 0);
}

function getAllBetfairTicks(betfairTimeline) {
    const ticks = Array.isArray(betfairTimeline?.timeline)
        ? betfairTimeline.timeline
        : [];

    return ticks.slice(Math.max(0, ticks.length - 21), ticks.length);
}

function normalizeSourceIntegrity(raw, expectedSource) {
    if (!raw || typeof raw !== 'object') {
        return {
            status: 'no_known_partial',
            reason: null,
            source: null,
            commitId: null,
            affectedDocuments: []
        };
    }

    return {
        status: VALID_INTEGRITY_STATUSES.has(raw.status)
            ? raw.status
            : 'no_known_partial',
        reason: typeof raw.reason === 'string' ? raw.reason : null,
        source: raw.source === expectedSource ? expectedSource : null,
        commitId: typeof raw.commitId === 'string' ? raw.commitId : null,
        affectedDocuments: normalizeAffectedDocuments(raw.affectedDocuments)
    };
}

function isPersistenceConflict(integrity) {
    return integrity?.status === 'partial_persistence' ||
        integrity?.status === 'recovery_failed';
}

export function buildIntegritySummary(sofaIntegrity, betfairIntegrity) {
    const sofa = normalizeSourceIntegrity(sofaIntegrity, 'sofa');
    const betfair = normalizeSourceIntegrity(betfairIntegrity, 'betfair');

    const affectedSources = [];
    if (isPersistenceConflict(sofa)) affectedSources.push('sofa');
    if (isPersistenceConflict(betfair)) affectedSources.push('betfair');

    let status = 'no_known_partial';
    let reason = null;

    if (affectedSources.length > 0) {
        const hasRecovery = sofa.status === 'recovery_failed' ||
            betfair.status === 'recovery_failed';
        status = hasRecovery ? 'recovery_failed' : 'partial_persistence';
        reason = hasRecovery ? 'recovery_failed' : 'pending_commit';
    }

    return {
        status,
        reason,
        affectedSources,
        sources: { sofa, betfair }
    };
}

export function buildSourceIdentityConfirmationStateFromTimelines({
    eventId,
    sofaTimeline = null,
    betfairTimeline = null
} = {}) {
    const sofaFound = hasTimelineEntries(sofaTimeline);
    const betfairFound = hasTimelineEntries(betfairTimeline);

    if (!sofaFound && !betfairFound) {
        return {
            missing: true,
            reasons: ['SofaScore timeline missing', 'Betfair timeline missing'],
            automaticSourceIdentity: null,
            confirmationContext: null
        };
    }

    const sofaTick = sofaFound ? getLatestSofaTick(sofaTimeline) : null;
    const activeBetfairEpoch = betfairFound
        ? selectActiveBetfairMarketEpoch(betfairTimeline.timeline)
        : {
            ticks: [],
            lastTick: null,
            signature: null,
            reasons: ['Betfair timeline missing']
        };

    const activeBetfairTimeline = betfairFound
        ? {
            ...betfairTimeline,
            timeline: activeBetfairEpoch.ticks.slice()
        }
        : null;

    const activeBetfairTick = activeBetfairEpoch.lastTick
        ? getLatestValidBetfairTick({
            ...(betfairTimeline || {}),
            timeline: [activeBetfairEpoch.lastTick]
        })
        : null;

    const automaticSourceIdentity = buildSourceIdentity({
        sofaTick,
        betfairTick: activeBetfairEpoch.lastTick,
        epochReasons: activeBetfairEpoch.reasons
    });

    const confirmationContext = buildConfirmationContext({
        eventId,
        activeBetfairEpoch,
        betfairTick: activeBetfairEpoch.lastTick,
        sourceIdentity: automaticSourceIdentity
    });

    return {
        missing: false,
        reasons: [],
        sofaFound,
        betfairFound,
        sofaTick,
        activeBetfairEpoch,
        activeBetfairTimeline,
        activeBetfairTick,
        automaticSourceIdentity,
        confirmationContext
    };
}

export function getLatestSourceIdentityConfirmationState(eventId) {
    return buildSourceIdentityConfirmationStateFromTimelines({
        eventId,
        sofaTimeline: loadTimeline('sofa', eventId),
        betfairTimeline: loadTimeline('betfair', eventId)
    });
}

function getPersistedConfirmation(context, confirmationRecord) {
    if (confirmationRecord !== undefined) {
        return confirmationRecord;
    }

    try {
        const lookup = findApplicableSourceIdentityConfirmation(context);
        return lookup.ok ? lookup.confirmation : null;
    } catch (_) {
        return null;
    }
}

export function buildLatestMatchEvidence(eventId, options = {}) {
    const now = options.now instanceof Date ? options.now : new Date();

    return buildLatestMatchEvidenceFromTimelines({
        eventId,
        sofaTimeline: loadTimeline('sofa', eventId),
        betfairTimeline: loadTimeline('betfair', eventId),
        now,
        confirmationRecord: options.confirmationRecord,
        dependencies: options.dependencies || {}
    });
}

export function buildLatestMatchEvidenceFromTimelines({
    eventId,
    sofaTimeline = null,
    betfairTimeline = null,
    now = new Date(),
    confirmationRecord = undefined,
    dependencies = {}
} = {}) {
    const resolvedNow = now instanceof Date ? now : new Date();
    const getIntegrity = typeof dependencies.getMatchPersistenceIntegrity === 'function'
        ? dependencies.getMatchPersistenceIntegrity
        : getMatchPersistenceIntegrityDefault;

    const sofaIntegrity = getIntegrity(eventId, 'sofa');
    const betfairIntegrity = getIntegrity(eventId, 'betfair');
    const integrity = buildIntegritySummary(sofaIntegrity, betfairIntegrity);

    const state = buildSourceIdentityConfirmationStateFromTimelines({
        eventId,
        sofaTimeline,
        betfairTimeline
    });

    if (state.missing) {
        return {
            ok: false,
            missing: true,
            reasons: state.reasons,
            integrity
        };
    }

    const persistedConfirmation = state.automaticSourceIdentity.status === 'pending'
        ? getPersistedConfirmation(state.confirmationContext, confirmationRecord)
        : null;

    const sourceIdentity = applyManualConfirmation({
        sourceIdentity: state.automaticSourceIdentity,
        context: state.confirmationContext,
        confirmation: persistedConfirmation
    });

    const recentSofaTicks = state.sofaFound ? getRecentSofaTicks(sofaTimeline, 10) : [];
    const lookbackEntries = state.activeBetfairTimeline
        ? extractLookbackEntries(state.activeBetfairTimeline)
        : [];
    const allSofaTicks = state.sofaFound ? getRecentSofaTicks(sofaTimeline, 60) : [];
    const allBetfairTicks = getAllBetfairTicks(state.activeBetfairTimeline);

    const marketReactionSofaTicks = state.sofaFound
        ? sofaTimeline.timeline.slice()
        : [];

    const marketReactionBetfairTicks = state.activeBetfairTimeline
        ? state.activeBetfairTimeline.timeline.slice()
        : [];

    const evidence = buildEvidenceFromTicks({
        sofaTick: state.sofaTick,
        betfairTick: state.activeBetfairTick,
        recentSofaTicks,
        lookbackEntries,
        allSofaTicks,
        allBetfairTicks,
        now: resolvedNow,
        marketReactionSofaTicks,
        marketReactionBetfairTicks,
        sourceIdentity,
        integrity
    });

    const sofaMeta = sofaTimeline?.metadata || {};
    const betfairMeta = betfairTimeline?.metadata || {};
    const players = sofaMeta.players || betfairMeta.players || null;
    const tournament = sofaMeta.tournament || betfairMeta.tournament || null;

    evidence.metadata.eventId = eventId;
    evidence.metadata.players = players;
    evidence.metadata.tournament = tournament;

    return {
        ok: true,
        missing: false,
        evidence,
        sources: {
            sofaTimelineFound: state.sofaFound,
            betfairTimelineFound: state.betfairFound
        },
        integrity
    };
}
