import { useState, useEffect, useRef, useCallback } from 'react';

export function useMarketReactionEvidence(eventId, pollingInterval = 5000) {
    const [evidence, setEvidence] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [reasons, setReasons] = useState(null);
    const [lastUpdate, setLastUpdate] = useState(null);
    const [isPolling, setIsPolling] = useState(false);

    // Incremented on every eventId change; each async path captures its own copy.
    const sessionId = useRef(0);
    const pollTimeout = useRef(null);

    // Tracks the single active fetch: { sessionId, requestId, controller }.
    // A fetch from a different session must never consult or modify this lock.
    const activeFetch = useRef(null);

    // Monotonically increasing request counter; never reset, only incremented.
    const requestCounter = useRef(0);

    const clearPollTimeout = () => {
        if (pollTimeout.current) {
            clearTimeout(pollTimeout.current);
            pollTimeout.current = null;
        }
    };

    const fetchOnce = useCallback(async (isAuto, capturedSession, capturedEventId) => {
        if (!capturedEventId) return;

        // Block only if there is already an active fetch for THIS session.
        if (activeFetch.current && activeFetch.current.sessionId === capturedSession) return;

        requestCounter.current += 1;
        const myRequestId = requestCounter.current;
        const controller = new AbortController();

        activeFetch.current = { sessionId: capturedSession, requestId: myRequestId, controller };

        if (!isAuto && sessionId.current === capturedSession) {
            setLoading(true);
        }

        try {
            const res = await fetch(
                `/api/evidence/${encodeURIComponent(capturedEventId)}/latest`,
                { signal: controller.signal }
            );

            if (sessionId.current !== capturedSession) return;

            if (res.status === 404) {
                let payload = null;
                try { payload = await res.json(); } catch (_) {}
                if (sessionId.current !== capturedSession) return;
                setEvidence(null);
                setError(null);
                setReasons(payload?.reasons ?? payload?.error ?? null);
                return;
            }

            if (!res.ok) {
                if (sessionId.current !== capturedSession) return;
                setEvidence(null);
                setReasons(null);
                setError('Unable to load evidence data.');
                return;
            }

            const payload = await res.json();

            if (sessionId.current !== capturedSession) return;

            if (payload?.ok !== true) {
                setEvidence(null);
                setError(null);
                setReasons(payload?.reasons ?? payload?.error ?? null);
                return;
            }

            setEvidence(payload.latest?.marketReactionEvidence ?? null);
            setError(null);
            setReasons(null);
            setLastUpdate(new Date());
        } catch (err) {
            if (err.name === 'AbortError') return;
            if (sessionId.current !== capturedSession) return;
            setEvidence(null);
            setReasons(null);
            setError('Unable to load evidence data.');
        } finally {
            // Release the lock only if this request is still the active one.
            if (activeFetch.current && activeFetch.current.requestId === myRequestId) {
                activeFetch.current = null;
                if (sessionId.current === capturedSession && !isAuto) {
                    setLoading(false);
                }
            }
        }
    }, []);

    useEffect(() => {
        if (!eventId) {
            setEvidence(null);
            setError(null);
            setReasons(null);
            setLastUpdate(null);
            setIsPolling(false);
            setLoading(false);
            return;
        }

        sessionId.current += 1;
        const currentSession = sessionId.current;

        clearPollTimeout();

        // Abort and discard any fetch belonging to the previous session.
        if (activeFetch.current && activeFetch.current.sessionId !== currentSession) {
            activeFetch.current.controller.abort();
            activeFetch.current = null;
        }

        setEvidence(null);
        setError(null);
        setReasons(null);
        setLastUpdate(null);
        setIsPolling(true);

        const loop = async () => {
            await fetchOnce(true, currentSession, eventId);
            if (sessionId.current === currentSession) {
                pollTimeout.current = setTimeout(loop, pollingInterval);
            }
        };

        fetchOnce(false, currentSession, eventId);
        pollTimeout.current = setTimeout(loop, pollingInterval);

        return () => {
            sessionId.current += 1;
            clearPollTimeout();
            if (activeFetch.current && activeFetch.current.sessionId === currentSession) {
                activeFetch.current.controller.abort();
                activeFetch.current = null;
            }
        };
    }, [eventId, pollingInterval, fetchOnce]);

    const refresh = useCallback(() => {
        if (!eventId) return;
        fetchOnce(false, sessionId.current, eventId);
    }, [eventId, fetchOnce]);

    const confirmSourceIdentity = useCallback(async (selectedPairs, confirmationText) => {
        if (!eventId) {
            return { ok: false, error: 'Unable to confirm source identity.' };
        }

        try {
            const response = await fetch(
                `/api/evidence/${encodeURIComponent(eventId)}/source-identity/confirm`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ selectedPairs, confirmationText })
                }
            );

            let payload = null;
            try { payload = await response.json(); } catch (_) {}

            if (!response.ok || payload?.ok !== true) {
                return { ok: false, error: 'Unable to confirm source identity.' };
            }

            refresh();
            return { ok: true };
        } catch (_) {
            return { ok: false, error: 'Unable to confirm source identity.' };
        }
    }, [eventId, refresh]);

    const revokeSourceIdentityConfirmation = useCallback(async () => {
        if (!eventId) {
            return { ok: false, error: 'Unable to revoke source identity confirmation.' };
        }

        try {
            const response = await fetch(
                `/api/evidence/${encodeURIComponent(eventId)}/source-identity/confirm`,
                { method: 'DELETE' }
            );

            let payload = null;
            try { payload = await response.json(); } catch (_) {}

            if (!response.ok || payload?.ok !== true) {
                return { ok: false, error: 'Unable to revoke source identity confirmation.' };
            }

            refresh();
            return { ok: true, revoked: payload.revoked === true };
        } catch (_) {
            return { ok: false, error: 'Unable to revoke source identity confirmation.' };
        }
    }, [eventId, refresh]);

    return {
        evidence,
        loading,
        error,
        reasons,
        lastUpdate,
        isPolling,
        refresh,
        confirmSourceIdentity,
        revokeSourceIdentityConfirmation
    };
}