import {
    buildSourceIdentity,
    buildBetfairIdentitySignature,
    selectActiveBetfairMarketEpoch
} from './matchEvidence/sourceIdentity.js';
import {
    buildConfirmationContext,
    isConfirmationContextComplete,
    validateManualConfirmation,
    applyManualConfirmation
} from './matchEvidence/sourceIdentityConfirmation.js';
import {
    findApplicableSourceIdentityConfirmation,
    upsertSourceIdentityConfirmation
} from './matchEvidence/sourceIdentityConfirmationStore.js';

// In-memory store for active gates
const activeGates = new Map();

function isValidSofaSample(sample) {
    if (!sample) return false;
    const players = sample.snapshot?.players || sample.players;
    if (!players) return false;
    const home = players.home?.name || players.home?.fullName || '';
    const away = players.away?.name || players.away?.fullName || '';
    return home.trim().length > 0 && away.trim().length > 0;
}

function wrapBetfairTick(sample, key) {
    if (sample && sample.data && typeof sample.data === 'object') {
        return sample;
    }
    return {
        data: {
            runners: sample?.runners || [],
            market: {
                marketId: sample?.market_info?.market_id || sample?.market?.marketId || ''
            },
            marketKey: sample?.marketKey || key || ''
        }
    };
}

function isValidBetfairSample(sample, key) {
    if (!sample) return false;
    const runners = sample.runners || (sample.data && sample.data.runners) || [];
    if (runners.length !== 2) return false;
    
    const r1 = runners[0];
    const r2 = runners[1];
    if (!r1?.name?.trim() || !r2?.name?.trim()) return false;
    
    const selId1 = String(r1.selectionId ?? '').trim();
    const selId2 = String(r2.selectionId ?? '').trim();
    if (!selId1 || !selId2 || selId1 === selId2) return false;
    
    const tick = wrapBetfairTick(sample, key);
    const signature = buildBetfairIdentitySignature(tick);
    return !!signature;
}

export function startSourceIdentityGate(eventId, options = {}) {
    if (!eventId) return;
    
    const session = {
        eventId,
        hasBetfairUrl: !!options.hasBetfairUrl,
        onOpenRecording: options.onOpenRecording || (() => {}),
        onMismatch: options.onMismatch || (() => {}),
        phase: options.hasBetfairUrl ? 'collecting' : 'not-applicable',
        sofaSample: null,
        sofaPersistenceData: null,
        betfairSample: null,
        betfairKey: null,
        sourceIdentity: null,
        updatedAt: new Date().toISOString(),
        error: null,
        mismatchCalled: false,
        recordingCalled: false,
        bufferGeneration: 0,
        attemptedBootstrapGeneration: null,
        recordingGeneration: null,
        dependencies: options.dependencies || {}
    };
    
    activeGates.set(eventId, session);
}

function cloneSourceIdentity(sourceIdentity) {
    if (!sourceIdentity) return null;
    return {
        status: sourceIdentity.status,
        sofaPlayers: Array.isArray(sourceIdentity.sofaPlayers) ? [...sourceIdentity.sofaPlayers] : [],
        betfairRunners: Array.isArray(sourceIdentity.betfairRunners) ? [...sourceIdentity.betfairRunners] : [],
        normalizedSofaPlayers: Array.isArray(sourceIdentity.normalizedSofaPlayers) ? [...sourceIdentity.normalizedSofaPlayers] : [],
        normalizedBetfairRunners: Array.isArray(sourceIdentity.normalizedBetfairRunners) ? [...sourceIdentity.normalizedBetfairRunners] : [],
        normalizedPairs: Array.isArray(sourceIdentity.normalizedPairs)
            ? sourceIdentity.normalizedPairs.map(p => ({ ...p }))
            : [],
        reasons: Array.isArray(sourceIdentity.reasons) ? [...sourceIdentity.reasons] : []
    };
}

function evaluateGateSession(session) {
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
    
    // Both samples are valid, run Source Identity build
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
    
    session.sourceIdentity = cloneSourceIdentity(effectiveIdentity);
    
    if (effectiveIdentity.status === 'aligned') {
        if (session.recordingGeneration !== session.bufferGeneration) {
            if (session.attemptedBootstrapGeneration === session.bufferGeneration) {
                session.phase = 'pending';
            } else {
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
                } catch (err) {
                    session.phase = 'pending';
                    session.error = 'Bootstrap persistence failed';
                }
            }
        } else {
            session.phase = 'recording';
        }
    } else if (effectiveIdentity.status === 'mismatch') {
        session.phase = 'mismatch';
        // Nullify raw sample data in memory for mismatch terminal state
        session.sofaSample = null;
          session.sofaPersistenceData = null;
        session.betfairSample = null;
        
        if (!session.mismatchCalled) {
            session.mismatchCalled = true;
            try {
                session.onMismatch({ sourceIdentity: effectiveIdentity });
            } catch (err) {
                console.error('Error in onMismatch callback:', err);
            }
        }
    } else {
        // status is pending
        if (session.phase === 'recording') {
            session.bufferGeneration += 1;
            session.recordingCalled = false;
            session.error = null;
        }
        session.phase = 'pending';
    }
    
    session.updatedAt = new Date().toISOString();
}

export function observeSofaSourceIdentitySample(eventId, sample, persistenceData = null) {
    const session = activeGates.get(eventId);
    if (!session) {
        return { ok: true, phaseBefore: null, phase: null, action: 'no-gate' };
    }
    if (session.phase === 'mismatch' || session.phase === 'stopped') {
        return { ok: true, phaseBefore: session.phase, phase: session.phase, action: 'blocked' };
    }
    
    const clonedSample = JSON.parse(JSON.stringify(sample));
    const phaseBefore = session.phase;
    const isValid = isValidSofaSample(clonedSample);
    
    if (isValid) {
        session.sofaSample = clonedSample;
        session.sofaPersistenceData = persistenceData;
        evaluateGateSession(session);
    }
    
    let action = 'buffered';
    if (!isValid) {
        action = 'buffered';
    } else {
        const phaseAfter = session.phase;
        if (phaseBefore === 'not-applicable' || phaseAfter === 'not-applicable') {
            action = 'persist-current';
        } else if (phaseBefore === 'recording' && phaseAfter === 'recording') {
            action = 'persist-current';
        } else if ((phaseBefore === 'collecting' || phaseBefore === 'pending') && phaseAfter === 'recording') {
            action = 'bootstrapped';
        } else if (phaseBefore === 'recording' && phaseAfter === 'pending') {
            action = 'buffered';
        } else if (phaseAfter === 'mismatch') {
            action = 'blocked';
        } else if (phaseBefore === 'collecting' || phaseBefore === 'pending') {
            action = 'buffered';
        }
    }
    
    return {
        ok: true,
        phaseBefore,
        phase: session.phase,
        action
    };
}

export function observeBetfairSourceIdentitySample(eventId, sample, key) {
    const session = activeGates.get(eventId);
    if (!session) {
        return { ok: true, phaseBefore: null, phase: null, action: 'no-gate' };
    }
    if (session.phase === 'mismatch' || session.phase === 'stopped') {
        return { ok: true, phaseBefore: session.phase, phase: session.phase, action: 'blocked' };
    }
    
    const clonedSample = JSON.parse(JSON.stringify(sample));
    const phaseBefore = session.phase;
    const isValid = isValidBetfairSample(clonedSample, key);
    
    if (isValid) {
        session.betfairSample = clonedSample;
        session.betfairKey = key;
        evaluateGateSession(session);
    }
    
    let action = 'buffered';
    if (!isValid) {
        action = 'buffered';
    } else {
        const phaseAfter = session.phase;
        if (phaseBefore === 'not-applicable' || phaseAfter === 'not-applicable') {
            action = 'persist-current';
        } else if (phaseBefore === 'recording' && phaseAfter === 'recording') {
            action = 'persist-current';
        } else if ((phaseBefore === 'collecting' || phaseBefore === 'pending') && phaseAfter === 'recording') {
            action = 'bootstrapped';
        } else if (phaseBefore === 'recording' && phaseAfter === 'pending') {
            action = 'buffered';
        } else if (phaseAfter === 'mismatch') {
            action = 'blocked';
        } else if (phaseBefore === 'collecting' || phaseBefore === 'pending') {
            action = 'buffered';
        }
    }
    
    return {
        ok: true,
        phaseBefore,
        phase: session.phase,
        action
    };
}

export function confirmActiveSourceIdentityGate(eventId, { selectedPairs, confirmationText }) {
    const session = activeGates.get(eventId);
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
        } catch (err) {
            session.phase = 'pending';
            session.error = 'Bootstrap persistence failed';
            return { ok: false, code: 'bootstrap_persistence_failed' };
        }
    }
    
    return { ok: true, sourceIdentity: session.sourceIdentity, phase: session.phase };
}

export function getSourceIdentityGateStatus(eventId) {
    if (!eventId || !eventId.trim()) {
        return { ok: false, active: false, error: 'invalid_event_id' };
    }
    const session = activeGates.get(eventId);
    if (!session) {
        return { ok: false, active: false };
    }
    
    let persistence = 'buffering';
    if (session.phase === 'recording' || session.phase === 'not-applicable') {
        persistence = 'canonical';
    } else if (session.phase === 'mismatch') {
        persistence = 'blocked';
    }
    
    const statusObj = {
        ok: true,
        eventId: session.eventId,
        active: session.phase !== 'stopped' && session.phase !== 'mismatch',
        phase: session.phase,
        persistence,
        sourceIdentity: cloneSourceIdentity(session.sourceIdentity),
        updatedAt: session.updatedAt
    };
    
    if (session.error && typeof session.error === 'string' && session.error.trim()) {
        statusObj.error = session.error;
    }
    
    return statusObj;
}

export function clearSourceIdentityGate(eventId) {
    if (eventId) {
        const session = activeGates.get(eventId);
        if (session) {
            session.phase = 'stopped';
            session.sofaSample = null;
          session.sofaPersistenceData = null;
            session.betfairSample = null;
            session.sourceIdentity = null;
            session.updatedAt = new Date().toISOString();
        }
        activeGates.delete(eventId);
    }
}

export function clearAllSourceIdentityGates(options = {}) {
    const preserveEventId = options?.preserveEventId;
    for (const eventId of activeGates.keys()) {
        if (preserveEventId && eventId === preserveEventId) {
            continue;
        }
        clearSourceIdentityGate(eventId);
    }
}
