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
    const latestTimelineEntry = getLatestTimelineEntry(payload);

    return toValidDate(latestTimelineEntry?.timestamp) ||
        toValidDate(payload?.latest?.timestamp);
}

export function normalizeBetfairTimelinePayload(payload) {
    const timelineLatest = getLatestTimelineEntry(payload);
    const latest = payload?.latest?.data
        ? payload.latest
        : timelineLatest || payload?.latest || null;

    return latest?.data || payload;
}

export function isPersistenceIntegrityError(payload) {
    return payload?.error === 'persistence_integrity';
}

export function useBetfairJson(url, sofaEventId, pollingInterval = 5000, options = {}) {
    const { mode, cdpUrl } = options;

    const [data, setData] = useState(null);
    const [health, setHealth] = useState(null);
    const [moneyFlowHistory, setMoneyFlowHistory] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isPolling, setIsPolling] = useState(false);
    const [lastUpdate, setLastUpdate] = useState(null);
    const [integrity, setIntegrity] = useState(null);

    const pollTimeout = useRef(null);
    const shouldPoll = useRef(false);

    const buildLatestUrl = useCallback(() => {
        const params = new URLSearchParams();
        if (mode) params.set('mode', mode);
        if (cdpUrl) params.set('cdpUrl', cdpUrl);
        const query = params.toString();
        return `/api/betfair/${sofaEventId}/latest${query ? `?${query}` : ''}`;
    }, [sofaEventId, mode, cdpUrl]);

    const applyLatestPayload = useCallback((payload) => {
        const latestData = payload?.latest || null;
        const payloadHealth = payload?.health || null;

        if (latestData && payloadHealth) {
            latestData.health = payloadHealth;
        }

        if (payload?.moneyFlowHistory) {
            if (latestData) {
                latestData.moneyFlowHistory = payload.moneyFlowHistory;
            }

            setMoneyFlowHistory(payload.moneyFlowHistory);
        }

        setData(latestData);
        setHealth(payloadHealth);
        setLastUpdate(getLatestPayloadTimestamp(payload));
        setIntegrity(payload?.integrity || null);
        setError(null);

        return latestData;
    }, []);

    const fetchLatestCompact = useCallback(async () => {
        if (!sofaEventId) {
            const err = new Error('Sofa event ID missing');
            err.status = 400;
            throw err;
        }

        const res = await fetch(buildLatestUrl());
        let payload = null;
        const contentType = res.headers.get('content-type') || '';

        if (contentType.includes('application/json')) {
            try {
                payload = await res.json();
            } catch (_error) {
                payload = null;
            }
        }

        if (payload?.health) {
            setHealth(payload.health);
        }

        if (res.status === 409 && isPersistenceIntegrityError(payload)) {
            const err = new Error('persistence_integrity');
            err.status = 409;
            err.persistenceIntegrity = true;
            err.integrity = payload?.integrity || null;
            err.health = payload?.health || null;
            throw err;
        }

        if (!res.ok) {
            const err = new Error(payload?.error || `Betfair latest not found (${res.status})`);
            err.status = res.status;
            err.payload = payload;
            throw err;
        }

        if (payload?.ok !== true) {
            const err = new Error(payload?.error || 'Betfair latest unavailable');
            err.status = 404;
            err.payload = payload;
            throw err;
        }

        applyLatestPayload(payload);
        return payload?.latest || null;
    }, [sofaEventId, buildLatestUrl, applyLatestPayload]);

    const fetchJsonTimeline = useCallback(async () => {
        const res = await fetch(`/api/betfair/${sofaEventId}/json`);

        if (res.status === 409) {
            const payload = await res.json().catch(() => ({}));

            if (isPersistenceIntegrityError(payload)) {
                const err = new Error('persistence_integrity');
                err.status = 409;
                err.persistenceIntegrity = true;
                err.integrity = payload?.integrity || null;
                throw err;
            }

            const err = new Error(`Betfair JSON not found (${res.status})`);
            err.status = res.status;
            throw err;
        }

        if (!res.ok) {
            const err = new Error(`Betfair JSON not found (${res.status})`);
            err.status = res.status;
            throw err;
        }

        const payload = await res.json();
        const latestData = normalizeBetfairTimelinePayload(payload);

        setData(latestData);
        setLastUpdate(getLatestJsonTimestamp(payload));
        setIntegrity(payload?.integrity || null);
        setError(null);

        return latestData;
    }, [sofaEventId]);

    const fetchData = useCallback(async (isAuto = false) => {
        if (!sofaEventId) return;
        if (!isAuto) setLoading(true);

        try {
            await fetchLatestCompact();
        } catch (err) {
            if (err?.persistenceIntegrity) {
                setData(null);
                setIntegrity(err?.integrity || null);
                if (err?.health) {
                    setHealth(err.health);
                }
                setError(null);
            } else {
                if (!isAuto) {
                    console.error('Betfair latest polling error:', err);
                }

                if (err.status === 404) {
                    try {
                        await fetchJsonTimeline();
                    } catch (fallbackErr) {
                        if (fallbackErr?.persistenceIntegrity) {
                            setData(null);
                            setIntegrity(fallbackErr?.integrity || null);
                            setError(null);
                        } else if (!isAuto) {
                            console.error('Betfair fallback JSON polling error:', fallbackErr);
                            setError(fallbackErr.message);
                        }
                    }
                } else if (!isAuto) {
                    setError(err.message);
                }
            }
        } finally {
            if (!isAuto) setLoading(false);
        }
    }, [sofaEventId, fetchLatestCompact, fetchJsonTimeline]);

    const load = useCallback(() => {
        setData(null);
        setHealth(null);
        setMoneyFlowHistory(null);
        setError(null);
        setLastUpdate(null);
        setIntegrity(null);
        shouldPoll.current = true;
        setIsPolling(true);
        fetchData(false);
    }, [fetchData]);

    useEffect(() => {
        setData(null);
        setHealth(null);
        setMoneyFlowHistory(null);
        setError(null);
        setLastUpdate(null);
        setIntegrity(null);
        shouldPoll.current = true;
        setIsPolling(true);
        fetchData(false);

        const loop = async () => {
            if (shouldPoll.current) {
                await fetchData(true);
            }

            pollTimeout.current = setTimeout(loop, pollingInterval);
        };

        pollTimeout.current = setTimeout(loop, pollingInterval);
        return () => {
            if (pollTimeout.current) clearTimeout(pollTimeout.current);
        };
    }, [sofaEventId, url, fetchData, pollingInterval]);

    const stopPolling = () => {
        shouldPoll.current = false;
        setIsPolling(false);
    };

    const resumePolling = () => {
        setError(null);
        shouldPoll.current = true;
        setIsPolling(true);
        fetchData(true);
    };

    return {
        data,
        health,
        moneyFlowHistory,
        loading,
        error,
        lastUpdate,
        isPolling,
        integrity,
        startPolling: load,
        stopPolling,
        resumePolling
    };
}
