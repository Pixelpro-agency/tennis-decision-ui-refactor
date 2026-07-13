import React from 'react';

const StrategyHeader = ({ data, mode, onModeChange }) => {
    if (!data) return null;
    const { competition, status, matchTitle, set, gameScore, serving } = data;

    return (
        <div className="bg-[#1a2332] border-b border-gray-800 sticky top-0 z-50">
            {}
            <div className="flex items-center justify-between px-6 py-3 text-sm border-b border-gray-800/50">
                <div className="flex items-center gap-2 text-gray-400">
                    <span className="font-semibold">{competition}</span>
                    <span>•</span>
                    {status === 'LIVE' && (
                        <>
                            <span className="bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded uppercase">LIVE</span>
                            <span>•</span>
                        </>
                    )}
                    <span className="text-white font-bold">{matchTitle}</span>
                    <span>•</span>
                    <span>Set {set}</span>
                    <span>•</span>
                    <span>Game {gameScore}</span>
                    <span>•</span>
                    <span className="text-blue-400">{serving} serving</span>
                </div>
            </div>

            {}
            <div className="px-6 py-2.5 flex items-center gap-6">
                <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-gray-500 uppercase">Mode:</span>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => onModeChange('decision')}
                            className={`text-sm font-semibold px-3 py-1 rounded transition ${mode === 'decision' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            Decision
                        </button>
                        <div className={`w-10 h-5 rounded-full relative cursor-pointer transition ${mode === 'debug' ? 'bg-gray-700' : 'bg-gray-800'}`}
                            onClick={() => onModeChange(mode === 'decision' ? 'debug' : 'decision')}
                        >
                            <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-gray-600 rounded-full transition-transform ${mode === 'debug' ? 'translate-x-5' : ''}`}></div>
                        </div>
                        <button
                            onClick={() => onModeChange('debug')}
                            className={`text-sm font-semibold px-3 py-1 rounded transition ${mode === 'debug' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            Debug
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StrategyHeader;
