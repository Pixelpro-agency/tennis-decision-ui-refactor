import React from 'react';
import { Volume2, TrendingUp, Zap } from 'lucide-react';

const StrategyTabBar = ({ tabs, activeTab, onTabChange, mode, onModeChange }) => {
    if (!tabs || tabs.length === 0) return null;

    const getIcon = (id) => {
        if (id === 'lay_the_winner') return <Volume2 className="w-4 h-4" />;
        if (id === 'banca_servizio') return <TrendingUp className="w-4 h-4" />;
        if (id === 'super_break') return <Zap className="w-4 h-4" />;
        return null;
    };

    const getSpeedBadge = (speed) => {
        const colors = {
            SLOW: 'bg-blue-900/30 text-blue-400 border-blue-800/50',
            MID: 'bg-orange-900/30 text-orange-400 border-orange-800/50',
            FAST: 'bg-red-900/30 text-red-400 border-red-800/50'
        };
        return (
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${colors[speed] || colors.SLOW}`}>
                🐌{speed}
            </span>
        );
    };

    return (
        <div className="bg-[#0f1823] border-b border-gray-800 px-6 py-3 flex items-center justify-between">
            {}
            <div className="flex items-center gap-6">
                {}
                <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-gray-500 uppercase">Mode:</span>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => onModeChange?.('decision')}
                            className={`text-sm font-semibold px-3 py-1 rounded transition ${mode === 'decision' ? 'bg-gray-800 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            Decision
                        </button>
                        <span className="text-gray-600">○</span>
                        <button
                            onClick={() => onModeChange?.('debug')}
                            className={`text-sm font-semibold px-3 py-1 rounded transition ${mode === 'debug' ? 'bg-gray-800 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            Debug
                        </button>
                    </div>
                </div>

                {}
                <div className="flex gap-2">
                    {tabs.map((tab) => {
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => onTabChange(tab.id)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition font-semibold text-sm ${isActive
                                        ? 'bg-gradient-to-r from-green-900/40 to-green-900/10 text-green-400 border border-green-800/50'
                                        : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/50'
                                    }`}
                            >
                                {getIcon(tab.id)}
                                <span>{tab.label}</span>
                                {getSpeedBadge(tab.speed)}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default StrategyTabBar;
