import {
    Activity,
    BarChart3
} from 'lucide-react';
import {
    buildSharedGrid,
    getDisplayMatchedVolume,
    toNumber
} from '../utils/betfairMoneyFlow.js';
import BetfairHealthDebugPanel from './betfair/BetfairHealthDebugPanel.jsx';
import BetfairRunnerDepth from './betfair/BetfairRunnerDepth.jsx';

function formatHealthTimestamp(value) {
    if (!value) {
        return 'n/d';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return String(value);
    }

    return date.toLocaleString('it-IT');
}

function getSharedMaxVal(series) {
    let sharedMaxVal = 0;

    if (!Array.isArray(series)) {
        return sharedMaxVal;
    }

    for (const item of series) {
        const points = Array.isArray(item?.points) ? item.points : [];

        for (const point of points) {
            sharedMaxVal = Math.max(
                sharedMaxVal,
                getDisplayMatchedVolume(point)
            );
        }
    }

    return sharedMaxVal;
}

export default function BetfairDepthCard({
    data,
    history,
    health,
    healthTransition
}) {
    const healthInfo = health || data?.health || null;
    const latestBetfairAt = healthInfo?.timestamps?.latestBetfairAt || null;
    const latestUsableLadderAt = healthInfo?.timestamps?.latestUsableLadderAt || null;

    if (!data || !data.runners) {
        const isRed = healthInfo?.status === 'red';
        const defaultMessage = 'Betfair logout detected — graph page requires login';
        const detailMessage = healthInfo?.metrics?.graphLoginRequiredText ||
            healthInfo?.message ||
            defaultMessage;
        const redMessage = `BETFAIR ALERT — ${detailMessage}`;

        return (
            <div className="dashboardCard p-6 flex flex-col items-center justify-center min-h-[300px] text-slate-500">
                {isRed ? (
                    <div className="w-full bg-red-600/10 border border-red-500/30 rounded-xl p-6 text-center mb-6 text-red-400">
                        <BarChart3 className="w-12 h-12 mb-4 mx-auto opacity-70 text-red-500 animate-pulse" />
                        <h4 className="text-base font-bold uppercase tracking-wider mb-2">
                            {redMessage}
                        </h4>
                        <p className="text-[11px] text-slate-400 uppercase tracking-tighter">
                            Please log in to Betfair to restore the feed.
                        </p>
                    </div>
                ) : (
                    <>
                        <BarChart3 className="w-12 h-12 mb-4 opacity-20" />
                        <p className="text-sm">
                            {'Waiting for Betfair Exchange data' + '.' + '.' + '.'}
                        </p>
                        <p className="text-[10px] uppercase tracking-tighter mt-2 opacity-50">
                            Polling active (5s)
                        </p>
                    </>
                )}

                {healthInfo && (
                    <div className="mt-4 w-full max-w-md">
                        <BetfairHealthDebugPanel health={healthInfo} />
                    </div>
                )}
            </div>
        );
    }

    const series = Array.isArray(history?.series) ? history.series : [];
    const sharedGrid = buildSharedGrid(series.map(item => item.points));
    const sharedMaxVal = getSharedMaxVal(series);

    return (
        <div className="dashboardCard overflow-hidden flex flex-col h-full">
            <div className="px-5 py-4 border-b border-[var(--card-border)] flex justify-between items-center bg-blue-500/5">
                <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-[var(--accent-blue)]" />
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                        Betfair Match Odds Depth
                    </h3>
                </div>

                <div className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                    Total Matched: {toNumber(data.market?.totalMatched) > 0
                        ? `${toNumber(data.market.totalMatched).toLocaleString('it-IT', {
                            maximumFractionDigits: 0
                        })} EUR`
                        : (data.market_info?.total_matched || '0 EUR')}
                </div>
            </div>

            {healthInfo && ['yellow', 'red', 'finished'].includes(healthInfo.status) && (
                <div className={`px-5 py-3 text-xs font-bold uppercase tracking-wider border-b border-[var(--card-border)] ${
                    healthInfo.status === 'red'
                        ? 'bg-red-500/10 text-red-400'
                        : healthInfo.status === 'yellow'
                            ? 'bg-amber-500/10 text-amber-400'
                            : 'bg-gray-500/10 text-gray-400'
                }`}>
                    <div className="flex items-center gap-2">
                        <span>
                            {healthInfo.status === 'red'
                                ? (healthInfo.metrics?.graphLoginRequiredText
                                    ? `BETFAIR ALERT — ${healthInfo.metrics.graphLoginRequiredText}`
                                    : `BETFAIR ALERT — ${healthInfo.message || 'Betfair logout detected — graph page requires login'}`)
                                : healthInfo.status === 'yellow'
                                    ? (healthInfo.message || 'Betfair graph/ladder data is stale')
                                    : 'Betfair market finished'}
                        </span>

                        {healthInfo.status !== 'finished' && (
                            <span className="text-[10px] normal-case tracking-normal opacity-80">
                                Ultimo tick: {formatHealthTimestamp(latestBetfairAt)} · Ladder utile: {formatHealthTimestamp(latestUsableLadderAt)}
                            </span>
                        )}

                        {healthTransition === 'to-red' && (
                            <span className="px-1.5 py-0.5 rounded bg-red-500 text-white text-[9px]">
                                New Betfair alert detected
                            </span>
                        )}
                    </div>
                </div>
            )}

            {healthTransition === 'recovered' && (
                !healthInfo ||
                !['red', 'yellow'].includes(healthInfo.status)
            ) && (
                <div className="px-5 py-3 text-xs font-bold uppercase tracking-wider border-b border-[var(--card-border)] bg-emerald-500/10 text-emerald-400">
                    Betfair data recovered
                </div>
            )}

            <BetfairHealthDebugPanel health={healthInfo} />

            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-8 flex-1">
                {data.runners.map((runner, index) => {
                    const selectionId = runner?.selectionId == null
                        ? null
                        : String(runner.selectionId);
                    const runnerHistory = selectionId === null
                        ? []
                        : (series.find(item => item.selectionId === selectionId)?.points || []);

                    return (
                        <BetfairRunnerDepth
                            key={selectionId ?? `runner-${index}`}
                            runner={runner}
                            runnerHistory={runnerHistory}
                            sharedGrid={sharedGrid}
                            sharedMaxVal={sharedMaxVal}
                        />
                    );
                })}
            </div>
        </div>
    );
}
