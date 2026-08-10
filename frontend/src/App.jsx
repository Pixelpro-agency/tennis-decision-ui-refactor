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
import MarketReactionsPage from './components/MarketReactionsPage';
import { getSofaEventId } from './utils/preflight.js';
import { usePreflightChecks } from './hooks/usePreflightChecks';
import { useAnalysisSessionState } from './hooks/useAnalysisSessionState.js';
import { useDashboardBootstrapState } from './hooks/useDashboardBootstrapState.js';
import { useBetfairLoginAction } from './hooks/useBetfairLoginAction.js';
import { useLiveTrackingActions } from './hooks/useLiveTrackingActions.js';
import { frontendRuntimeLog } from './utils/runtimeLog.js';
import { useSourceIdentityGateUi } from './hooks/useSourceIdentityGateUi.js';
import { buildPersistenceViewState } from './utils/persistenceViewState.js';

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
    const [sessionActive, setSessionActive] = useState(false);
    const [trackingSessionId, setTrackingSessionId] = useState(null);
    const [startTrackingError, setStartTrackingError] = useState(null);
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
        integrity: marketReactionIntegrity,
        sources: marketReactionSources,
        persistenceComplete: marketReactionPersistenceComplete,
        readStatus: marketReactionReadStatus,
        isPolling: isMarketReactionPolling,
        refresh: refreshMarketReactionEvidence
    } = useMarketReactionEvidence(sessionActive ? sofaEventId : '');

    const {
        data: backendData,
        loading: sofaLoading,
        error: sofaError,
        lastUpdate: sofaLastUpdate,
        isPolling: isSofaPolling,
        serverStatus,
        readStatus: sofaReadStatus,
        integrity: sofaIntegrity,
        loadMatch,
        stopPolling: stopSofaPolling
    } = useMatchPolling(
        sessionActive ? confirmedUrl : '',
        2500,
        sessionActive ? sofaEventId : ''
    );

    const {
        data: betfairData,
        health: betfairHealthFromHook,
        error: betfairError,
        moneyFlowHistory: betfairMoneyFlowHistory,
        lastKnownMoneyFlowHistory: betfairLastKnownMoneyFlowHistory,
        lastKnownData: betfairLastKnownData,
        lastUpdate: betfairLastUpdate,
        sourceUpdatedAt: betfairSourceUpdatedAt,
        isPolling: isBetfairPolling,
        integrity: betfairIntegrity,
        readStatus: betfairReadStatus
    } = useBetfairJson(
        sessionActive ? confirmedBetfairUrl : '',
        sessionActive ? sofaEventId : '',
        5000,
        {
        mode: confirmedBetfairMode,
        cdpUrl: confirmedCdpUrl
        }
    );

    const betfairHealth = betfairData?.health || betfairHealthFromHook || null;

    const {
        dashboardData,
        betfairHistory,
        lastKnownDashboardData
    } = useDashboardViewModel({
        backendData,
        isSofaPolling,
        sofaLastUpdate,
        serverStatus,
        betfairData,
        betfairMoneyFlowHistory,
        confirmedUrl,
        loadMatch,
        matchReadStatus: sofaReadStatus
    });

    const {
        dashboardContentReady,
        beginDashboardBootstrap,
        resetDashboardBootstrap
    } = useDashboardBootstrapState({
        backendData,
        sessionActive,
        trackingSessionId
    });
    const hasDashboardData = dashboardContentReady && Boolean(dashboardData);
    const shouldShowDashboard = hasDashboardData;
    const persistenceViewState = buildPersistenceViewState({
        sessionActive,
        dashboardReady: hasDashboardData,
        sofaIntegrity,
        betfairIntegrity,
        evidenceIntegrity: marketReactionIntegrity,
        evidencePersistenceComplete: marketReactionPersistenceComplete,
        sofaError,
        betfairError,
        evidenceError: marketReactionError
    });

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
        enabled: sessionActive
    });

    const {
        sourceIdentity,
        sourceIdentityStatusForUi,
        sourceIdentityPresentation,
        sourceIdentityToast,
        confirmationOpen,
        dismissSourceIdentityToast,
        resetSourceIdentityUi,
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
        setSessionActive,
        setTrackingSessionId,
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
        setSessionActive,
        setTrackingSessionId,
        setStartTrackingError,
        setTrackingStopped,
        setStopSofaStatus,
        beginDashboardBootstrap,
        resetDashboardBootstrap
    });

    const stopAndCloseConfirmation = async () => {
        return stopAndReturnToLinks();
    };

    const renderContent = () => {
        if (activeView === 'market-reactions') {
            return (
                <MarketReactionsPage
                    eventId={sofaEventId}
                    evidence={marketReactionEvidence}
                    loading={marketReactionLoading}
                    error={marketReactionError}
                    reasons={marketReactionReasons}
                    integrity={marketReactionIntegrity}
                    sources={marketReactionSources}
                    persistenceComplete={marketReactionPersistenceComplete}
                    readStatus={marketReactionReadStatus}
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
                betfairLastKnownData={betfairLastKnownData}
                betfairLastKnownHistory={betfairLastKnownMoneyFlowHistory}
                betfairReadStatus={betfairReadStatus}
                betfairIsPolling={isBetfairPolling}
                betfairSourceUpdatedAt={betfairSourceUpdatedAt}
                persistenceViewState={persistenceViewState}
                trackingStopped={trackingStopped}
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
                    sofaReadStatus={sofaReadStatus}
                    betfairData={betfairData}
                    betfairReadStatus={betfairReadStatus}
                    lastKnownDashboardData={lastKnownDashboardData}
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
                    persistenceViewState={persistenceViewState}
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
                    startTrackingError={startTrackingError}
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
