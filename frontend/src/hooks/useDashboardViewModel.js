import { useEffect, useState } from 'react';
import { mapBackendDataToDashboard } from '../types/dashboard';

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
    loadMatch
}) {
    const [dashboardData, setDashboardData] = useState(null);
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
        }
    }, [backendData, isSofaPolling, sofaLastUpdate, serverStatus, confirmedUrl, betfairData]);

    useEffect(() => {
        if (confirmedUrl) {
            loadMatch();
        }
    }, [confirmedUrl, loadMatch]);

    return {
        dashboardData,
        betfairHistory
    };
}
