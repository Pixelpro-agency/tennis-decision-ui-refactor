import { useEffect, useState } from 'react';
import { mapBackendDataToDashboard } from '../types/dashboard.js';

function normalizeMoneyFlowHistory(value) {
    return Array.isArray(value?.series)
        ? value
        : { series: [] };
}

export function useDashboardViewModel({
    backendData,
    isSofaPolling,
    sofaLastUpdate,
    serverStatus,
    betfairData,
    betfairMoneyFlowHistory,
    confirmedUrl,
    loadMatch,
    matchReadStatus
}) {
    const [dashboardData, setDashboardData] = useState(null);
    const [lastKnownDashboardData, setLastKnownDashboardData] = useState(null);
    const [betfairHistory, setBetfairHistory] = useState({ series: [] });

    useEffect(() => {
        const candidate = betfairMoneyFlowHistory ?? betfairData?.history;
        setBetfairHistory(normalizeMoneyFlowHistory(candidate));
    }, [betfairMoneyFlowHistory, betfairData]);

    useEffect(() => {
        if (backendData) {
            const mapped = mapBackendDataToDashboard(backendData, {
                isPolling: isSofaPolling,
                lastUpdate: sofaLastUpdate,
                serverStatus,
                betfair: betfairData
            });
            setDashboardData(mapped);
            setLastKnownDashboardData(mapped);
        } else {
            setDashboardData(null);
        }
    }, [backendData, isSofaPolling, sofaLastUpdate, serverStatus, confirmedUrl, betfairData, matchReadStatus]);

    useEffect(() => {
        if (confirmedUrl) {
            loadMatch();
        }
    }, [confirmedUrl, loadMatch]);

    return {
        dashboardData,
        lastKnownDashboardData,
        readStatus: matchReadStatus,
        betfairHistory
    };
}
