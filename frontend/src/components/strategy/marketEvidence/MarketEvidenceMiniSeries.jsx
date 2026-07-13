import { formatValue } from './formatters.js';

export default function MarketEvidenceMiniSeries({ miniSeries }) {
    if (!miniSeries?.length) return null;

    return (
        <div className="border-t border-gray-800 pt-3">
            <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                Last {miniSeries.length} Ticks
            </h4>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {[...miniSeries].reverse().map((tick, idx) => (
                    <div key={idx} className="text-xs font-mono text-gray-400 bg-gray-900/30 rounded p-2">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-gray-500">seq {tick.seq}</span>
                            <span>{formatValue(tick.totalMatched)} matched</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {tick.runners.map((runner, runnerIdx) => (
                                <span key={runnerIdx} className={runner.hasUsablePrice ? 'text-gray-300' : 'text-gray-600'}>
                                    {runner.name}: {formatValue(runner.lastTradedPrice)}
                                    {!runner.hasUsablePrice && (
                                        <span className="text-[9px] text-gray-600 ml-0.5">(no price)</span>
                                    )}
                                </span>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
