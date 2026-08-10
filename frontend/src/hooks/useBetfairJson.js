import { useState, useEffect, useRef, useCallback } from 'react';

export function toValidDate(value) {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
}

export function getLatestTimelineEntry(payload) {
    const timeline = Array.isArray(payload?.timeline) ? payload.timeline : [];
    return timeline.length > 0 ? timeline[timeline.length - 1] : null;
}

export function getLatestPayloadTimestamp(payload) {
    return toValidDate(payload?.latestTimestamp);
}

export function getLatestJsonTimestamp(payload) {
    return toValidDate(getLatestTimelineEntry(payload)?.timestamp) || toValidDate(payload?.latest?.timestamp);
}

export function normalizeBetfairTimelinePayload(payload) {
    const timelineLatest = getLatestTimelineEntry(payload);
    const latest = payload?.latest?.data ? payload.latest : timelineLatest || payload?.latest || null;
    return latest?.data || payload;
}

export function isPersistenceIntegrityError(payload) {
    return payload?.error === 'persistence_integrity';
}

async function readJson(response) {
    try { return await response.json(); } catch (_) { return null; }
}

function persistenceError(payload) {
    const error = new Error('persistence_integrity');
    error.status = 409;
    error.persistenceIntegrity = true;
    error.integrity = payload?.integrity || null;
    return error;
}

export function buildBetfairReadModel(payload, source) {
    if (source === 'latest') {
        const latest = payload?.latest || null;
        return {
            data: latest ? { ...latest, ...(payload?.health ? { health: payload.health } : {}), ...(payload?.moneyFlowHistory ? { moneyFlowHistory: payload.moneyFlowHistory } : {}) } : null,
            health: payload?.health || null,
            moneyFlowHistory: payload?.moneyFlowHistory || null,
            sourceUpdatedAt: getLatestPayloadTimestamp(payload),
            fetchedAt: new Date(),
            integrity: payload?.integrity || null,
            source: 'latest'
        };
    }

    return {
        data: normalizeBetfairTimelinePayload(payload),
        health: null,
        moneyFlowHistory: null,
        sourceUpdatedAt: getLatestJsonTimestamp(payload),
        fetchedAt: new Date(),
        integrity: payload?.integrity || null,
        source: 'timeline'
    };
}

export async function readBetfairCycle({ eventId, latestUrl, signal }) {
    const latestResponse = await fetch(latestUrl, { signal });
    const latestPayload = await readJson(latestResponse);

    if (latestResponse.status === 409 && isPersistenceIntegrityError(latestPayload)) {
        throw persistenceError(latestPayload);
    }

    if (latestResponse.ok && latestPayload?.ok === true) {
        return buildBetfairReadModel(latestPayload, 'latest');
    }

    if (latestResponse.status !== 404) {
        const error = new Error('Betfair latest unavailable');
        error.status = latestResponse.status;
        throw error;
    }

    const timelineResponse = await fetch(`/api/betfair/${eventId}/json`, { signal });
    const timelinePayload = await readJson(timelineResponse);
    if (timelineResponse.status === 409 && isPersistenceIntegrityError(timelinePayload)) {
        throw persistenceError(timelinePayload);
    }
    if (!timelineResponse.ok) {
        const error = new Error('Betfair timeline unavailable');
        error.status = timelineResponse.status;
        throw error;
    }
    return buildBetfairReadModel(timelinePayload, 'timeline');
}

export function useBetfairJson(url, sofaEventId, pollingInterval = 5000, options = {}) {
    const { mode, cdpUrl } = options;
    const [data, setData] = useState(null);
    const [lastKnownData, setLastKnownData] = useState(null);
    const [health, setHealth] = useState(null);
    const [moneyFlowHistory, setMoneyFlowHistory] = useState(null);
    const [lastKnownMoneyFlowHistory, setLastKnownMoneyFlowHistory] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isPolling, setIsPolling] = useState(false);
    const [sourceUpdatedAt, setSourceUpdatedAt] = useState(null);
    const [fetchedAt, setFetchedAt] = useState(null);
    const [integrity, setIntegrity] = useState(null);
    const [readStatus, setReadStatus] = useState('inactive');

    const pollTimeoutRef = useRef(null);
    const shouldPollRef = useRef(false);
    const pollGenerationRef = useRef(0);
    const requestIdRef = useRef(0);
    const activeRequestRef = useRef(null);

    const latestUrl = (() => {
        const params = new URLSearchParams();
        if (mode) params.set('mode', mode);
        if (cdpUrl) params.set('cdpUrl', cdpUrl);
        const query = params.toString();
        return `/api/betfair/${sofaEventId}/latest${query ? `?${query}` : ''}`;
    })();

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

    const applyReadModel = useCallback((model) => {
        setData(model.data);
        setLastKnownData(model.data);
        setHealth(model.health);
        setMoneyFlowHistory(model.moneyFlowHistory);
        setLastKnownMoneyFlowHistory(model.moneyFlowHistory);
        setSourceUpdatedAt(model.sourceUpdatedAt);
        setFetchedAt(model.fetchedAt);
        setIntegrity(model.integrity);
        setError(null);
        setReadStatus('current');
    }, []);

    const fetchOnce = useCallback(async ({ generation, isAuto = false }) => {
        if (!sofaEventId || generation !== pollGenerationRef.current) return null;
        if (activeRequestRef.current?.generation === generation) return activeRequestRef.current.promise;
        const requestId = ++requestIdRef.current;
        const controller = new AbortController();
        if (!isAuto) setLoading(true);

        const promise = (async () => {
            try {
                const model = await readBetfairCycle({ eventId: sofaEventId, latestUrl, signal: controller.signal });
                if (generation !== pollGenerationRef.current) return null;
                applyReadModel(model);
                return model;
            } catch (requestError) {
                if (requestError?.name === 'AbortError' || generation !== pollGenerationRef.current) return null;
                setData(null);
                setHealth(null);
                setMoneyFlowHistory(null);
                setSourceUpdatedAt(null);
                if (requestError?.persistenceIntegrity) {
                    setIntegrity(requestError.integrity);
                    setError(null);
                    setReadStatus('degraded');
                } else {
                    setIntegrity(null);
                    setError('Unable to load Betfair data.');
                    setReadStatus(requestError?.status === 404 ? 'waiting' : 'error');
                }
                return null;
            } finally {
                if (activeRequestRef.current?.requestId === requestId) activeRequestRef.current = null;
                if (!isAuto && generation === pollGenerationRef.current) setLoading(false);
            }
        })();

        activeRequestRef.current = { generation, requestId, controller, promise };
        return promise;
    }, [applyReadModel, latestUrl, sofaEventId]);

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
        setHealth(null);
        setMoneyFlowHistory(null);
        setLastKnownMoneyFlowHistory(null);
        setError(null);
        setSourceUpdatedAt(null);
        setFetchedAt(null);
        setIntegrity(null);

        if (!url || !sofaEventId) {
            shouldPollRef.current = false;
            setIsPolling(false);
            setLoading(false);
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
    }, [abortActiveRequest, clearTimer, fetchOnce, scheduleNext, sofaEventId, url]);

    const stopPolling = useCallback(() => {
        shouldPollRef.current = false;
        pollGenerationRef.current += 1;
        clearTimer();
        abortActiveRequest();
        setIsPolling(false);
    }, [abortActiveRequest, clearTimer]);

    const resumePolling = useCallback(() => {
        if (!url || !sofaEventId || shouldPollRef.current) return;
        pollGenerationRef.current += 1;
        const generation = pollGenerationRef.current;
        shouldPollRef.current = true;
        setError(null);
        setIsPolling(true);
        void fetchOnce({ generation, isAuto: true });
        scheduleNext(generation);
    }, [fetchOnce, scheduleNext, sofaEventId, url]);

    return {
        data,
        lastKnownData,
        health,
        moneyFlowHistory,
        lastKnownMoneyFlowHistory,
        loading,
        error,
        lastUpdate: sourceUpdatedAt,
        sourceUpdatedAt,
        fetchedAt,
        isPolling,
        integrity,
        readStatus,
        startPolling: resumePolling,
        stopPolling,
        resumePolling
    };
}
