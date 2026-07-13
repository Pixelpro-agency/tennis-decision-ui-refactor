import { RefreshCw } from 'lucide-react';
import MarketLedObservationCard from './marketReactions/MarketLedObservationCard';
import FieldLedReactionCard from './marketReactions/FieldLedReactionCard';

function formatLastUpdate(date) {
    if (!date) return null;
    try {
        return date.toLocaleTimeString();
    } catch (_) {
        return null;
    }
}


export default function MarketReactionsPage({
    eventId,
    evidence,
    loading,
    error,
    reasons,
    lastUpdate,
    isPolling,
    refresh
}) {    if (!eventId) {
        return (
            <div className="max-w-[1400px] w-full px-6 mt-6 mx-auto">
                <div className="bg-[var(--card)] rounded-2xl border border-[var(--card-border)] p-8 text-center">
                    <p className="text-sm text-[var(--muted)]">No match loaded. Start a session to view market reaction observations.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-[1400px] w-full px-6 mt-6 mx-auto">
            <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-xl font-bold text-white">Market Reactions</h2>
                    <p className="text-sm text-[var(--muted)] mt-0.5">Exchange → Field and Field → Exchange observations</p>
                    <p className="text-xs text-[var(--muted)] mt-1 opacity-70">Temporal proximity only. Causality not established.</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                    {lastUpdate && (
                        <span className="text-xs text-[var(--muted)]">
                            Updated {formatLastUpdate(lastUpdate)}
                        </span>
                    )}
                    {isPolling && !lastUpdate && loading && (
                        <span className="text-xs text-[var(--muted)]">Loading…</span>
                    )}
                    <button
                        onClick={refresh}
                        disabled={loading}
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-[var(--card)] border border-[var(--card-border)] text-[var(--muted)] hover:text-white transition-colors disabled:opacity-50"
                    >
                        <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                </div>
            </div>

            {loading && !evidence && !error && (
                <div className="bg-[var(--card)] rounded-2xl border border-[var(--card-border)] p-8 text-center mb-6">
                    <p className="text-sm text-[var(--muted)]">Loading evidence data…</p>
                </div>
            )}

            {error && (
                <div className="bg-[var(--card)] rounded-2xl border border-red-900/50 p-5 mb-6">
                    <p className="text-sm text-red-400">{error}</p>
                </div>
            )}

            {!error && !evidence && !loading && (
                <div className="bg-[var(--card)] rounded-2xl border border-[var(--card-border)] p-5 mb-6">
                    <p className="text-sm text-[var(--muted)]">No snapshot available for this match.</p>
                    {reasons && (
                        Array.isArray(reasons)
                            ? (
                                <ul className="mt-2 space-y-0.5">
                                    {reasons.slice(0, 3).map((reason, index) => (
                                        <li key={index} className="text-xs text-[var(--muted)] pl-3 relative before:content-['·'] before:absolute before:left-0">{reason}</li>
                                    ))}
                                </ul>
                            )
                            : <p className="mt-1 text-xs text-[var(--muted)]">{String(reasons)}</p>
                    )}
                </div>
            )}

            {evidence && (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    <MarketLedObservationCard evidence={evidence.marketLedObservation ?? null} />
                    <FieldLedReactionCard evidence={evidence.fieldLedReaction ?? null} />
                </div>
            )}

        </div>
    );
}