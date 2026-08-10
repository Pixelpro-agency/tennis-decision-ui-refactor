import { useState, useEffect, useRef, useCallback } from 'react';

function extractEventIdFromUrl(url) {
    if (!url) return '';
    const match = url.match(/#id[=:](\d+)/i) || url.match(/\/event\/(\d+)/) || url.match(/\/match\/[^/]+\/[^/]+\/(\d+)/) || url.match(/\/match\/[^/]+\/(\d+)$/);
    if (match) return match[match.length - 1];
    const digitMatch = url.match(/[^\d](\d{7,9})(?:[^\d]|$)/);
    if (digitMatch) return digitMatch[1];
    const endMatch = url.match(/(\d{6,})/);
    return endMatch ? endMatch[1] : '';
}

export function normalizeSofaTimelinePayload(payload) {
    const latest = payload.latest || payload.timeline?.[payload.timeline.length - 1] || null;
    const data = latest?.data || payload;

    return {
        snapshot: data.snapshot || data.sofa || data,
        localContext: data.localContext ?? null,
        timeline: latest || null,
        integrity: payload?.integrity || null
    };
}

export function classifySofaTimelineHttpStatus(status, err = null) {
    if (status === 404) return { serverStatus: 'waiting', expected: true };
    if (status === 409 && err?.persistenceIntegrity) {
        return {
            serverStatus: err?.integrity?.status === 'recovery_failed'
                ? 'recovery_failed'
                : 'partial_persistence',
            expected: true
        };
    }
    return { serverStatus: 'error', expected: false };
}

export async function readSofaTimeline(eventId, { signal } = {}) {
    if (!eventId) {
        const error = new Error('Event ID missing');
        error.status = 400;
        throw error;
    }

    const response = await fetch(`/api/match/${eventId}/json`, { signal });
    if (response.status === 409) {
        const body = await response.json().catch(() => ({}));
        if (body?.error === 'persistence_integrity') {
            const error = new Error('persistence_integrity');
            error.status = 409;
            error.persistenceIntegrity = true;
            error.integrity = body?.integrity || null;
            throw error;
        }
    }
    if (!response.ok) {
        const error = new Error(`SofaScore JSON not found (${response.status})`);
        error.status = response.status;
        throw error;
    }
    return normalizeSofaTimelinePayload(await response.json());
}

export function useMatchPolling(url, pollingInterval = 3000, explicitEventId = '') {
    const [data, setData] = useState(null);
    const [lastKnownData, setLastKnownData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isPolling, setIsPolling] = useState(false);
    const [sourceUpdatedAt, setSourceUpdatedAt] = useState(null);
    const [fetchedAt, setFetchedAt] = useState(null);
    const [serverStatus, setServerStatus] = useState('unknown');
    const [readStatus, setReadStatus] = useState('inactive');
    const [integrity, setIntegrity] = useState(null);

    const pollTimeoutRef = useRef(null);
    const shouldPollRef = useRef(false);
    const pollGenerationRef = useRef(0);
    const requestIdRef = useRef(0);
    const activeRequestRef = useRef(null);
    const eventId = explicitEventId || extractEventIdFromUrl(url);

    const clearTimer = useCallback(() => {
        if (pollTimeoutRef.current) {
            clearTimeout(pollTimeoutRef.current);
            pollTimeoutRef.current = null;
        }
    }, []);

    const abortActiveRequest = useCallback(() => {
        activeRequestRef.current?.controller.abort();
        activeRequestRef.current = null;
    }, []);

    const fetchOnce = useCallback(async ({ generation, isAuto = false }) => {
        if (!eventId || generation !== pollGenerationRef.current) return null;
        if (activeRequestRef.current?.generation === generation) {
            return activeRequestRef.current.promise;
        }

        const requestId = ++requestIdRef.current;
        const controller = new AbortController();
        if (!isAuto) setLoading(true);

        const promise = (async () => {
            try {
                const result = await readSofaTimeline(eventId, { signal: controller.signal });
                if (generation !== pollGenerationRef.current) return null;
                setData(result);
                setLastKnownData(result);
                setSourceUpdatedAt(result?.timeline?.timestamp ? new Date(result.timeline.timestamp) : null);
                setFetchedAt(new Date());
                setError(null);
                setIntegrity(result?.integrity || null);
                setServerStatus('ok');
                setReadStatus('current');
                return result;
            } catch (requestError) {
                if (requestError?.name === 'AbortError' || generation !== pollGenerationRef.current) return null;
                const classification = classifySofaTimelineHttpStatus(requestError?.status, requestError);
                setData(null);
                setServerStatus(classification.serverStatus);
                setReadStatus(classification.serverStatus === 'waiting' ? 'waiting' : classification.expected ? 'degraded' : 'error');
                setIntegrity(requestError?.persistenceIntegrity ? requestError?.integrity || null : null);
                setError(classification.expected ? null : 'Unable to load match data.');
                return null;
            } finally {
                if (activeRequestRef.current?.requestId === requestId) activeRequestRef.current = null;
                if (!isAuto && generation === pollGenerationRef.current) setLoading(false);
            }
        })();

        activeRequestRef.current = { generation, requestId, controller, promise };
        return promise;
    }, [eventId]);

    const scheduleNext = useCallback((generation) => {
        clearTimer();
        if (!shouldPollRef.current || generation !== pollGenerationRef.current) return;
        pollTimeoutRef.current = setTimeout(async () => {
            await fetchOnce({ generation, isAuto: true });
            if (shouldPollRef.current && generation === pollGenerationRef.current) scheduleNext(generation);
        }, pollingInterval);
    }, [clearTimer, fetchOnce, pollingInterval]);

    useEffect(() => {
        pollGenerationRef.current += 1;
        const generation = pollGenerationRef.current;
        clearTimer();
        abortActiveRequest();
        setData(null);
        setLastKnownData(null);
        setError(null);
        setSourceUpdatedAt(null);
        setFetchedAt(null);
        setIntegrity(null);

        if (!eventId) {
            shouldPollRef.current = false;
            setIsPolling(false);
            setLoading(false);
            setServerStatus('unknown');
            setReadStatus('inactive');
            return undefined;
        }

        shouldPollRef.current = true;
        setIsPolling(true);
        setReadStatus('waiting');
        void fetchOnce({ generation });
        scheduleNext(generation);

        return () => {
            shouldPollRef.current = false;
            pollGenerationRef.current += 1;
            clearTimer();
            abortActiveRequest();
        };
    }, [abortActiveRequest, clearTimer, eventId, fetchOnce, scheduleNext]);

    const loadMatch = useCallback(() => {
        if (!eventId) return;
        void fetchOnce({ generation: pollGenerationRef.current });
    }, [eventId, fetchOnce]);

    const stopPolling = useCallback(() => {
        shouldPollRef.current = false;
        pollGenerationRef.current += 1;
        clearTimer();
        abortActiveRequest();
        setIsPolling(false);
    }, [abortActiveRequest, clearTimer]);

    const resumePolling = useCallback(() => {
        if (!eventId || shouldPollRef.current) return;
        pollGenerationRef.current += 1;
        const generation = pollGenerationRef.current;
        shouldPollRef.current = true;
        setError(null);
        setIsPolling(true);
        void fetchOnce({ generation, isAuto: true });
        scheduleNext(generation);
    }, [eventId, fetchOnce, scheduleNext]);

    return {
        data,
        lastKnownData,
        loading,
        error,
        lastUpdate: sourceUpdatedAt,
        sourceUpdatedAt,
        fetchedAt,
        isPolling,
        serverStatus,
        readStatus,
        integrity,
        loadMatch,
        stopPolling,
        resumePolling
    };
}
