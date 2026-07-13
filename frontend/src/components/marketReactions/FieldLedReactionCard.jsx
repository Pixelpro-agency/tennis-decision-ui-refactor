import React from 'react';

function formatTs(ts) {
    if (!ts) return '—';
    try {
        const d = new Date(ts);
        if (isNaN(d.getTime())) return '—';
        return d.toLocaleTimeString();
    } catch (_) {
        return '—';
    }
}

function formatAmount(val) {
    if (val === null || val === undefined || isNaN(Number(val))) return '—';
    const n = Number(val);
    if (Math.abs(n) >= 1000) {
        return (n / 1000).toFixed(2).replace(/\.?0+$/, '') + 'k';
    }
    return n.toFixed(2).replace(/\.?0+$/, '');
}

function formatNum(val, decimals = 2) {
    if (val === null || val === undefined || isNaN(Number(val))) return '—';
    return Number(val).toFixed(decimals);
}

function QualityBadge({ value }) {
    const map = {
        good: 'bg-emerald-900/40 text-emerald-300 border-emerald-800',
        medium: 'bg-yellow-900/40 text-yellow-300 border-yellow-800',
        poor: 'bg-red-900/40 text-red-300 border-red-800',
        unknown: 'bg-slate-800 text-slate-400 border-slate-700',
    };
    const cls = map[value] || map.unknown;
    return (
        <span className={`inline-block text-xs px-2 py-0.5 rounded border font-medium ${cls}`}>
            {value || 'unknown'}
        </span>
    );
}

function AvailabilityBadge({ available }) {
    return available
        ? <span className="inline-block text-xs px-2 py-0.5 rounded border bg-emerald-900/40 text-emerald-300 border-emerald-800 font-medium">available</span>
        : <span className="inline-block text-xs px-2 py-0.5 rounded border bg-slate-800 text-slate-400 border-slate-700 font-medium">unavailable</span>;
}

function ObservedBadge({ observed }) {
    return observed
        ? <span className="inline-block text-xs px-2 py-0.5 rounded border bg-blue-900/40 text-blue-300 border-blue-800 font-medium">observed</span>
        : <span className="inline-block text-xs px-2 py-0.5 rounded border bg-slate-800 text-slate-400 border-slate-700 font-medium">not observed</span>;
}

function safeValue(v) {
    if (v === null || v === undefined || v === '') return '—';
    if (typeof v === 'string') return v;
    if (typeof v === 'number') return String(v);
    if (typeof v === 'boolean') return String(v);
    if (Array.isArray(v)) {
        const primitives = v.filter(x => x !== null && x !== undefined && (typeof x === 'string' || typeof x === 'number' || typeof x === 'boolean'));
        return primitives.length > 0 ? primitives.join(', ') : '—';
    }
    if (typeof v === 'object' && 'home' in v && 'away' in v) return `${v.home} - ${v.away}`;
    return '—';
}

function Row({ label, value }) {
    return (
        <div className="flex items-start justify-between gap-4 py-1.5 border-b border-[var(--card-border)] last:border-0">
            <span className="text-xs text-[var(--muted)] shrink-0">{label}</span>
            <span className="text-xs text-white text-right break-all">{safeValue(value)}</span>
        </div>
    );
}

function RunnerPriceChange({ runner }) {
    const name = runner.name || (runner.selectionId ? `Selection ${runner.selectionId}` : '—');
    const directionLabel = runner.priceDirection
        ? runner.priceDirection
        : '—';
    return (
        <div className="bg-[var(--bg-0)] rounded-lg p-2 border border-[var(--card-border)]">
            <div className="text-xs font-semibold text-white mb-1">{name}</div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                <Row label="Baseline price" value={formatNum(runner.baselinePrice)} />
                <Row label="Latest price" value={formatNum(runner.latestPrice)} />
                <Row label="Price delta %" value={runner.priceDeltaPct !== null && runner.priceDeltaPct !== undefined ? formatNum(runner.priceDeltaPct) + '%' : '—'} />
                <Row label="Direction" value={directionLabel} />
            </div>
        </div>
    );
}

function ObservationWindowItem({ window: win }) {
    const reasons = win.reasons?.slice(0, 3) ?? [];
    const runners = win.runnerPriceChanges ?? [];

    return (
        <div className="bg-[var(--bg-1)] rounded-lg p-3 border border-[var(--card-border)]">
            <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-semibold text-white">{safeValue(win.windowSec)}s window</span>
                <ObservedBadge observed={win.marketResponseObserved} />
                <QualityBadge value={win.dataQuality} />
            </div>
            <div className="space-y-0.5">
                <Row label="Betfair ticks observed" value={safeValue(win.betfairTicksObserved)} />
                <Row
                    label="Matched volume delta"
                    value={win.marketMatchedDelta !== null && win.marketMatchedDelta !== undefined
                        ? formatAmount(win.marketMatchedDelta)
                        : '—'}
                />
                <Row label="Price change" value={win.priceChangeObserved !== undefined ? String(win.priceChangeObserved) : '—'} />
                <Row label="Volume increase" value={win.matchedVolumeIncreaseObserved !== undefined ? String(win.matchedVolumeIncreaseObserved) : '—'} />
            </div>
            {runners.length > 0 && (
                <div className="mt-2 space-y-1">
                    <span className="text-xs text-[var(--muted)] font-medium">Price changes</span>
                    {runners.map((r, i) => <RunnerPriceChange key={i} runner={r} />)}
                </div>
            )}
            {reasons.length > 0 && (
                <ul className="mt-2 space-y-0.5">
                    {reasons.map((r, i) => (
                        <li key={i} className="text-xs text-[var(--muted)] pl-3 relative before:content-['·'] before:absolute before:left-0">
                            {safeValue(r)}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export default function FieldLedReactionCard({ evidence }) {
    const src = evidence?.sourceFieldEvent;
    const summary = evidence?.summary;
    const windows = evidence?.observationWindows ?? [];

    return (
        <div className="bg-[var(--card)] rounded-2xl border border-[var(--card-border)] p-5 flex flex-col gap-4">
            <div>
                <div className="flex items-start justify-between gap-2">
                    <div>
                        <h3 className="text-base font-bold text-white">Field → Exchange</h3>
                        <p className="text-xs text-[var(--muted)] mt-0.5">Post-event market observation</p>
                    </div>
                    <AvailabilityBadge available={!!evidence} />
                </div>
                {evidence?.causalityClaimed === false && (
                    <p className="mt-2 text-xs text-amber-400 font-medium">Causality not established</p>
                )}
            </div>

            {!evidence ? (
                <p className="text-sm text-[var(--muted)]">No field reaction data available for this snapshot.</p>
            ) : (
                <>
                    <section>
                        <h4 className="text-xs font-semibold text-[var(--muted)] uppercase tracking-widest mb-2">Source Field Event</h4>
                        {!src ? (
                            <p className="text-sm text-[var(--muted)]">No relevant field event is available as a source event.</p>
                        ) : (
                            <div className="space-y-0.5">
                                {src.type && <Row label="Type" value={safeValue(src.type)} />}
                                {src.stateFirstSeenAt && <Row label="First seen at" value={formatTs(src.stateFirstSeenAt)} />}
                                {src.pointState && <Row label="Point state" value={safeValue(src.pointState)} />}
                                {src.gameScore && <Row label="Game score" value={safeValue(src.gameScore)} />}
                            </div>
                        )}
                    </section>

                    {summary && (
                        <section>
                            <h4 className="text-xs font-semibold text-[var(--muted)] uppercase tracking-widest mb-2">Summary</h4>
                            <div className="space-y-1">
                                {summary.dataQuality !== undefined && (
                                    <div className="flex items-center justify-between py-1">
                                        <span className="text-xs text-[var(--muted)]">Data quality</span>
                                        <QualityBadge value={summary.dataQuality} />
                                    </div>
                                )}
                                {summary.marketResponseObserved !== undefined && (
                                    <div className="flex items-center justify-between py-1">
                                        <span className="text-xs text-[var(--muted)]">Market response</span>
                                        <ObservedBadge observed={summary.marketResponseObserved} />
                                    </div>
                                )}
                                {summary.firstObservedResponseWindowSec !== undefined && (
                                    <Row
                                        label="First response window"
                                        value={summary.firstObservedResponseWindowSec !== null
                                            ? `${summary.firstObservedResponseWindowSec}s`
                                            : '—'}
                                    />
                                )}
                            </div>
                        </section>
                    )}

                    {windows.length > 0 && (
                        <section>
                            <h4 className="text-xs font-semibold text-[var(--muted)] uppercase tracking-widest mb-2">
                                Observation Windows ({windows.length})
                            </h4>
                            <div className="space-y-2">
                                {windows.map((win, i) => (
                                    <ObservationWindowItem key={i} window={win} />
                                ))}
                            </div>
                        </section>
                    )}
                </>
            )}
        </div>
    );
}
