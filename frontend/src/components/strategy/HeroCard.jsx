import React from 'react';
import { Play, Zap } from 'lucide-react';

const HeroCard = ({ decision }) => {
    if (!decision) return null;
    const { signal, edgePct, action, marketRuleText, validForSec, thresholds, borderlineNote } = decision;

    let bgClass = "bg-gradient-to-br from-gray-900 to-gray-900/80";
    let textClass = "text-gray-400";
    let borderClass = "border-gray-700";

    if (signal === 'ENTER') {
        bgClass = "bg-gradient-to-br from-green-900/50 to-green-950/80";
        textClass = "text-green-400";
        borderClass = "border-green-800/40";
    } else if (signal === 'SKIP') {
        bgClass = "bg-gradient-to-br from-red-900/50 to-red-950/80";
        textClass = "text-red-400";
        borderClass = "border-red-800/40";
    } else if (signal === 'MONITOR') {
        bgClass = "bg-gradient-to-br from-blue-900/40 to-blue-950/70";
        textClass = "text-blue-400";
        borderClass = "border-blue-800/30";
    }

    const isDataMissing = edgePct === null;

    return (
        <div className={`rounded-xl border ${borderClass} ${bgClass} p-8 relative overflow-hidden`}>
            {}
            <div className="flex justify-between items-start mb-6">
                <div className={`text-6xl font-black tracking-tight ${isDataMissing ? 'text-gray-700' : textClass}`}>
                    {signal}
                </div>
                {!isDataMissing && edgePct !== null && (
                    <div className={`text-4xl font-bold ${edgePct > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {edgePct > 0 ? '+' : ''}{edgePct}%
                    </div>
                )}
                {isDataMissing && (
                    <div className="text-4xl font-bold text-gray-700">—</div>
                )}
            </div>

            {}
            <div className="text-center mb-4">
                <div className={`text-3xl font-bold mb-2 ${isDataMissing ? 'text-gray-700' : 'text-white'}`}>
                    {marketRuleText || (action ? `${action} @ —` : 'Waiting for data...')}
                </div>
            </div>

            {}
            <div className="flex items-center justify-center gap-4 text-sm">
                {validForSec !== null && (
                    <div className="flex items-center gap-1.5 bg-orange-900/20 border border-orange-800/30 text-orange-400 px-3 py-1.5 rounded-full font-mono font-bold">
                        <Play className="w-3.5 h-3.5" />
                        Valid for: ▶ {validForSec}s
                    </div>
                )}

                {thresholds?.greenMinLayOdds && (
                    <div className="flex items-center gap-1.5 bg-green-900/20 border border-green-800/30 text-green-400 px-3 py-1.5 rounded-full font-mono font-bold">
                        <Zap className="w-3.5 h-3.5" />
                        ≥ {thresholds.greenMinLayOdds}
                    </div>
                )}

                {borderlineNote && (
                    <div className="bg-yellow-900/20 border border-yellow-800/30 text-yellow-400 px-3 py-1.5 rounded-full text-xs font-bold">
                        {borderlineNote}
                    </div>
                )}
            </div>
        </div>
    );
};

export default HeroCard;
