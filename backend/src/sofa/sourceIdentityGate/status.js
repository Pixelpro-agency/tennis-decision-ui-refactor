import { cloneSourceIdentity } from './sessionFactory.js';

export function buildGateStatus(eventId, session) {
    if (!eventId || !eventId.trim()) {
        return { ok: false, active: false, error: 'invalid_event_id' };
    }
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
