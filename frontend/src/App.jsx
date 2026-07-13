import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import OverviewDashboard from './components/OverviewDashboard';
import StartAnalysisPanel from './components/StartAnalysisPanel';
import DashboardWorkspace from './components/DashboardWorkspace';
import SourceIdentityGateToast from './components/SourceIdentityGateToast';
import SourceIdentityGateWaitingScreen from './components/SourceIdentityGateWaitingScreen';
import SourceIdentityConfirmationModal from './components/marketReactions/SourceIdentityConfirmationModal';
import { useBetfairHealthAlerts } from './hooks/useBetfairHealthAlerts';
import { useDashboardViewModel } from './hooks/useDashboardViewModel';
import { useMatchPolling } from './hooks/useMatchPolling';
import { useBetfairJson } from './hooks/useBetfairJson';
import { useMarketReactionEvidence } from './hooks/useMarketReactionEvidence';
import { useSourceIdentityGateStatus } from './hooks/useSourceIdentityGateStatus';
import {
    buildProfilePath,
    confirmSourceIdentityGate,
    fetchBetfairLogLines,
    openBetfairLoginWindow,
    startMatchTracking,
    stopMatchTracking
} from './services/liveSessionApi';
import LayTheWinner from './components/LayTheWinner';
import BancaServizio from './components/BancaServizio';
import Superbreak from './components/Superbreak';
import MarketReactionsPage from './components/MarketReactionsPage';
import { getSofaEventId } from './utils/preflight.js';
import {
    buildBetfairLoginRequest,
    buildMatchTrackingRequest
} from './utils/liveSessionRequests.js';
import { buildSourceIdentityGatePresentation } from './utils/sourceIdentityGatePresentation.js';
import { usePreflightChecks } from './hooks/usePreflightChecks';
import { useAnalysisSessionState } from './hooks/useAnalysisSessionState.js';

const API_BASE = '';

function App() {
    const {
        matchUrl,
        setMatchUrl,
        betfairUrl,
        setBetfairUrl,
        betfairGraphUrls,
        setBetfairGraphUrls,
        betfairMode,
        setBetfairMode,
        chromeProfilePath,
        setChromeProfilePath,
        chromeProfileName,
        cdpUrl,
        setCdpUrl,
        confirmedUrl,
        confirmedBetfairUrl,
        confirmedBetfairMode,
        confirmedChromeProfilePath,
        confirmedCdpUrl,
        applySearchSession,
        clearConfirmedSession
    } = useAnalysisSessionState();

    const [betfairLog, setBetfairLog] = useState([]);
    const [showBetfairLog, setShowBetfairLog] = useState(false);
    const [activeView, setActiveView] = useState('overview');
    const [stopSofaStatus, setStopSofaStatus] = useState('');
    const [sessionShellVisible, setSessionShellVisible] = useState(false);
    const [sourceIdentityToast, setSourceIdentityToast] = useState(null);
    const [confirmationOpen, setConfirmationOpen] = useState(false);
    const [trackingStopped, setTrackingStopped] = useState(false);
    const [dashboardContentReady, setDashboardContentReady] = useState(false);
    const awaitingDashboardBootstrapRef = useRef(false);
    const sawDashboardResetRef = useRef(false);

    const [checks, setChecks] = useState({
        backend: { status: 'idle', message: '' },
        cdp: { status: 'idle', message: '' },
        sofa: { status: 'idle', message: '' },
        betfair: { status: 'idle', message: '' },
        graphs: { status: 'idle', message: '' }
    });

    const sofaEventId = getSofaEventId(confirmedUrl);
    const hasBetfairUrl = Boolean(confirmedBetfairUrl?.trim());

    const {
        evidence: marketReactionEvidence,
        loading: marketReactionLoading,
        error: marketReactionError,
        reasons: marketReactionReasons,
        lastUpdate: marketReactionLastUpdate,
        isPolling: isMarketReactionPolling,
        refresh: refreshMarketReactionEvidence
    } = useMarketReactionEvidence(sofaEventId);

    const {
        data: backendData,
        loading: sofaLoading,
        error: sofaError,
        lastUpdate: sofaLastUpdate,
        isPolling: isSofaPolling,
        serverStatus,
        loadMatch,
        stopPolling: stopSofaPolling
    } = useMatchPolling(confirmedUrl, 2500, sofaEventId);

    const {
        data: betfairData,
        health: betfairHealthFromHook,
        moneyFlowHistory: betfairMoneyFlowHistory,
        lastUpdate: betfairLastUpdate
    } = useBetfairJson(confirmedBetfairUrl, sofaEventId, 5000, {
        mode: confirmedBetfairMode,
        cdpUrl: confirmedCdpUrl
    });

    const betfairHealth = betfairData?.health || betfairHealthFromHook || null;

    const {
        dashboardData,
        betfairHistory
    } = useDashboardViewModel({
        backendData,
        isSofaPolling,
        sofaLastUpdate,
        serverStatus,
        betfairData,
        betfairMoneyFlowHistory,
        confirmedUrl,
        loadMatch
    });

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

    const hasDashboardData = dashboardContentReady && Boolean(dashboardData);

    const {
        betfairHealthTransition,
        betfairAudioAlertEnabled,
        setBetfairAudioAlertEnabled,
        showBetfairAlertToast,
        dismissBetfairAlertToast
    } = useBetfairHealthAlerts({
        betfairHealth,
        hasDashboard: Boolean(dashboardData)
    });

    const sourceIdentityGate = useSourceIdentityGateStatus(sofaEventId, {
        enabled: sessionShellVisible
    });

    const sourceIdentityStatusForUi = useMemo(() => (
        sourceIdentityGate.error
            ? { error: sourceIdentityGate.error }
            : sourceIdentityGate.status
    ), [sourceIdentityGate.error, sourceIdentityGate.status]);

    const sourceIdentityPresentation = useMemo(() => (
        buildSourceIdentityGatePresentation({
            status: sourceIdentityStatusForUi,
            hasBetfairUrl,
            trackingStopped
        })
    ), [hasBetfairUrl, sourceIdentityStatusForUi, trackingStopped]);

    const sourceIdentity = sourceIdentityStatusForUi?.sourceIdentity ?? null;
    const shouldShowDashboard = hasDashboardData;
    const previousGatePhaseRef = useRef(null);
    const acknowledgedPendingKeyRef = useRef(null);

    const pendingIdentityKey = useMemo(() => {
        if (!sourceIdentityPresentation.canOpenConfirmation) {
            return '';
        }

        const sofaPlayers = Array.isArray(sourceIdentity?.sofaPlayers)
            ? sourceIdentity.sofaPlayers
            : [];
        const betfairRunners = Array.isArray(sourceIdentity?.betfairRunners)
            ? sourceIdentity.betfairRunners
            : [];

        return [
            sofaEventId,
            ...sofaPlayers,
            '::',
            ...betfairRunners
        ].join('\u0001');
    }, [
        sofaEventId,
        sourceIdentity,
        sourceIdentityPresentation.canOpenConfirmation
    ]);

    useEffect(() => {
        if (!pendingIdentityKey) {
            acknowledgedPendingKeyRef.current = null;
            setConfirmationOpen(false);
            return;
        }

        if (acknowledgedPendingKeyRef.current !== pendingIdentityKey) {
            setConfirmationOpen(true);
        }
    }, [pendingIdentityKey]);

    useEffect(() => {
        if (!sessionShellVisible) {
            return;
        }

        const phase = sourceIdentityStatusForUi?.phase ?? null;
        const isRecordingAligned = (
            phase === 'recording' &&
            sourceIdentityStatusForUi?.sourceIdentity?.status === 'aligned'
        );

        if (
            isRecordingAligned &&
            previousGatePhaseRef.current !== 'recording'
        ) {
            setSourceIdentityToast({
                tone: 'success',
                title: 'Fonti allineate',
                detail: 'Registrazione live avviata.'
            });
        }

        if (
            phase === 'mismatch' &&
            previousGatePhaseRef.current !== 'mismatch'
        ) {
            setSourceIdentityToast({
                tone: 'danger',
                title: 'Fonti non corrispondono',
                detail: 'Correggi i link e avvia di nuovo l’analisi.'
            });
            stopSofaPolling();
            clearConfirmedSession();
            setConfirmationOpen(false);
            setSessionShellVisible(false);
            setActiveView('overview');
            setTrackingStopped(false);
            awaitingDashboardBootstrapRef.current = false;
            setDashboardContentReady(false);
        }

        if (phase) {
            previousGatePhaseRef.current = phase;
        }
    }, [
        clearConfirmedSession,
        sessionShellVisible,
        sourceIdentityStatusForUi,
        stopSofaPolling
    ]);

    const dismissSourceIdentityToast = useCallback(() => {
        setSourceIdentityToast(null);
    }, []);

    const fetchBetfairLog = async () => {
        try {
            const lines = await fetchBetfairLogLines();
            setBetfairLog(lines);
        } catch (error) {
            console.error('Failed to fetch Betfair log:', error);
        }
    };

    const openBetfairLogin = async () => {
        const loginRequest = buildBetfairLoginRequest({
            betfairUrl,
            confirmedBetfairUrl,
            betfairMode,
            confirmedBetfairMode,
            chromeProfilePath,
            confirmedChromeProfilePath,
            cdpUrl,
            confirmedCdpUrl
        });

        if (!loginRequest) {
            return;
        }

        try {
            await openBetfairLoginWindow(loginRequest);
        } catch (error) {
            console.error('Failed to open Betfair login window:', error);
        }
    };

    const {
        testBackend,
        testCdp,
        testSofaUrl,
        testBetfairUrl,
        testGraphUrls,
        runAllChecks
    } = usePreflightChecks({
        apiBase: API_BASE,
        cdpUrl,
        matchUrl,
        betfairUrl,
        betfairGraphUrls,
        betfairMode,
        setChecks
    });

    const handleSearch = async (
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

        previousGatePhaseRef.current = null;
        acknowledgedPendingKeyRef.current = null;
        setActiveView('overview');
        setSessionShellVisible(true);
        setSourceIdentityToast(null);
        setConfirmationOpen(false);
        setTrackingStopped(false);
        setStopSofaStatus('');
        setDashboardContentReady(false);
        awaitingDashboardBootstrapRef.current = true;
        sawDashboardResetRef.current = false;

        try {
            await startMatchTracking(trackingRequest);
        } catch (error) {
            awaitingDashboardBootstrapRef.current = false;
            setDashboardContentReady(false);
            setSessionShellVisible(false);
            console.error('Failed to start match tracker:', error);
        }
    };

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
            setConfirmationOpen(false);
            setSessionShellVisible(false);
            setActiveView('overview');
            setTrackingStopped(true);
            awaitingDashboardBootstrapRef.current = false;
            setDashboardContentReady(false);

            return { ok: true };
        } catch (_) {
            return {
                ok: false,
                error: 'Unable to stop live tracking.'
            };
        }
    }, [clearConfirmedSession, sofaEventId, stopSofaPolling]);

    const handleConfirmSourceIdentity = useCallback(async (
        selectedPairs,
        confirmationText
    ) => {

        if (!sofaEventId) {
            return {
                ok: false,
                error: 'Unable to confirm source identity.'
            };
        }

        try {
            const payload = await confirmSourceIdentityGate(sofaEventId, {
                selectedPairs,
                confirmationText
            });

            if (payload?.ok !== true) {
                return {
                    ok: false,
                    error: 'Unable to confirm source identity.'
                };
            }

            await sourceIdentityGate.refresh();
            acknowledgedPendingKeyRef.current = pendingIdentityKey;
            setConfirmationOpen(false);

            return { ok: true };
        } catch (_) {
            return {
                ok: false,
                error: 'Unable to confirm source identity.'
            };
        }
    }, [
        pendingIdentityKey,
        sofaEventId,
        sourceIdentityGate.refresh
    ]);

    const openSourceIdentityConfirmation = useCallback(() => {
        if (sourceIdentityPresentation.canOpenConfirmation) {
            setConfirmationOpen(true);
        }
    }, [sourceIdentityPresentation.canOpenConfirmation]);

    const handleStopLiveTracking = async () => {
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
    };

    const renderContent = () => {
        if (activeView === 'lay') {
            return <LayTheWinner matchUrl={confirmedUrl} />;
        }

        if (activeView === 'banca') {
            return <BancaServizio />;
        }

        if (activeView === 'superbreak') {
            return <Superbreak />;
        }

        if (activeView === 'market-reactions') {
            return (
                <MarketReactionsPage
                    eventId={sofaEventId}
                    evidence={marketReactionEvidence}
                    loading={marketReactionLoading}
                    error={marketReactionError}
                    reasons={marketReactionReasons}
                    lastUpdate={marketReactionLastUpdate}
                    isPolling={isMarketReactionPolling}
                    refresh={refreshMarketReactionEvidence}
                />
            );
        }

        return (
            <OverviewDashboard
                dashboardData={dashboardData}
                betfairHistory={betfairHistory}
                betfairHealth={betfairHealth}
                betfairHealthTransition={betfairHealthTransition}
                confirmedUrl={confirmedUrl}
                stopSofaStatus={stopSofaStatus}
                onStopLiveTracking={handleStopLiveTracking}
            />
        );
    };

    return (
        <div className="min-h-screen bg-[var(--bg-0)] flex overflow-hidden">
            {sessionShellVisible ? (
                <DashboardWorkspace
                    dashboardData={shouldShowDashboard ? dashboardData : null}
                    backendData={backendData}
                    sofaLastUpdate={sofaLastUpdate}
                    sofaServerStatus={serverStatus}
                    betfairData={betfairData}
                    betfairLastUpdate={betfairLastUpdate}
                    betfairHealth={betfairHealth}
                    betfairHealthTransition={betfairHealthTransition}
                    betfairAudioAlertEnabled={betfairAudioAlertEnabled}
                    onToggleBetfairAudioAlert={() => setBetfairAudioAlertEnabled(prev => !prev)}
                    showBetfairAlertToast={showBetfairAlertToast}
                    onDismissBetfairAlertToast={dismissBetfairAlertToast}
                    sourceIdentityGateStatus={sourceIdentityStatusForUi}
                    hasBetfairUrl={hasBetfairUrl}
                    trackingStopped={trackingStopped}
                    onOpenSourceIdentityConfirmation={openSourceIdentityConfirmation}
                    sourceIdentityToast={sourceIdentityToast}
                    onDismissSourceIdentityToast={dismissSourceIdentityToast}
                    activeView={activeView}
                    onViewChange={setActiveView}
                >
                    {shouldShowDashboard ? (
                        renderContent()
                    ) : (
                        <SourceIdentityGateWaitingScreen
                            presentation={sourceIdentityPresentation}
                            onReturnToLinks={stopAndReturnToLinks}
                        />
                    )}
                </DashboardWorkspace>
            ) : (
                <StartAnalysisPanel
                    matchUrl={matchUrl}
                    setMatchUrl={setMatchUrl}
                    betfairUrl={betfairUrl}
                    setBetfairUrl={setBetfairUrl}
                    betfairGraphUrls={betfairGraphUrls}
                    setBetfairGraphUrls={setBetfairGraphUrls}
                    betfairMode={betfairMode}
                    setBetfairMode={setBetfairMode}
                    chromeProfilePath={chromeProfilePath}
                    setChromeProfilePath={setChromeProfilePath}
                    chromeProfileName={chromeProfileName}
                    cdpUrl={cdpUrl}
                    setCdpUrl={setCdpUrl}
                    openBetfairLogin={openBetfairLogin}
                    fetchBetfairLog={fetchBetfairLog}
                    showBetfairLog={showBetfairLog}
                    setShowBetfairLog={setShowBetfairLog}
                    betfairLog={betfairLog}
                    checks={checks}
                    testBackend={testBackend}
                    testCdp={testCdp}
                    testSofaUrl={testSofaUrl}
                    testBetfairUrl={testBetfairUrl}
                    testGraphUrls={testGraphUrls}
                    runAllChecks={runAllChecks}
                    handleSearch={handleSearch}
                    sofaLoading={sofaLoading}
                    sofaError={sofaError}
                />
            )}

            {!sessionShellVisible && sourceIdentityToast?.tone === 'danger' && (
                <SourceIdentityGateToast
                    toast={sourceIdentityToast}
                    onDismiss={dismissSourceIdentityToast}
                />
            )}

            {sessionShellVisible && confirmationOpen && sourceIdentity && (
                <SourceIdentityConfirmationModal
                    sourceIdentity={sourceIdentity}
                    onConfirm={handleConfirmSourceIdentity}
                    onDecline={stopAndReturnToLinks}
                />
            )}
        </div>
    );
}

export default App;
