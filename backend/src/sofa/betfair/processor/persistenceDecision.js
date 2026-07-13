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

    const existingTimeline = dependencies.loadTimeline('betfair', eventId);
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
