import { loadTimeline as loadTimelineDefault } from '../../sofa/timelineStore.js';
import {
    buildBetfairSessionHealth as buildBetfairSessionHealthDefault,
    getLatestValidBetfairTick as getLatestValidBetfairTickDefault,
    getValidBetfairTicks as getValidBetfairTicksDefault
} from '../../sofa/betfairHealth.js';
import {
    getBetfairTrackingRuntime as getBetfairTrackingRuntimeDefault
} from '../../sofa/matchTracker.js';
import { checkCdpStatus as checkCdpStatusDefault } from './cdpStatus.js';
import {
    buildMoneyFlowHistorySeries as buildMoneyFlowHistorySeriesDefault
} from './moneyFlowHistorySeries.js';
import {
    getMatchPersistenceIntegrity as getMatchPersistenceIntegrityDefault
} from '../../sofa/matchHistory.js';

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

export function normalizeIntegrity(raw) {
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
        source: raw.source === 'betfair' ? 'betfair' : null,
        commitId: typeof raw.commitId === 'string' ? raw.commitId : null,
        affectedDocuments: normalizeAffectedDocuments(raw.affectedDocuments)
    };
}

export function withIntegrity(document, integrity) {
    const clone = JSON.parse(JSON.stringify(document));
    clone.integrity = normalizeIntegrity(integrity);
    return clone;
}

export function isMissingIntegrityConflict(integrity) {
    return integrity?.status === 'partial_persistence' ||
        integrity?.status === 'recovery_failed';
}

export function buildMissingBetfairResponse(integrity, notFoundBody) {
    const normalized = normalizeIntegrity(integrity);

    if (isMissingIntegrityConflict(normalized)) {
        return {
            httpStatus: 409,
            body: {
                ...notFoundBody,
                error: 'persistence_integrity',
                integrity: normalized
            }
        };
    }

    return {
        httpStatus: 404,
        body: notFoundBody
    };
}

export function buildBetfairJsonResponse(
    eventId,
    dependencies = {}
) {
    const loadTimeline = typeof dependencies.loadTimeline === 'function'
        ? dependencies.loadTimeline
        : loadTimelineDefault;
    const getIntegrity = typeof dependencies.getMatchPersistenceIntegrity === 'function'
        ? dependencies.getMatchPersistenceIntegrity
        : getMatchPersistenceIntegrityDefault;

    const timeline = loadTimeline('betfair', eventId);
    const integrity = getIntegrity(eventId, 'betfair');

    if (!timeline) {
        return buildMissingBetfairResponse(
            integrity,
            { error: 'Betfair JSON timeline not found for this event' }
        );
    }

    return {
        httpStatus: 200,
        body: withIntegrity(timeline, integrity)
    };
}

export async function buildLatestBetfairPayload({
    eventId,
    mode = '',
    cdpUrl = '',
    dependencies = {}
}) {
    const loadTimeline = typeof dependencies.loadTimeline === 'function'
        ? dependencies.loadTimeline
        : loadTimelineDefault;

    const buildBetfairSessionHealth =
        typeof dependencies.buildBetfairSessionHealth === 'function'
            ? dependencies.buildBetfairSessionHealth
            : buildBetfairSessionHealthDefault;

    const getLatestValidBetfairTick =
        typeof dependencies.getLatestValidBetfairTick === 'function'
            ? dependencies.getLatestValidBetfairTick
            : getLatestValidBetfairTickDefault;

    const getValidBetfairTicks =
        typeof dependencies.getValidBetfairTicks === 'function'
            ? dependencies.getValidBetfairTicks
            : getValidBetfairTicksDefault;

    const getBetfairTrackingRuntime =
        typeof dependencies.getBetfairTrackingRuntime === 'function'
            ? dependencies.getBetfairTrackingRuntime
            : getBetfairTrackingRuntimeDefault;

    const checkCdpStatus = typeof dependencies.checkCdpStatus === 'function'
        ? dependencies.checkCdpStatus
        : checkCdpStatusDefault;

    const buildMoneyFlowHistorySeries =
        typeof dependencies.buildMoneyFlowHistorySeries === 'function'
            ? dependencies.buildMoneyFlowHistorySeries
            : buildMoneyFlowHistorySeriesDefault;

    const getIntegrity = typeof dependencies.getMatchPersistenceIntegrity === 'function'
        ? dependencies.getMatchPersistenceIntegrity
        : getMatchPersistenceIntegrityDefault;

    const now = dependencies.now instanceof Date
        ? dependencies.now
        : new Date();

    const cdpStatus = await checkCdpStatus(mode, cdpUrl);
    const betfairTimeline = loadTimeline('betfair', eventId);
    const sofaTimeline = loadTimeline('sofa', eventId);
    const runtime = getBetfairTrackingRuntime(eventId);
    const integrity = getIntegrity(eventId, 'betfair');

    if (!betfairTimeline) {
        const health = buildBetfairSessionHealth({
            betfairTimeline: null,
            sofaTimeline,
            cdpStatus,
            runtime,
            now
        });

        return buildMissingBetfairResponse(
            integrity,
            {
                ok: false,
                error: 'Betfair JSON timeline not found for this event',
                health
            }
        );
    }

    const latestValidTick = getLatestValidBetfairTick(betfairTimeline);
    const latest = latestValidTick?.data || null;
    const latestTimestamp = latestValidTick?.timestamp || null;

    const health = buildBetfairSessionHealth({
        betfairTimeline,
        sofaTimeline,
        cdpStatus,
        runtime,
        now
    });

    const validTicks = getValidBetfairTicks(betfairTimeline);
    const recentTicks = validTicks.slice(-20);
    const moneyFlowHistory = buildMoneyFlowHistorySeries(recentTicks);

    const metadata = betfairTimeline.metadata || {};

    return {
        httpStatus: 200,
        body: {
            ok: latestValidTick ? true : false,
            eventId,
            latest,
            latestTimestamp,
            health,
            moneyFlowHistory,
            integrity: normalizeIntegrity(integrity),
            metadata: {
                eventId: metadata.eventId || eventId,
                source: metadata.source || 'betfair',
                players: metadata.players || {},
                tournament: metadata.tournament || '',
                updatedAt: betfairTimeline.updatedAt ||
                    metadata.updatedAt ||
                    now.toISOString()
            }
        }
    };
}
