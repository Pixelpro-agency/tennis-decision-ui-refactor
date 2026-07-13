import MatchContextCard from './MatchContextCard';
import KeyStatsCard from './KeyStatsCard';
import BetfairDepthCard from './BetfairDepthCard';
import TotManualInputPlaceholder from './TotManualInputPlaceholder';

export default function OverviewDashboard({
  dashboardData,
  betfairHistory,
  betfairHealth,
  betfairHealthTransition,
  confirmedUrl,
  stopSofaStatus,
  onStopLiveTracking
}) {
  return (
    <div className="max-w-[1400px] w-full px-6 mt-6 mx-auto">
      <div className="dashboardGrid mb-6">
        <MatchContextCard
          localContext={dashboardData.localContext}
          players={dashboardData.players}
        />
        <KeyStatsCard data={dashboardData.mainGrid.rightCard} />
      </div>

      <div className="mb-6">
        <BetfairDepthCard
          data={dashboardData.betfair}
          history={betfairHistory}
          health={betfairHealth}
          healthTransition={betfairHealthTransition}
        />
      </div>

      <TotManualInputPlaceholder data={dashboardData.totPlaceholder} />

      <div className="mt-8 p-4 border-t border-[var(--card-border)] text-[var(--muted)] text-xs flex justify-between items-center gap-4">
        <span>
          {confirmedUrl ? (
            <a href={confirmedUrl} target="_blank" rel="noreferrer" className="text-[var(--accent-blue)] underline">
              Open SofaScore match
            </a>
          ) : (
            <span className="opacity-40">No SofaScore URL</span>
          )}
        </span>

        <span className="flex items-center gap-3">
          {stopSofaStatus && (
            <span className={stopSofaStatus.startsWith("Stop failed") ? "text-red-400" : "text-green-400"}>
              {stopSofaStatus}
            </span>
          )}

          <button
            onClick={onStopLiveTracking}
            className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-1 px-3 rounded-lg transition-all"
          >
            Stop Live Tracking
          </button>
        </span>
      </div>
    </div>
  );
}
