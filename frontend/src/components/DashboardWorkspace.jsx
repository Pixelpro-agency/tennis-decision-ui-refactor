import TopBar from './TopBar';
import MatchOverviewBar from './MatchOverviewBar';
import BetfairHealthToast from './BetfairHealthToast';
import SourceIdentityGateToast from './SourceIdentityGateToast';
import Sidebar from './Sidebar';
import { buildDashboardConnections } from '../utils/dashboardConnections.js';

const DashboardWorkspace = ({
    dashboardData,
    backendData,
    sofaLastUpdate,
    sofaServerStatus,
    sofaReadStatus,
    betfairData,
    betfairReadStatus,
    betfairLastUpdate,
    betfairHealth,
    betfairHealthTransition,
    betfairAudioAlertEnabled,
    onToggleBetfairAudioAlert,
    showBetfairAlertToast,
    onDismissBetfairAlertToast,
    sourceIdentityGateStatus,
    hasBetfairUrl,
    trackingStopped,
    persistenceViewState,
    onOpenSourceIdentityConfirmation,
    sourceIdentityToast,
    onDismissSourceIdentityToast,
    activeView,
    onViewChange,
    children
}) => {
    const connections = buildDashboardConnections({
        backendData,
        sofaLastUpdate,
        sofaServerStatus,
        sofaReadStatus,
        sourceIdentityGateStatus,
        betfairData,
        betfairReadStatus,
        betfairLastUpdate,
        betfairHealth,
        betfairHealthTransition,
        betfairAudioAlertEnabled,
        onToggleBetfairAudioAlert
    });

    const topBarData = dashboardData?.topBar ?? {
        left: null,
        statusBadges: [],
        right: {
            lastUpdate: {
                label: "Ultimo aggiornamento",
                value: sofaLastUpdate || "—"
            }
        }
    };

    return (
        <>
            <BetfairHealthToast
                visible={showBetfairAlertToast}
                health={betfairHealth}
                onDismiss={onDismissBetfairAlertToast}
            />

            <SourceIdentityGateToast
                toast={sourceIdentityToast}
                onDismiss={onDismissSourceIdentityToast}
            />

            <Sidebar
                activeView={activeView}
                onViewChange={onViewChange}
                betfairHealth={betfairHealth}
                sourceIdentityGateStatus={sourceIdentityGateStatus}
                hasBetfairUrl={hasBetfairUrl}
                trackingStopped={trackingStopped}
                onOpenSourceIdentityConfirmation={onOpenSourceIdentityConfirmation}
            />

            <div className="flex-1 flex flex-col h-screen overflow-y-auto overflow-x-hidden">
                <TopBar
                    data={topBarData}
                    connections={connections}
                />

                {['degraded', 'error'].includes(persistenceViewState?.status) && (
                    <div
                        className="mx-4 mt-3 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-sm text-amber-200"
                        role="status"
                    >
                        {persistenceViewState.label}
                    </div>
                )}

                {dashboardData && (
                    <MatchOverviewBar data={dashboardData.matchOverviewBar} />
                )}

                <main className="flex-1">
                    {children}
                </main>

                <div className="h-10" />
            </div>
        </>
    );
};

export default DashboardWorkspace;
