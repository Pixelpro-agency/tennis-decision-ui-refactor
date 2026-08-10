import { useCallback, useEffect, useRef, useState } from 'react';

export function canCompleteDashboardBootstrap({
    backendData,
    sessionActive,
    trackingSessionId,
    bootstrapSessionId,
    sawDashboardReset
}) {
    return Boolean(
        sessionActive &&
        trackingSessionId &&
        bootstrapSessionId === trackingSessionId &&
        sawDashboardReset &&
        backendData
    );
}

export function useDashboardBootstrapState({
    backendData,
    sessionActive,
    trackingSessionId
}) {
    const [dashboardContentReady, setDashboardContentReady] = useState(false);
    const awaitingDashboardBootstrapRef = useRef(false);
    const sawDashboardResetRef = useRef(false);
    const bootstrapSessionIdRef = useRef(null);

    useEffect(() => {
        if (
            !sessionActive ||
            !trackingSessionId ||
            bootstrapSessionIdRef.current !== trackingSessionId ||
            !awaitingDashboardBootstrapRef.current
        ) {
            return;
        }

        if (!backendData) {
            sawDashboardResetRef.current = true;
            return;
        }

        if (canCompleteDashboardBootstrap({
            backendData,
            sessionActive,
            trackingSessionId,
            bootstrapSessionId: bootstrapSessionIdRef.current,
            sawDashboardReset: sawDashboardResetRef.current
        })) {
            awaitingDashboardBootstrapRef.current = false;
            setDashboardContentReady(true);
        }
    }, [backendData, sessionActive, trackingSessionId]);

    const beginDashboardBootstrap = useCallback((nextTrackingSessionId) => {
        setDashboardContentReady(false);
        bootstrapSessionIdRef.current = nextTrackingSessionId || null;
        awaitingDashboardBootstrapRef.current = Boolean(nextTrackingSessionId);
        sawDashboardResetRef.current = false;
    }, []);

    const resetDashboardBootstrap = useCallback(() => {
        awaitingDashboardBootstrapRef.current = false;
        bootstrapSessionIdRef.current = null;
        setDashboardContentReady(false);
    }, []);

    return {
        dashboardContentReady,
        beginDashboardBootstrap,
        resetDashboardBootstrap
    };
}
