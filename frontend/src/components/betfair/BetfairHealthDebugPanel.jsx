import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

function formatDebugValue(value) {
    if (value === null || value === undefined) {
        return '—';
    }

    if (typeof value === 'boolean') {
        return value ? 'true' : 'false';
    }

    if (typeof value === 'number') {
        return Number.isFinite(value) ? value.toString() : '—';
    }

    return String(value);
}

export default function BetfairHealthDebugPanel({ health }) {
    const [open, setOpen] = useState(false);

    if (!health) {
        return null;
    }

    const metrics = health.metrics || {};
    const checks = health.checks || {};
    const timestamps = health.timestamps || {};

    const rows = [
        ['status', health.status],
        ['message', health.message],
        ['reasons', (health.reasons || []).join('; ') || '—'],
        ['lastScrapeAttemptAt', timestamps.lastScrapeAttemptAt],
        ['lastSuccessfulScrapeAt', timestamps.lastSuccessfulScrapeAt],
        ['lastCanonicalTickAt', timestamps.lastCanonicalTickAt],
        ['lastUsableLadderAt', timestamps.lastUsableLadderAt],
        ['lastValidVolumeAt', timestamps.lastValidVolumeAt],
        ['lastTechnicalErrorAt', timestamps.lastTechnicalErrorAt],
        ['graphLoginRequiredAt', timestamps.graphLoginRequiredAt],
        ['computedAt', timestamps.computedAt],
        ['latestBetfairAgeSec', metrics.latestBetfairAgeSec],
        ['latestUsableLadderAgeSec', metrics.latestUsableLadderAgeSec],
        ['technicalErrorActive', metrics.technicalErrorActive],
        ['lastTechnicalErrorReason', metrics.lastTechnicalErrorReason],
        ['consecutiveNoLadderTicks', metrics.consecutiveNoLadderTicks],
        ['validTickCount', metrics.validTickCount],
        ['lastSeq', metrics.lastSeq],
        ['graphLoginRequired', metrics.graphLoginRequired],
        ['graphLoginRequiredRecent', metrics.graphLoginRequiredRecent],
        ['graphLoginRequiredText', metrics.graphLoginRequiredText],
        ['graphLoginRequiredUrl', metrics.graphLoginRequiredUrl],
        ['betfairUrlOk', checks.betfairUrlOk],
        ['cdpOk', checks.cdpOk],
        ['graphUrlsOk', checks.graphUrlsOk],
        ['ladderOk', checks.ladderOk],
        ['marketOk', checks.marketOk],
        ['loginOk', checks.loginOk],
        ['sofaLive', checks.sofaLive]
    ];

    return (
        <div className="border-t border-[var(--card-border)] bg-black/20">
            <button
                onClick={() => setOpen((currentOpen) => !currentOpen)}
                className="w-full px-5 py-2 flex items-center justify-between text-[10px] uppercase font-bold tracking-wider text-slate-400 hover:text-white transition-colors"
            >
                <span>Betfair health details</span>
                {open
                    ? <ChevronDown className="w-3.5 h-3.5" />
                    : <ChevronRight className="w-3.5 h-3.5" />}
            </button>

            {open && (
                <div className="px-5 pb-4 grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2 text-[10px]">
                    {rows.map(([label, value]) => {
                        const formattedValue = formatDebugValue(value);

                        return (
                            <div key={label} className="flex flex-col">
                                <span className="text-slate-500 uppercase tracking-tighter font-bold">
                                    {label}
                                </span>
                                <span
                                    className="font-mono text-slate-300 truncate"
                                    title={formattedValue}
                                >
                                    {formattedValue}
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
