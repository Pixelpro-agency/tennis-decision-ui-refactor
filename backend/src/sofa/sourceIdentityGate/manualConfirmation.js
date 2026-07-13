import {
    buildSourceIdentity,
    selectActiveBetfairMarketEpoch
} from '../matchEvidence/sourceIdentity.js';
import {
    buildConfirmationContext,
    validateManualConfirmation,
    applyManualConfirmation
} from '../matchEvidence/sourceIdentityConfirmation.js';
import { upsertSourceIdentityConfirmation } from '../matchEvidence/sourceIdentityConfirmationStore.js';
import { wrapBetfairTick } from './sampleValidation.js';
import { cloneSourceIdentity } from './sessionFactory.js';

export function confirmGateSession(session, eventId, { selectedPairs, confirmationText }) {
    if (!session) {
        return { ok: false, code: 'session_not_found' };
    }

    if (session.phase === 'collecting') {
        return { ok: false, code: 'confirmation_context_incomplete' };
    }

    if (session.phase === 'mismatch' || session.phase === 'recording') {
        return { ok: false, code: 'automatic_identity_not_pending' };
    }

    if (session.phase !== 'pending') {
        return { ok: false, code: 'invalid_phase' };
    }

    const sofaTick = session.sofaSample.snapshot || session.sofaSample;
    const betfairTick = wrapBetfairTick(session.betfairSample, session.betfairKey);
    const epoch = selectActiveBetfairMarketEpoch([betfairTick]);

    const sourceIdentity = buildSourceIdentity({
        sofaTick,
        betfairTick,
        epochReasons: epoch.reasons
    });

    const context = buildConfirmationContext({
        eventId,
        activeBetfairEpoch: epoch,
        sourceIdentity
    });

    const validation = validateManualConfirmation({
        confirmationText,
        selectedPairs,
        sourceIdentity,
        context
    });

    if (!validation.ok) {
        return { ok: false, code: validation.code };
    }

    const upsertConfirmation = session.dependencies?.upsertSourceIdentityConfirmation
        || upsertSourceIdentityConfirmation;

    const persisted = upsertConfirmation(validation.record);
    if (!persisted.ok) {
        return { ok: false, code: 'persistence_failed' };
    }

    const effectiveIdentity = applyManualConfirmation({
        sourceIdentity,
        context,
        confirmation: validation.record
    });

    session.sourceIdentity = cloneSourceIdentity(effectiveIdentity);

    if (effectiveIdentity.status === 'aligned') {
        if (session.attemptedBootstrapGeneration === session.bufferGeneration) {
            session.phase = 'pending';
            return { ok: false, code: 'bootstrap_persistence_failed' };
        }
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
                return { ok: false, code: 'bootstrap_persistence_failed' };
            }
            session.phase = 'recording';
            session.recordingCalled = true;
            session.recordingGeneration = session.bufferGeneration;
            session.error = null;
        } catch (_) {
            session.phase = 'pending';
            session.error = 'Bootstrap persistence failed';
            return { ok: false, code: 'bootstrap_persistence_failed' };
        }
    }

    return { ok: true, sourceIdentity: session.sourceIdentity, phase: session.phase };
}
