import {
    isValidBetfairSample,
    isValidSofaSample
} from './sourceIdentityGate/sampleValidation.js';
import {
    createGateSession,
    stopGateSession
} from './sourceIdentityGate/sessionFactory.js';
import {
    deleteGateSession,
    getGateSession,
    listGateEventIds,
    setGateSession
} from './sourceIdentityGate/store.js';
import { buildGateStatus } from './sourceIdentityGate/status.js';
import { evaluateGateSession } from './sourceIdentityGate/evaluator.js';
import { confirmGateSession } from './sourceIdentityGate/manualConfirmation.js';

function cloneJson(value) {
    return JSON.parse(JSON.stringify(value));
}

function actionForObservation(phaseBefore, phaseAfter, isValid) {
    if (!isValid) return 'buffered';
    if (phaseBefore === 'not-applicable' || phaseAfter === 'not-applicable') {
        return 'persist-current';
    }
    if (phaseBefore === 'recording' && phaseAfter === 'recording') {
        return 'persist-current';
    }
    if ((phaseBefore === 'collecting' || phaseBefore === 'pending') &&
        phaseAfter === 'recording') {
        return 'bootstrapped';
    }
    if (phaseBefore === 'recording' && phaseAfter === 'pending') {
        return 'buffered';
    }
    if (phaseAfter === 'mismatch') {
        return 'blocked';
    }
    if (phaseBefore === 'collecting' || phaseBefore === 'pending') {
        return 'buffered';
    }
    return 'buffered';
}

export function startSourceIdentityGate(eventId, options = {}) {
    if (!eventId) return;
    setGateSession(eventId, createGateSession(eventId, options));
}

export function observeSofaSourceIdentitySample(eventId, sample, persistenceData = null) {
    const session = getGateSession(eventId);
    if (!session) {
        return { ok: true, phaseBefore: null, phase: null, action: 'no-gate' };
    }
    if (session.phase === 'mismatch' || session.phase === 'stopped') {
        return {
            ok: true,
            phaseBefore: session.phase,
            phase: session.phase,
            action: 'blocked'
        };
    }

    const clonedSample = cloneJson(sample);
    const phaseBefore = session.phase;
    const isValid = isValidSofaSample(clonedSample);

    if (isValid) {
        session.sofaSample = clonedSample;
        session.sofaPersistenceData = persistenceData;
        evaluateGateSession(session);
    }

    return {
        ok: true,
        phaseBefore,
        phase: session.phase,
        action: actionForObservation(phaseBefore, session.phase, isValid)
    };
}

export function observeBetfairSourceIdentitySample(eventId, sample, key) {
    const session = getGateSession(eventId);
    if (!session) {
        return { ok: true, phaseBefore: null, phase: null, action: 'no-gate' };
    }
    if (session.phase === 'mismatch' || session.phase === 'stopped') {
        return {
            ok: true,
            phaseBefore: session.phase,
            phase: session.phase,
            action: 'blocked'
        };
    }

    const clonedSample = cloneJson(sample);
    const phaseBefore = session.phase;
    const isValid = isValidBetfairSample(clonedSample, key);

    if (isValid) {
        session.betfairSample = clonedSample;
        session.betfairKey = key;
        evaluateGateSession(session);
    }

    return {
        ok: true,
        phaseBefore,
        phase: session.phase,
        action: actionForObservation(phaseBefore, session.phase, isValid)
    };
}

export function confirmActiveSourceIdentityGate(eventId, confirmationInput) {
    return confirmGateSession(getGateSession(eventId), eventId, confirmationInput);
}

export function getSourceIdentityGateStatus(eventId) {
    return buildGateStatus(eventId, getGateSession(eventId));
}

export function clearSourceIdentityGate(eventId) {
    if (eventId) {
        const session = getGateSession(eventId);
        if (session) {
            stopGateSession(session);
        }
        deleteGateSession(eventId);
    }
}

export function clearAllSourceIdentityGates(options = {}) {
    const preserveEventId = options?.preserveEventId;
    for (const eventId of listGateEventIds()) {
        if (preserveEventId && eventId === preserveEventId) {
            continue;
        }
        clearSourceIdentityGate(eventId);
    }
}
