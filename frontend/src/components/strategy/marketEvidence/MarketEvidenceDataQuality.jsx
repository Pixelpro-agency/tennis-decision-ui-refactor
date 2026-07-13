import { AlertCircle, History } from 'lucide-react';
import { formatValue } from './formatters.js';

export function MarketEvidenceStaleNotices({ dataQuality }) {
    if (!dataQuality) return null;

    const hasNotice = dataQuality.usingStalePrice ||
        dataQuality.usingStaleLadder ||
        dataQuality.usingStaleMoneyFlow ||
        dataQuality.marketProbablyFinished;

    if (!hasNotice) return null;

    return (
        <div className="space-y-1">
            {dataQuality.usingStalePrice && (
                <div className="text-xs text-orange-400/90 flex items-center gap-1.5">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    Using last usable price tick
                    {dataQuality.staleSeconds > 0 && (
                        <span className="text-gray-500 font-mono">({formatValue(dataQuality.staleSeconds)}s stale)</span>
                    )}
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
    );
}

export function MarketEvidenceWarnings({ dataQuality }) {
    if (!dataQuality?.warnings?.length) return null;

    return (
        <div className="border-t border-gray-800 pt-3">
            <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Data Quality</h4>
            <ul className="space-y-1">
                {dataQuality.warnings.map((warning, idx) => (
                    <li key={idx} className="text-xs text-orange-400/90 flex items-start gap-1.5">
                        <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" />
                        {warning}
                    </li>
                ))}
            </ul>
        </div>
    );
}
