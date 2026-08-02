import { useState } from 'react';
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
import { fetchBetfairLogLines } from './services/liveSessionApi';
import LayTheWinner from './components/LayTheWinner';
import BancaServizio from './components/BancaServizio';
import Superbreak from './components/Superbreak';
import MarketReactionsPage from './components/MarketReactionsPage';
import { getSofaEventId } from './utils/preflight.js';
import { usePreflightChecks } from './hooks/usePreflightChecks';
import { useAnalysisSessionState } from './hooks/useAnalysisSessionState.js';
import { useDashboardBootstrapState } from './hooks/useDashboardBootstrapState.js';
import { useBetfairLoginAction } from './hooks/useBetfairLoginAction.js';
import { useLiveTrackingActions } from './hooks/useLiveTrackingActions.js';
import { frontendRuntimeLog } from './utils/runtimeLog.js';
import { useSourceIdentityGateUi } from './hooks/useSourceIdentityGateUi.js';

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
    const [trackingStopped, setTrackingStopped] = useState(false);

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

    const {
        dashboardContentReady,
        beginDashboardBootstrap,
        resetDashboardBootstrap
    } = useDashboardBootstrapState({ backendData, sessionShellVisible });
    const hasDashboardData = dashboardContentReady && Boolean(dashboardData);
    const shouldShowDashboard = hasDashboardData;

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

    const {
        sourceIdentity,
        sourceIdentityStatusForUi,
        sourceIdentityPresentation,
        sourceIdentityToast,
        confirmationOpen,
        dismissSourceIdentityToast,
        resetSourceIdentityUi,
        closeSourceIdentityConfirmation,
        handleConfirmSourceIdentity,
        openSourceIdentityConfirmation
    } = useSourceIdentityGateUi({
        sourceIdentityGate,
        sofaEventId,
        hasBetfairUrl,
        trackingStopped,
        sessionShellVisible,
        stopSofaPolling,
        clearConfirmedSession,
        setSessionShellVisible,
        setActiveView,
        setTrackingStopped,
        resetDashboardBootstrap
    });

    const fetchBetfairLog = async () => {
        try {
            const lines = await fetchBetfairLogLines();
            setBetfairLog(lines);
        } catch (_error) {
            frontendRuntimeLog('error', 'betfair_log_fetch_failed', { code: 'log_request_failed' });
        }
    };

    const openBetfairLogin = useBetfairLoginAction({
        betfairUrl,
        confirmedBetfairUrl,
        betfairMode,
        confirmedBetfairMode,
        chromeProfilePath,
        confirmedChromeProfilePath,
        cdpUrl,
        confirmedCdpUrl
    });

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

    const {
        handleSearch,
        stopAndReturnToLinks,
        handleStopLiveTracking
    } = useLiveTrackingActions({
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
    });

    const stopAndCloseConfirmation = async () => {
        closeSourceIdentityConfirmation();
        return stopAndReturnToLinks();
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
                            onReturnToLinks={stopAndCloseConfirmation}
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
                    onDecline={stopAndCloseConfirmation}
                />
            )}
        </div>
    );
}

export default App;
