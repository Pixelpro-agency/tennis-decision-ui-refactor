import { useState, useEffect, useRef, useCallback } from 'react';

function validDate(value) {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
}

export function normalizeEvidencePayload(payload, fetchedAt = new Date()) {
    const latest = payload?.latest || null;
    return {
        latest,
        evidence: latest?.marketReactionEvidence ?? null,
        sources: payload?.sources ?? null,
        integrity: payload?.integrity ?? null,
        persistenceComplete: latest?.dataQuality?.persistenceComplete ?? null,
        sourceUpdatedAt: validDate(latest?.metadata?.updatedAt),
        fetchedAt
    };
}

export function useMarketReactionEvidence(eventId, pollingInterval = 5000) {
    const [latest, setLatest] = useState(null);
    const [evidence, setEvidence] = useState(null);
    const [sources, setSources] = useState(null);
    const [integrity, setIntegrity] = useState(null);
    const [persistenceComplete, setPersistenceComplete] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [reasons, setReasons] = useState(null);
    const [sourceUpdatedAt, setSourceUpdatedAt] = useState(null);
    const [fetchedAt, setFetchedAt] = useState(null);
    const [readStatus, setReadStatus] = useState('inactive');
    const [isPolling, setIsPolling] = useState(false);

    const pollGenerationRef = useRef(0);
    const pollTimeoutRef = useRef(null);
    const activeRequestRef = useRef(null);
    const requestIdRef = useRef(0);

    const clearPollTimeout = useCallback(() => {
        if (pollTimeoutRef.current) {
            clearTimeout(pollTimeoutRef.current);
            pollTimeoutRef.current = null;
        }
    }, []);

    const clearCurrentEvidence = useCallback(() => {
        setLatest(null);
        setEvidence(null);
        setSources(null);
        setPersistenceComplete(null);
        setSourceUpdatedAt(null);
    }, []);

    const fetchOnce = useCallback(async ({ isAuto, generation, currentEventId }) => {
        if (!currentEventId || generation !== pollGenerationRef.current) return null;
        if (activeRequestRef.current?.generation === generation) return activeRequestRef.current.promise;
        const requestId = ++requestIdRef.current;
        const controller = new AbortController();
        if (!isAuto) setLoading(true);

        const promise = (async () => {
            try {
                const response = await fetch(
                    `/api/evidence/${encodeURIComponent(currentEventId)}/latest`,
                    { signal: controller.signal }
                );
                const payload = await response.json().catch(() => null);
                if (generation !== pollGenerationRef.current) return null;
                const now = new Date();
                setFetchedAt(now);

                if (response.status === 404) {
                    clearCurrentEvidence();
                    setIntegrity(payload?.integrity ?? null);
                    setReasons(payload?.reasons ?? payload?.error ?? null);
                    setError(null);
                    setReadStatus(payload?.integrity ? 'degraded' : 'waiting');
                    return null;
                }

                if (!response.ok) {
                    clearCurrentEvidence();
                    setIntegrity(payload?.integrity ?? null);
                    setReasons(null);
                    setError('Unable to load evidence data.');
                    setReadStatus('error');
                    return null;
                }

                if (payload?.ok !== true) {
                    clearCurrentEvidence();
                    setIntegrity(payload?.integrity ?? null);
                    setReasons(payload?.reasons ?? payload?.error ?? null);
                    setError(null);
                    setReadStatus('waiting');
                    return null;
                }

                const model = normalizeEvidencePayload(payload, now);
                setLatest(model.latest);
                setEvidence(model.evidence);
                setSources(model.sources);
                setIntegrity(model.integrity);
                setPersistenceComplete(model.persistenceComplete);
                setSourceUpdatedAt(model.sourceUpdatedAt);
                setFetchedAt(model.fetchedAt);
                setError(null);
                setReasons(null);
                setReadStatus(model.persistenceComplete === false ? 'degraded' : 'current');
                return model;
            } catch (requestError) {
                if (requestError?.name === 'AbortError' || generation !== pollGenerationRef.current) return null;
                clearCurrentEvidence();
                setIntegrity(null);
                setReasons(null);
                setError('Unable to load evidence data.');
                setReadStatus('error');
                return null;
            } finally {
                if (activeRequestRef.current?.requestId === requestId) activeRequestRef.current = null;
                if (!isAuto && generation === pollGenerationRef.current) setLoading(false);
            }
        })();

        activeRequestRef.current = { generation, requestId, controller, promise };
        return promise;
    }, [clearCurrentEvidence]);

    useEffect(() => {
        pollGenerationRef.current += 1;
        const generation = pollGenerationRef.current;
        clearPollTimeout();
        activeRequestRef.current?.controller.abort();
        activeRequestRef.current = null;
        clearCurrentEvidence();
        setIntegrity(null);
        setFetchedAt(null);
        setError(null);
        setReasons(null);

        if (!eventId) {
            setReadStatus('inactive');
            setIsPolling(false);
            setLoading(false);
            return undefined;
        }

        setReadStatus('waiting');
        setIsPolling(true);

        const loop = async () => {
            await fetchOnce({ isAuto: true, generation, currentEventId: eventId });
            if (generation === pollGenerationRef.current) {
                pollTimeoutRef.current = setTimeout(loop, pollingInterval);
            }
        };

        void fetchOnce({ isAuto: false, generation, currentEventId: eventId });
        pollTimeoutRef.current = setTimeout(loop, pollingInterval);

        return () => {
            pollGenerationRef.current += 1;
            clearPollTimeout();
            if (activeRequestRef.current?.generation === generation) {
                activeRequestRef.current.controller.abort();
                activeRequestRef.current = null;
            }
        };
    }, [clearCurrentEvidence, clearPollTimeout, eventId, fetchOnce, pollingInterval]);

    const refresh = useCallback(() => {
        if (!eventId) return Promise.resolve(null);
        return fetchOnce({ isAuto: false, generation: pollGenerationRef.current, currentEventId: eventId });
    }, [eventId, fetchOnce]);

    const confirmSourceIdentity = useCallback(async (selectedPairs, confirmationText) => {
        if (!eventId) return { ok: false, error: 'Unable to confirm source identity.' };
        try {
            const response = await fetch(`/api/evidence/${encodeURIComponent(eventId)}/source-identity/confirm`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ selectedPairs, confirmationText })
            });
            const payload = await response.json().catch(() => null);
            if (!response.ok || payload?.ok !== true) return { ok: false, error: 'Unable to confirm source identity.' };
            await refresh();
            return { ok: true };
        } catch (_) {
            return { ok: false, error: 'Unable to confirm source identity.' };
        }
    }, [eventId, refresh]);

    const revokeSourceIdentityConfirmation = useCallback(async () => {
        if (!eventId) return { ok: false, error: 'Unable to revoke source identity confirmation.' };
        try {
            const response = await fetch(`/api/evidence/${encodeURIComponent(eventId)}/source-identity/confirm`, { method: 'DELETE' });
            const payload = await response.json().catch(() => null);
            if (!response.ok || payload?.ok !== true) return { ok: false, error: 'Unable to revoke source identity confirmation.' };
            await refresh();
            return { ok: true, revoked: payload.revoked === true };
        } catch (_) {
            return { ok: false, error: 'Unable to revoke source identity confirmation.' };
        }
    }, [eventId, refresh]);

    return {
        latest,
        evidence,
        sources,
        integrity,
        persistenceComplete,
        loading,
        error,
        reasons,
        lastUpdate: sourceUpdatedAt,
        sourceUpdatedAt,
        fetchedAt,
        readStatus,
        isPolling,
        refresh,
        confirmSourceIdentity,
        revokeSourceIdentityConfirmation
    };
}
