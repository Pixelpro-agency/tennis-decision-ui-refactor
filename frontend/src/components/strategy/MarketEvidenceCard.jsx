import React from 'react';
import { Activity, TrendingDown, TrendingUp, Minus, AlertCircle, History } from 'lucide-react';

const fmt = (n) => {
    if (n === null || n === undefined || Number.isNaN(n)) return '—';
    if (typeof n === 'number') {
        const abs = Math.abs(n);
        if (abs >= 1000) return `${(n / 1000).toFixed(1)}k`;
        if (abs % 1 === 0) return n.toString();
        return n.toFixed(2);
    }
    return String(n);
};

const fmtPct = (n) => {
    if (n === null || n === undefined || Number.isNaN(n)) return '—';
    return `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`;
};

const Badge = ({ children, type }) => {
    const styles = {
        back: 'bg-blue-900/30 text-blue-400 border-blue-800/40',
        lay: 'bg-red-900/30 text-red-400 border-red-800/40',
        neutral: 'bg-gray-800 text-gray-400 border-gray-700',
        warning: 'bg-orange-900/30 text-orange-400 border-orange-800/40',
        success: 'bg-green-900/30 text-green-400 border-green-800/40',
        historical: 'bg-purple-900/30 text-purple-400 border-purple-800/40'
    };
    return (
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${styles[type] || styles.neutral}`}>
            {children}
        </span>
    );
};

const Row = ({ label, value, muted = false, hint = null }) => (
    <div className="flex items-center justify-between text-sm py-0.5">
        <span className="text-gray-500">{label}</span>
        <div className="flex items-center gap-2">
            {hint && <span className="text-[10px] text-orange-400/80 font-mono">{hint}</span>}
            <span className={`font-mono font-medium ${muted ? 'text-gray-600' : 'text-white'}`}>{value}</span>
        </div>
    </div>
);

const MarketEvidenceCard = ({ evidence }) => {
    if (!evidence) return null;

    const { available, reason, market, targetRunner, runners, miniSeries, dataQuality, confidence } = evidence;

    const isUnavailable = !available;
    const isHistorical = !isUnavailable && dataQuality?.marketProbablyFinished;

    const headerBadge = () => {
        if (isUnavailable) return <Badge type="warning">UNAVAILABLE</Badge>;
        if (isHistorical) return <Badge type="historical"><History className="w-3 h-3 inline -mt-0.5 mr-0.5" />HISTORICAL</Badge>;
        return <Badge type="success">LIVE</Badge>;
    };

    return (
        <div className="bg-[#1a2332] rounded-xl border border-gray-800 p-5">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    Market Evidence
                </h3>
                {headerBadge()}
            </div>

            {isUnavailable ? (
                <div className="flex items-start gap-2 text-sm text-gray-400">
                    <AlertCircle className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                    <div>
                        <p>Betfair market evidence is not available.</p>
                        {reason && <p className="text-orange-400/80 text-xs mt-1 font-mono">{reason}</p>}
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    {}
                    {confidence && (
                        <div className="bg-gray-900/50 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Confidence</span>
                                <Badge type={confidence.level === 'high' ? 'success' : confidence.level === 'medium' ? 'warning' : 'neutral'}>
                                    {confidence.level?.toUpperCase()}
                                </Badge>
                            </div>
                            <div className="text-2xl font-bold text-white mb-1">{confidence.score}<span className="text-sm text-gray-500">/100</span></div>
                            {confidence.reasons && confidence.reasons.length > 0 && (
                                <ul className="space-y-0.5">
                                    {confidence.reasons.map((r, idx) => (
                                        <li key={idx} className="text-[10px] text-gray-500 flex items-start gap-1">
                                            <span className="text-orange-400">•</span>
                                            {r}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}

                    {}
                    {(dataQuality?.usingStalePrice || dataQuality?.usingStaleLadder || dataQuality?.usingStaleMoneyFlow || dataQuality?.marketProbablyFinished) && (
                        <div className="space-y-1">
                            {dataQuality.usingStalePrice && (
                                <div className="text-xs text-orange-400/90 flex items-center gap-1.5">
                                    <AlertCircle className="w-3 h-3 shrink-0" />
                                    Using last usable price tick
                                    {dataQuality.staleSeconds > 0 && <span className="text-gray-500 font-mono">({fmt(dataQuality.staleSeconds)}s stale)</span>}
                                </div>
                            )}
                            {dataQuality.usingStaleLadder && (
                                <div className="text-xs text-orange-400/90 flex items-center gap-1.5">
                                    <AlertCircle className="w-3 h-3 shrink-0" />
                                    Using last usable ladder tick
                                </div>
                            )}
                            {dataQuality.usingStaleMoneyFlow && (
                                <div className="text-xs text-orange-400/90 flex items-center gap-1.5">
                                    <AlertCircle className="w-3 h-3 shrink-0" />
                                    Using last usable money flow tick
                                </div>
                            )}
                            {dataQuality.marketProbablyFinished && (
                                <div className="text-xs text-purple-400/90 flex items-center gap-1.5">
                                    <History className="w-3 h-3 shrink-0" />
                                    Market probably finished — showing recent historical data
                                </div>
                            )}
                        </div>
                    )}

                    {}
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-white font-bold text-sm">{targetRunner.name}</span>
                            <Badge type={targetRunner.role === 'FIRST_SET_WINNER' ? 'success' : 'neutral'}>
                                {targetRunner.role}
                            </Badge>
                        </div>
                        <Row
                            label="LTP"
                            value={fmt(targetRunner.lastTradedPrice)}
                            hint={dataQuality?.usingStalePrice ? 'last usable' : null}
                        />
                        <Row
                            label="Best Back"
                            value={`${fmt(targetRunner.bestBack)} (${fmt(targetRunner.bestBackSize)})`}
                            hint={dataQuality?.usingStalePrice ? 'last usable' : null}
                        />
                        <Row
                            label="Best Lay"
                            value={`${fmt(targetRunner.bestLay)} (${fmt(targetRunner.bestLaySize)})`}
                            hint={dataQuality?.usingStalePrice ? 'last usable' : null}
                        />
                        <Row label="WOM" value={fmt(targetRunner.wom)} />
                        <Row
                            label="Money Flow"
                            value={targetRunner.moneyFlow?.trend || '—'}
                        />
                    </div>

                    {}
                    <div className="border-t border-gray-800 pt-3 space-y-1">
                        <Row label="Price Δ" value={fmtPct(targetRunner.priceDeltaPct)} />
                        <Row label="Matched Δ" value={fmt(targetRunner.matchedDelta)} />
                        <Row label="Market Total Matched" value={fmt(market?.totalMatched)} />
                        <Row label="Total Matched Δ" value={fmt(market?.totalMatchedDelta)} />
                        <Row
                            label="Volume Accel."
                            value={targetRunner.volumeAcceleration?.label || '—'}
                        />
                        <Row
                            label="Liquidity"
                            value={targetRunner.liquidity?.label || '—'}
                            hint={dataQuality?.usingStaleLadder ? 'last usable ladder' : null}
                        />
                        <Row
                            label="Imbalance"
                            value={targetRunner.liquidity?.imbalance !== null && targetRunner.liquidity?.imbalance !== undefined
                                ? `${(targetRunner.liquidity.imbalance * 100).toFixed(1)}%`
                                : '—'}
                        />
                        <Row
                            label="Pressure"
                            value={targetRunner.pressure?.label || '—'}
                        />
                        <Row
                            label="Pressure Score"
                            value={targetRunner.pressure?.score !== null && targetRunner.pressure?.score !== undefined
                                ? targetRunner.pressure.score
                                : '—'}
                        />
                    </div>

                    {}
                    {runners && runners.length > 0 && (
                        <div className="border-t border-gray-800 pt-3">
                            <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Runners</h4>
                            <div className="space-y-2">
                                {runners.map((r, idx) => (
                                    <div key={idx} className="flex items-center justify-between text-xs bg-gray-900/50 rounded p-2">
                                        <span className="text-white font-medium truncate max-w-[40%]">{r.name}</span>
                                        <div className="flex items-center gap-3 text-gray-400 font-mono">
                                            <span>LTP {fmt(r.lastTradedPrice)}</span>
                                            <span className="flex items-center gap-0.5">
                                                {r.priceDelta > 0 ? <TrendingUp className="w-3 h-3 text-red-400" /> :
                                                    r.priceDelta < 0 ? <TrendingDown className="w-3 h-3 text-blue-400" /> :
                                                        <Minus className="w-3 h-3" />}
                                                {fmt(r.priceDelta)}
                                            </span>
                                            <span>{r.moneyFlowTrend || '—'}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {}
                    {miniSeries && miniSeries.length > 0 && (
                        <div className="border-t border-gray-800 pt-3">
                            <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                                Last {miniSeries.length} Ticks
                            </h4>
                            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                                {[...miniSeries].reverse().map((tick, idx) => (
                                    <div key={idx} className="text-xs font-mono text-gray-400 bg-gray-900/30 rounded p-2">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-gray-500">seq {tick.seq}</span>
                                            <span>{fmt(tick.totalMatched)} matched</span>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {tick.runners.map((r, rIdx) => (
                                                <span key={rIdx} className={`${r.hasUsablePrice ? 'text-gray-300' : 'text-gray-600'}`}>
                                                    {r.name}: {fmt(r.lastTradedPrice)}
                                                    {!r.hasUsablePrice && <span className="text-[9px] text-gray-600 ml-0.5">(no price)</span>}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {}
                    {dataQuality && dataQuality.warnings && dataQuality.warnings.length > 0 && (
                        <div className="border-t border-gray-800 pt-3">
                            <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Data Quality</h4>
                            <ul className="space-y-1">
                                {dataQuality.warnings.map((w, idx) => (
                                    <li key={idx} className="text-xs text-orange-400/90 flex items-start gap-1.5">
                                        <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" />
                                        {w}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default MarketEvidenceCard;
