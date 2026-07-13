import React from 'react';
import { Target, AlertTriangle } from 'lucide-react';

export const SuccessProbabilityCard = ({ data }) => {
    if (!data) return null;
    const { pct, label, available } = data;
    const isMissing = pct === null || available === false;

    return (
        <div className="bg-[#1a2332] rounded-xl border border-gray-800 p-6">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">{label}</h3>

            <div className="flex items-center justify-center">
                {isMissing ? (
                    <div className="text-5xl font-bold text-gray-700">—</div>
                ) : (
                    <div className="text-6xl font-bold text-white">{pct}%</div>
                )}
            </div>
        </div>
    );
};

export const StrategyChecklistCard = ({ items }) => {
    if (!items || items.length === 0) return null;

    const isItemUnavailable = (item) => {
        if (item?.available === false) return true;
        return false;
    };

    return (
        <div className="bg-[#1a2332] rounded-xl border border-gray-800 p-5">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Strategy Checklist:</h3>
            <div className="space-y-3">
                {items.map((item, idx) => {
                    const unavailable = isItemUnavailable(item);
                    const showBadge = item.badge || (unavailable ? 'UNAVAILABLE' : null);

                    return (
                        <div key={idx} className={`flex items-start gap-3 ${unavailable ? 'opacity-45 grayscale cursor-not-allowed' : ''}`}>
                            <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 ${item.ok
                                    ? 'bg-green-500/20 border-green-500/50'
                                    : 'bg-gray-800 border-gray-600'
                                }`}>
                                {item.ok && <span className="text-green-400 text-[10px] font-bold">✓</span>}
                            </div>
                            <div className="flex-1">
                                <span className={`text-sm ${item.ok ? 'text-white' : unavailable ? 'text-gray-500' : 'text-gray-400'}`}>
                                    {item.label}
                                </span>
                                {showBadge && (
                                    <span className={`ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded border ${item.badge === 'WARNING'
                                            ? 'bg-orange-900/30 text-orange-400 border-orange-800/50'
                                            : unavailable
                                                ? 'bg-gray-800 text-gray-500 border-gray-700'
                                                : 'bg-gray-800 text-gray-500 border-gray-700'
                                        }`}>
                                        {item.badge === 'WARNING' ? '⚠ ' : ''}{showBadge}
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export const ExitPlanCard = ({ exitPlan }) => {
    if (!exitPlan) return null;

    return (
        <div className="bg-[#1a2332] rounded-xl border border-gray-800 p-5">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Exit Plan:</h3>
            <div className="space-y-3">
                {exitPlan.takeProfit && (
                    <div className="flex items-start gap-2 text-sm">
                        <span className="text-green-400 shrink-0">🎯</span>
                        <div>
                            <span className="font-bold text-green-400">TAKE PROFIT</span>
                            <span className="text-gray-300 ml-1">{exitPlan.takeProfit}</span>
                        </div>
                    </div>
                )}
                {exitPlan.abort && (
                    <div className="flex items-start gap-2 text-sm">
                        <span className="text-red-400 shrink-0">🚫</span>
                        <div>
                            <span className="font-bold text-red-400">ABORT/STOP/EXIT if:</span>
                            <span className="text-gray-300 ml-1">{exitPlan.abort}</span>
                            {exitPlan.abortDetail && (
                                <span className="text-gray-500 text-xs ml-1">({exitPlan.abortDetail})</span>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
