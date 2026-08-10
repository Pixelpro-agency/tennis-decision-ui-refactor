import {
    buildBetfairTimelineTick,
    findLastAlgorithmicTick,
    isDuplicateBetfairTick,
    isRegressiveBetfairTick
} from '../timeline.js';
import { classifyBetfairTechnicalSample } from './technicalSample.js';
import {
    isGraphLoginStatusOnlySample,
    toCanonicalTimelineView
} from './canonicalTimeline.js';

export function evaluateBetfairPersistenceDecision({
    eventId,
    processedResult,
    marketKey,
    dependencies
}) {
    const technicalSample = classifyBetfairTechnicalSample(processedResult);

    if (!technicalSample.usable) {
        return {
            action: 'unchanged',
            reason: null
        };
    }

    const readResult = typeof dependencies.loadTimelineResult === 'function'
        ? dependencies.loadTimelineResult('betfair', eventId)
        : { status: 'found', timeline: dependencies.loadTimeline('betfair', eventId) };
    if (readResult.status === 'failed') {
        return { action: 'failed', reason: readResult.reason };
    }
    const existingTimeline = readResult.status === 'found' ? readResult.timeline : null;
    const canonicalTimeline = toCanonicalTimelineView(existingTimeline);
    const lastTick = findLastAlgorithmicTick(canonicalTimeline);
    const newTick = buildBetfairTimelineTick(
        processedResult,
        marketKey,
        canonicalTimeline
    );
    const graphLoginStatusOnly = isGraphLoginStatusOnlySample(
        processedResult,
        lastTick
    );

    if (processedResult.timelineIntegrity?.accepted === false &&
        !graphLoginStatusOnly) {
        return {
            action: 'unchanged',
            reason: 'regressive_tick'
        };
    }

    if (isRegressiveBetfairTick(lastTick, newTick)) {
        return {
            action: 'unchanged',
            reason: 'regressive_tick'
        };
    }

    if (isDuplicateBetfairTick(lastTick, newTick)) {
        return {
            action: 'unchanged',
            reason: 'duplicate_tick'
        };
    }

    return {
        action: 'commit',
        canonicalTimeline,
        graphLoginStatusOnly,
        newTick
    };
}
