import { useCallback } from 'react';
import {
    buildProfilePath,
    startMatchTracking,
    stopMatchTracking
} from '../services/liveSessionApi.js';
import { buildMatchTrackingRequest } from '../utils/liveSessionRequests.js';
import { frontendRuntimeLog } from '../utils/runtimeLog.js';

export function readTrackingSessionAuthority(payload) {
    const trackingSessionId = typeof payload?.trackingSessionId === 'string'
        ? payload.trackingSessionId.trim()
        : '';
    return trackingSessionId || null;
}

export function useLiveTrackingActions({
    sofaEventId,
    applySearchSession,
    clearConfirmedSession,
    stopSofaPolling,
    resetSourceIdentityUi,
    setActiveView,
    setSessionShellVisible,
    setSessionActive,
    setTrackingSessionId,
    setStartTrackingError,
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

        resetSourceIdentityUi();
        setActiveView('overview');
        setSessionShellVisible(true);
        setSessionActive(false);
        setTrackingSessionId(null);
        setStartTrackingError(null);
        setTrackingStopped(false);
        setStopSofaStatus('');
        try {
            const payload = await startMatchTracking(trackingRequest);
            const nextTrackingSessionId = readTrackingSessionAuthority(payload);
            if (!nextTrackingSessionId) {
                throw Object.assign(new Error('tracking_session_missing'), {
                    code: 'tracking_session_missing'
                });
            }

            applySearchSession({
                sofaUrl: sUrl,
                betfairUrl: bUrl,
                betfairGraphUrls: graphUrls,
                betfairMode: mode,
                chromeProfileInput: cProfile,
                fullChromeProfilePath: fullProfilePath,
                cdpUrl: cdp
            });
            setTrackingSessionId(nextTrackingSessionId);
            setSessionActive(true);
            beginDashboardBootstrap(nextTrackingSessionId);
            return { ok: true, trackingSessionId: nextTrackingSessionId };
        } catch (error) {
            resetDashboardBootstrap();
            clearConfirmedSession();
            setSessionActive(false);
            setTrackingSessionId(null);
            setSessionShellVisible(false);
            const code = error?.code || 'tracking_request_failed';
            setStartTrackingError(code);
            frontendRuntimeLog('error', 'tracking_start_failed', { code });
            return { ok: false, code, error: 'Unable to start live tracking.' };
        }
    }, [
        applySearchSession,
        beginDashboardBootstrap,
        clearConfirmedSession,
        resetDashboardBootstrap,
        resetSourceIdentityUi,
        setActiveView,
        setSessionShellVisible,
        setSessionActive,
        setStartTrackingError,
        setStopSofaStatus,
        setTrackingSessionId,
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
            setSessionActive(false);
            setTrackingSessionId(null);
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
        setSessionActive,
        setSessionShellVisible,
        setTrackingSessionId,
        setTrackingStopped,
        sofaEventId,
        stopSofaPolling
    ]);

    const handleStopLiveTracking = useCallback(async () => {
        setStopSofaStatus('Stopping live tracking...');

        try {
            const data = await stopMatchTracking(sofaEventId || null);

            setStopSofaStatus('Live tracking stopped');
            stopSofaPolling();
            setSessionActive(false);
            setTrackingSessionId(null);
            setTrackingStopped(true);
            return { ok: true, data };
        } catch (_error) {
            setStopSofaStatus('Unable to stop live tracking.');
            return { ok: false, code: 'tracking_stop_failed', error: 'Unable to stop live tracking.' };
        }
    }, [
        setStopSofaStatus,
        setSessionActive,
        setTrackingSessionId,
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
