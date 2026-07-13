import { Activity } from 'lucide-react';
import { toNumber } from '../../utils/betfairMoneyFlow.js';
import MoneyFlowChart from './MoneyFlowChart.jsx';

function formatPrice(value) {
    const numberValue = Number(value);
    
    return Number.isFinite(numberValue)
    ? numberValue.toFixed(2)
    : '—';
}

function formatAmount(value) {
    const numberValue = toNumber(value);
    
    return numberValue > 0
    ? numberValue.toFixed(0)
    : '';
}

export default function BetfairRunnerDepth({
    runner,
    runnerHistory = [],
    sharedGrid = [],
    sharedMaxVal = 100
}) {
    if (!runner) {
        return null;
    }
    
    const ladder = Array.isArray(runner.ladder)
    ? runner.ladder
    : [];
    
    const bookBackPrices = (runner.bookBack || []).map((row) =>
        toNumber(row.price)
);

const bookLayPrices = (runner.bookLay || []).map((row) =>
    toNumber(row.price)
);

const maxTradedInLadder = Math.max(
    1,
    ...ladder.map((row) => toNumber(row.traded))
);

const getBackHighlight = (price) => {
    const index = bookBackPrices.indexOf(toNumber(price));
    return index === -1 ? null : index;
};

const getLayHighlight = (price) => {
    const index = bookLayPrices.indexOf(toNumber(price));
    return index === -1 ? null : index;
};

const totalMatched = toNumber(
    runner.totalMatchedOnSelection ?? runner.matchedTotal
);

return (
    <div className="flex flex-col min-h-[650px]">
    <div className="flex justify-between items-end mb-5">
    <span className="font-bold text-white text-xl truncate pr-2">
    {runner.name}
    </span>
    </div>

    <div className="bg-black/40 rounded-xl border border-white/10 overflow-hidden shadow-2xl h-[380px] flex flex-col">
    
    <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
    <div className="rounded-lg border border-sky-500/20 bg-sky-500/5 p-3">
    <span className="block text-[9px] uppercase tracking-wide text-slate-500">
    Best Back
    </span>
    
    <strong className="font-mono text-sky-300">
    {formatPrice(runner.bestBack)}
    </strong>
    
    <span className="mt-1 block text-[10px] text-slate-400">
    {toNumber(runner.bestBackSize).toLocaleString('it-IT', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    })} €
    </span>
    </div>
    
    <div className="rounded-lg border border-rose-500/20 bg-rose-500/5 p-3">
    <span className="block text-[9px] uppercase tracking-wide text-slate-500">
    Best Lay
    </span>
    
    <strong className="font-mono text-rose-300">
    {formatPrice(runner.bestLay)}
    </strong>
    
    <span className="mt-1 block text-[10px] text-slate-400">
    {toNumber(runner.bestLaySize).toLocaleString('it-IT', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    })} €
    </span>
    </div>
    </div>
    
    <table className="w-full table-fixed text-[11px] font-mono">
    <thead className="bg-white/5 text-slate-500 uppercase text-[9px] font-black tracking-tight">
    <tr>
    <th className="w-[18%] py-2 px-3 text-left border-b border-white/5">
    Price
    </th>
    
    <th className="w-[50%] py-2 px-3 text-center border-b border-white/5">
    Unmatched (Back/Lay)
    </th>
    
    <th className="w-[32%] py-2 px-3 text-right border-b border-white/5">
    Matched (Total)
    </th>
    </tr>
    </thead>
    </table>
    
    <div
    className="overflow-y-auto flex-1"
    style={{
        scrollbarWidth: 'thin',
        scrollbarColor: 'rgba(255,255,255,0.1) transparent'
    }}
    >
    <table className="w-full table-fixed text-[11px] font-mono">
    <colgroup>
    <col className="w-[18%]" />
    <col className="w-[50%]" />
    <col className="w-[32%]" />
    </colgroup>
    
    <tbody>
    {ladder.map((row, index) => {
        const backValue = toNumber(row.back);
        const layValue = toNumber(row.lay);
        const totalRowMatched = toNumber(row.traded);
        
        const tradedPercent = Math.min(
            100,
            (totalRowMatched / maxTradedInLadder) * 100
        );
        
        const backRank = getBackHighlight(row.price);
        const layRank = getLayHighlight(row.price);
        
        const rowBackground = backRank === 0
        ? 'bg-blue-900/40'
        : backRank === 1
        ? 'bg-blue-900/20'
        : backRank === 2
        ? 'bg-blue-900/10'
        : layRank === 0
        ? 'bg-red-900/40'
        : layRank === 1
        ? 'bg-red-900/20'
        : layRank === 2
        ? 'bg-red-900/10'
        : '';
        
        const priceColor = backRank === 0
        ? 'text-blue-300 font-black'
        : backRank !== null
        ? 'text-blue-400/70 font-bold'
        : layRank === 0
        ? 'text-red-300 font-black'
        : layRank !== null
        ? 'text-red-400/70 font-bold'
        : 'text-slate-300 font-black';
        
        return (
            <tr
            key={`${row.price}-${index}`}
            className={`group border-t border-white/5 hover:bg-white/[0.02] transition-colors ${rowBackground}`}
            >
            <td
            className={`w-[18%] py-2 px-3 border-r border-white/5 ${priceColor}`}
            >
            {formatPrice(row.price)}
            </td>
            
            <td className="py-1 px-4 relative min-w-[120px]">
            <div className="flex items-center justify-center gap-1 h-5">
            <div className="flex-1 flex flex-col items-end">
            <div
            className="h-4 bg-blue-500/30 border-r-2 border-blue-500 rounded-l rounded-r-none px-1 flex items-center justify-end text-[9px] font-bold text-blue-200"
            style={{
                width: `${Math.min(
                    100,
                    (backValue / 500) * 100
                )}%`,
                minWidth: backValue > 0
                ? '15px'
                : '0'
            }}
            >
            {formatAmount(backValue)}
            </div>
            </div>
            
            <div className="w-px h-5 bg-white/10" />
            
            <div className="flex-1 flex flex-col items-start">
            <div
            className="h-4 bg-red-500/30 border-l-2 border-red-500 rounded-r rounded-l-none px-1 flex items-center justify-start text-[9px] font-bold text-red-200"
            style={{
                width: `${Math.min(
                    100,
                    (layValue / 500) * 100
                )}%`,
                minWidth: layValue > 0
                ? '15px'
                : '0'
            }}
            >
            {formatAmount(layValue)}
            </div>
            </div>
            </div>
            </td>
            
            <td className="py-1 px-3 text-right relative overflow-hidden">
            <div
            className="absolute inset-y-0 right-0 bg-emerald-500/10"
            style={{
                width: `${tradedPercent}%`
            }}
            />
            
            <span className="relative z-10 text-slate-300 font-bold">
            {formatAmount(totalRowMatched)}
            </span>
            </td>
            </tr>
        );
    })}
    </tbody>
    </table>
    </div>
    </div>
    
    <div className="mt-5">
    <MoneyFlowChart
    runnerHistory={runnerHistory}
    sharedGrid={sharedGrid}
    sharedMaxVal={sharedMaxVal}
    />
    </div>
    
    <div className="mt-4 flex items-center text-[10px]">
    <div className="flex items-center gap-2 text-slate-500 bg-white/5 px-2 py-1 rounded">
    <Activity className="w-3.5 h-3.5" />
    <span className="font-bold">
    TOTAL MATCHED: {totalMatched.toFixed(0)} EUR
    </span>
    </div>
                    </div>
                    </div>
                );
            }