import { useState, useEffect, useRef, useCallback } from 'react';

function extractEventIdFromUrl(url) {
    if (!url) return '';
    const match = url.match(/#id[=:](\d+)/i) || url.match(/\/event\/(\d+)/) || url.match(/\/match\/[^\/]+\/([^\/]+)\/(\d+)/) || url.match(/\/match\/([^\/]+)\/(\d+)$/);
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
    if (status === 404) {
        return {
            serverStatus: 'waiting',
            expected: true
        };
    }

    if (status === 409 && err?.persistenceIntegrity) {
        const integrityStatus = err?.integrity?.status;

        return {
            serverStatus: integrityStatus === 'recovery_failed'
                ? 'recovery_failed'
                : 'partial_persistence',
            expected: true
        };
    }

    return {
        serverStatus: 'error',
        expected: false
    };
}

export function useMatchPolling(url, pollingInterval = 3000, explicitEventId = '') {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isPolling, setIsPolling] = useState(false);
    const [lastUpdate, setLastUpdate] = useState(null);
    const [serverStatus, setServerStatus] = useState('unknown');
    const [integrity, setIntegrity] = useState(null);

    const pollTimeout = useRef(null);
    const shouldPoll = useRef(false);

    const eventId = explicitEventId || extractEventIdFromUrl(url);

    const fetchJsonTimeline = useCallback(async () => {
        if (!eventId) {
            const err = new Error('Event ID missing');
            err.status = 400;
            throw err;
        }

        const res = await fetch(`/api/match/${eventId}/json`);

        if (res.status === 409) {
            const body = await res.json().catch(() => ({}));

            if (body?.error === 'persistence_integrity') {
                const err = new Error('persistence_integrity');
                err.status = 409;
                err.persistenceIntegrity = true;
                err.integrity = body?.integrity || null;
                throw err;
            }

            const err = new Error(`SofaScore JSON not found (${res.status})`);
            err.status = res.status;
            throw err;
        }

        if (!res.ok) {
            const err = new Error(`SofaScore JSON not found (${res.status})`);
            err.status = res.status;
            throw err;
        }

        return normalizeSofaTimelinePayload(await res.json());
    }, [eventId]);

    const fetchData = useCallback(async (isAuto = false) => {
        if (!eventId) return;

        if (!isAuto) setLoading(true);

        try {
            const result = await fetchJsonTimeline();
            setData(result);
            setLastUpdate(new Date());
            setError(null);
            setIntegrity(result?.integrity || null);
            setServerStatus('ok');
        } catch (err) {
            const classification = classifySofaTimelineHttpStatus(err?.status, err);

            if (classification.expected) {
                setData(null);
                setServerStatus(classification.serverStatus);
                setError(null);
                setIntegrity(err?.persistenceIntegrity ? err?.integrity || null : null);
            } else {
                console.error('SofaScore JSON polling error:', err);
                setServerStatus(classification.serverStatus);

                if (!isAuto) {
                    setError(err.message);
                }
            }
        } finally {
            if (!isAuto) setLoading(false);
        }
    }, [eventId, fetchJsonTimeline]);

    const loadMatch = useCallback(() => {
        setData(null);
        setError(null);
        setLastUpdate(null);
        setServerStatus('unknown');
        setIntegrity(null);
        shouldPoll.current = true;
        setIsPolling(true);
        fetchData(false);
    }, [fetchData]);

    useEffect(() => {
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
    }, [fetchData, pollingInterval]);

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
        loading,
        error,
        lastUpdate,
        isPolling,
        serverStatus,
        integrity,
        loadMatch,
        stopPolling,
        resumePolling
    };
}
