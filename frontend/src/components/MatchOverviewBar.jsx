import React from 'react';

const MatchOverviewBar = ({ data }) => {
    if (!data) return null;
    const { label, pill, playersInline, scoreInline } = data;

    return (
        <div className="w-full px-6 py-4 flex items-center justify-between border-b border-[var(--card-border)] bg-[rgba(15,26,46,0.4)]">

            {}
            <div className="flex items-center gap-4">
                {}
                <span className="text-[11px] font-bold tracking-widest text-[var(--muted)] uppercase opacity-60">
                    {label}
                </span>

                {}
                <div className="flex items-center gap-3 text-[16px]">
                    {}
                    <span className={`font-semibold flex items-center gap-1 ${playersInline.isHomeServing ? 'text-yellow-400' : 'text-white'}`}>
                        {playersInline.homeName}
                        {playersInline.isHomeServing && <span className="text-[10px] text-yellow-400">●</span>}
                    </span>

                    <span className="text-[var(--muted)] text-sm">{playersInline.separator}</span>

                    {}
                    <span className={`font-semibold flex items-center gap-1 ${playersInline.isAwayServing ? 'text-yellow-400' : 'text-white'}`}>
                        {playersInline.awayName}
                        {playersInline.isAwayServing && <span className="text-[10px] text-yellow-400">●</span>}
                    </span>
                </div>
            </div>

            {}
            <div className="flex items-center gap-6 text-lg font-mono">
                {}
                <div className="flex flex-col items-center leading-none px-4 border-r border-white/10 mr-2">
                    <span className="text-[var(--accent-blue)] font-bold text-xl mb-1">{scoreInline.home.totalSets}</span>
                    <span className="text-[var(--accent-blue)] font-bold text-xl">{scoreInline.away.totalSets}</span>
                </div>

                {}
                {}
                <div className="flex flex-col items-center leading-none">
                    <span className="text-[var(--text)] opacity-50 text-sm">{scoreInline.home.set1}</span>
                    <span className="text-[var(--text)] opacity-50 text-sm">{scoreInline.away.set1}</span>
                </div>
                {}
                <div className="flex flex-col items-center leading-none">
                    <span className="text-white font-bold">{scoreInline.home.set2}</span>
                    <span className="text-white font-bold">{scoreInline.away.set2}</span>
                </div>
                {}
                <div className="flex flex-col items-center leading-none">
                    <span className="text-[var(--muted)] text-sm">{scoreInline.home.set3}</span>
                    <span className="text-[var(--muted)] text-sm">{scoreInline.away.set3}</span>
                </div>

                {}
                <div className="flex flex-col items-center leading-none ml-4 border-l border-white/10 pl-4">
                    <span className="text-[var(--text)] text-sm opacity-80 mb-1">{scoreInline.home.games}</span>
                    <span className="text-[var(--text)] text-sm opacity-80">{scoreInline.away.games}</span>
                </div>

                {}
                <div className="flex flex-col items-center leading-none w-8">
                    <span className="text-[var(--accent-blue)] font-bold text-lg mb-1">{scoreInline.home.point}</span>
                    <span className="text-[var(--accent-blue)] font-bold text-lg">{scoreInline.away.point}</span>
                </div>
            </div>

            {}
            <div className="px-3 py-1 bg-[var(--card)] border border-[var(--card-border)] rounded-full text-xs text-[var(--accent-green)] font-medium">
                {pill.text}
            </div>
        </div>
    );
};

export default MatchOverviewBar;
