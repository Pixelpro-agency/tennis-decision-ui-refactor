import { useCallback, useEffect, useRef, useState } from 'react';

export function useDashboardBootstrapState({ backendData, sessionShellVisible }) {
    const [dashboardContentReady, setDashboardContentReady] = useState(false);
    const awaitingDashboardBootstrapRef = useRef(false);
    const sawDashboardResetRef = useRef(false);

    useEffect(() => {
        if (!sessionShellVisible || !awaitingDashboardBootstrapRef.current) {
            return;
        }

        if (!backendData) {
            sawDashboardResetRef.current = true;
            return;
        }

        if (sawDashboardResetRef.current) {
            awaitingDashboardBootstrapRef.current = false;
            setDashboardContentReady(true);
        }
    }, [backendData, sessionShellVisible]);

    const beginDashboardBootstrap = useCallback(() => {
        setDashboardContentReady(false);
        awaitingDashboardBootstrapRef.current = true;
        sawDashboardResetRef.current = false;
    }, []);

    const resetDashboardBootstrap = useCallback(() => {
        awaitingDashboardBootstrapRef.current = false;
        setDashboardContentReady(false);
    }, []);

    return {
        dashboardContentReady,
        beginDashboardBootstrap,
        resetDashboardBootstrap
    };
}
