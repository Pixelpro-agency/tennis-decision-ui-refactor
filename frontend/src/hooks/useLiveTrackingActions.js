import { useCallback } from 'react';
import {
    buildProfilePath,
    startMatchTracking,
    stopMatchTracking
} from '../services/liveSessionApi';
import { buildMatchTrackingRequest } from '../utils/liveSessionRequests.js';

export function useLiveTrackingActions({
    sofaEventId,
    applySearchSession,
    clearConfirmedSession,
    stopSofaPolling,
    resetSourceIdentityUi,
    setActiveView,
    setSessionShellVisible,
    setTrackingStopped,
    setStopSofaStatus,
    beginDashboardBootstrap,
    resetDashboardBootstrap
}) {
    const handleSearch = useCallback(async (
        sUrl,
        bUrl,
        graphUrls = '',
        mode = 'persistent',
        cProfile = '',
        _cProfileName = 'Default',
        cdp = ''
    ) => {
        const fullProfilePath = buildProfilePath(cProfile);
        const trackingRequest = buildMatchTrackingRequest({
            sofaUrl: sUrl,
            betfairUrl: bUrl,
            betfairGraphUrls: graphUrls,
            betfairMode: mode,
            chromeProfilePath: fullProfilePath,
            cdpUrl: cdp
        });

        applySearchSession({
            sofaUrl: sUrl,
            betfairUrl: bUrl,
            betfairGraphUrls: graphUrls,
            betfairMode: mode,
            chromeProfileInput: cProfile,
            fullChromeProfilePath: fullProfilePath,
            cdpUrl: cdp
        });

        resetSourceIdentityUi();
        setActiveView('overview');
        setSessionShellVisible(true);
        setTrackingStopped(false);
        setStopSofaStatus('');
        beginDashboardBootstrap();

        try {
            await startMatchTracking(trackingRequest);
        } catch (error) {
            resetDashboardBootstrap();
            setSessionShellVisible(false);
            console.error('Failed to start match tracker:', error);
        }
    }, [
        applySearchSession,
        beginDashboardBootstrap,
        resetDashboardBootstrap,
        resetSourceIdentityUi,
        setActiveView,
        setSessionShellVisible,
        setStopSofaStatus,
        setTrackingStopped
    ]);

    const stopAndReturnToLinks = useCallback(async () => {
        try {
            const data = await stopMatchTracking(sofaEventId || null);

            if (!data?.ok) {
                return {
                    ok: false,
                    error: 'Unable to stop live tracking.'
                };
            }

            stopSofaPolling();
            clearConfirmedSession();
            setSessionShellVisible(false);
            setActiveView('overview');
            setTrackingStopped(true);
            resetDashboardBootstrap();

            return { ok: true };
        } catch (_) {
            return {
                ok: false,
                error: 'Unable to stop live tracking.'
            };
        }
    }, [
        clearConfirmedSession,
        resetDashboardBootstrap,
        setActiveView,
        setSessionShellVisible,
        setTrackingStopped,
        sofaEventId,
        stopSofaPolling
    ]);

    const handleStopLiveTracking = useCallback(async () => {
        setStopSofaStatus('Stopping live tracking...');

        try {
            const data = await stopMatchTracking(sofaEventId || null);

            if (data.ok) {
                setStopSofaStatus('Live tracking stopped');
                stopSofaPolling();
                setTrackingStopped(true);
            } else {
                setStopSofaStatus('Stop failed: ' + (data.error || 'unknown'));
            }
        } catch (error) {
            setStopSofaStatus('Stop failed: ' + error.message);
        }
    }, [
        setStopSofaStatus,
        setTrackingStopped,
        sofaEventId,
        stopSofaPolling
    ]);

    return {
        handleSearch,
        stopAndReturnToLinks,
        handleStopLiveTracking
    };
}
