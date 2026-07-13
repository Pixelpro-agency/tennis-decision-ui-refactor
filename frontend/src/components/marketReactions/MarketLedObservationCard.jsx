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

function Row({ label, value }) {
    return (
        <div className="flex items-start justify-between gap-4 py-1.5 border-b border-[var(--card-border)] last:border-0">
            <span className="text-xs text-[var(--muted)] shrink-0">{label}</span>
            <span className="text-xs text-white text-right break-all">{value}</span>
        </div>
    );
}

function ObservationWindowItem({ window: win }) {
    const reasons = win.reasons?.slice(0, 3) ?? [];
    return (
        <div className="bg-[var(--bg-1)] rounded-lg p-3 border border-[var(--card-border)]">
            <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-semibold text-white">{win.windowSec}s window</span>
                <ObservedBadge observed={win.fieldEventObservedAfterFlow} />
                <QualityBadge value={win.dataQuality} />
            </div>
            <div className="space-y-0.5">
                <Row label="Sofa ticks observed" value={win.sofaTicksObserved ?? '—'} />
                <Row label="Relevant markers" value={win.relevantMarkersObserved ?? '—'} />
            </div>
            {reasons.length > 0 && (
                <ul className="mt-2 space-y-0.5">
                    {reasons.map((r, i) => (
                        <li key={i} className="text-xs text-[var(--muted)] pl-3 relative before:content-['·'] before:absolute before:left-0">
                            {r}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export default function MarketLedObservationCard({ evidence }) {
    const src = evidence?.sourceMarketEvent;
    const summary = evidence?.summary;
    const windows = evidence?.observationWindows ?? [];

    return (
        <div className="bg-[var(--card)] rounded-2xl border border-[var(--card-border)] p-5 flex flex-col gap-4">
            <div>
                <div className="flex items-start justify-between gap-2">
                    <div>
                        <h3 className="text-base font-bold text-white">Exchange → Field</h3>
                        <p className="text-xs text-[var(--muted)] mt-0.5">Post-flow field observation</p>
                    </div>
                    <AvailabilityBadge available={!!evidence} />
                </div>
                {evidence?.causalityClaimed === false && (
                    <p className="mt-2 text-xs text-amber-400 font-medium">Causality not established</p>
                )}
            </div>

            {!evidence ? (
                <p className="text-sm text-[var(--muted)]">No exchange activity data available for this snapshot.</p>
            ) : (
                <>
                    <section>
                        <h4 className="text-xs font-semibold text-[var(--muted)] uppercase tracking-widest mb-2">Source Exchange Activity</h4>
                        {!src ? (
                            <p className="text-sm text-[var(--muted)]">No significant exchange activity is available as a source event.</p>
                        ) : (
                            <div className="space-y-0.5">
                                <Row label="Timestamp" value={formatTs(src.timestamp)} />
                                {src.runnerName && <Row label="Runner" value={src.runnerName} />}
                                {src.selectionId && <Row label="Selection ID" value={src.selectionId} />}
                                {(src.amount !== null && src.amount !== undefined) && (
                                    <Row label="Flow amount" value={formatAmount(src.amount)} />
                                )}
                                {src.tier && <Row label="Tier" value={src.tier} />}
                                {src.flowClassification && <Row label="Flow classification" value={src.flowClassification} />}
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
                                {summary.flowAmbiguous !== undefined && (
                                    <Row label="Flow ambiguous" value={String(summary.flowAmbiguous)} />
                                )}
                                {summary.sofaEventsObserved !== undefined && (
                                    <Row label="Sofa events observed" value={formatNum(summary.sofaEventsObserved, 0)} />
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
