import {
    buildSourceIdentity,
    selectActiveBetfairMarketEpoch
} from '../matchEvidence/sourceIdentity.js';
import {
    buildConfirmationContext,
    isConfirmationContextComplete,
    applyManualConfirmation
} from '../matchEvidence/sourceIdentityConfirmation.js';
import { findApplicableSourceIdentityConfirmation } from '../matchEvidence/sourceIdentityConfirmationStore.js';
import { wrapBetfairTick } from './sampleValidation.js';
import {
    clearMismatchSamples,
    cloneSourceIdentity
} from './sessionFactory.js';

function openRecording(session, effectiveIdentity) {
    session.attemptedBootstrapGeneration = session.bufferGeneration;
    try {
        const res = session.onOpenRecording({
            sofaSample: session.sofaSample,
            sofaPersistenceData: session.sofaPersistenceData,
            betfairSample: session.betfairSample,
            betfairKey: session.betfairKey,
            sourceIdentity: effectiveIdentity
        });

        if (res?.ok !== true) {
            session.phase = 'pending';
            session.error = 'Bootstrap persistence failed';
        } else {
            session.phase = 'recording';
            session.recordingCalled = true;
            session.recordingGeneration = session.bufferGeneration;
            session.error = null;
        }
    } catch (_) {
        session.phase = 'pending';
        session.error = 'Bootstrap persistence failed';
    }
}

function applyMismatch(session, effectiveIdentity) {
    session.phase = 'mismatch';
    clearMismatchSamples(session);

    if (!session.mismatchCalled) {
        session.mismatchCalled = true;
        try {
            session.onMismatch({ sourceIdentity: effectiveIdentity });
        } catch (err) {
            console.error('Error in onMismatch callback:', err);
        }
    }
}

export function buildEffectiveIdentity(session) {
    const sofaTick = session.sofaSample.snapshot || session.sofaSample;
    const betfairTick = wrapBetfairTick(session.betfairSample, session.betfairKey);
    const epoch = selectActiveBetfairMarketEpoch([betfairTick]);

    const sourceIdentity = buildSourceIdentity({
        sofaTick,
        betfairTick,
        epochReasons: epoch.reasons
    });

    let effectiveIdentity = sourceIdentity;
    const context = buildConfirmationContext({
        eventId: session.eventId,
        activeBetfairEpoch: epoch,
        sourceIdentity
    });

    const findConfirmation = session.dependencies?.findApplicableSourceIdentityConfirmation
        || findApplicableSourceIdentityConfirmation;

    if (isConfirmationContextComplete(context)) {
        const lookup = findConfirmation(context);
        if (lookup.ok && lookup.confirmation) {
            effectiveIdentity = applyManualConfirmation({
                sourceIdentity,
                context,
                confirmation: lookup.confirmation
            });
        }
    }

    return { effectiveIdentity, sourceIdentity, epoch };
}

export function evaluateGateSession(session) {
    if (session.phase === 'mismatch' || session.phase === 'stopped') {
        return;
    }

    if (!session.hasBetfairUrl) {
        session.phase = 'not-applicable';
        session.updatedAt = new Date().toISOString();
        return;
    }

    if (!session.sofaSample || !session.betfairSample) {
        session.phase = 'collecting';
        session.updatedAt = new Date().toISOString();
        return;
    }

    const { effectiveIdentity } = buildEffectiveIdentity(session);
    session.sourceIdentity = cloneSourceIdentity(effectiveIdentity);

    if (effectiveIdentity.status === 'aligned') {
        if (session.recordingGeneration !== session.bufferGeneration) {
            if (session.attemptedBootstrapGeneration === session.bufferGeneration) {
                session.phase = 'pending';
            } else {
                openRecording(session, effectiveIdentity);
            }
        } else {
            session.phase = 'recording';
        }
    } else if (effectiveIdentity.status === 'mismatch') {
        applyMismatch(session, effectiveIdentity);
    } else {
        if (session.phase === 'recording') {
            session.bufferGeneration += 1;
            session.recordingCalled = false;
            session.error = null;
        }
        session.phase = 'pending';
    }

    session.updatedAt = new Date().toISOString();
}
