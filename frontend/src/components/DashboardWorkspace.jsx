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
    betfairData,
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
        sourceIdentityGateStatus,
        betfairData,
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
