import { Minus, TrendingDown, TrendingUp } from 'lucide-react';
import { formatValue } from './formatters.js';

function PriceDeltaIcon({ value }) {
    if (value > 0) return <TrendingUp className="w-3 h-3 text-red-400" />;
    if (value < 0) return <TrendingDown className="w-3 h-3 text-blue-400" />;
    return <Minus className="w-3 h-3" />;
}

export default function MarketEvidenceRunners({ runners }) {
    if (!runners?.length) return null;

    return (
        <div className="border-t border-gray-800 pt-3">
            <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Runners</h4>
            <div className="space-y-2">
                {runners.map((runner, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs bg-gray-900/50 rounded p-2">
                        <span className="text-white font-medium truncate max-w-[40%]">{runner.name}</span>
                        <div className="flex items-center gap-3 text-gray-400 font-mono">
                            <span>LTP {formatValue(runner.lastTradedPrice)}</span>
                            <span className="flex items-center gap-0.5">
                                <PriceDeltaIcon value={runner.priceDelta} />
                                {formatValue(runner.priceDelta)}
                            </span>
                            <span>{runner.moneyFlowTrend || '—'}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
