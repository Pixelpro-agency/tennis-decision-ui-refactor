import { useMemo, useState } from 'react';
import {
    GRID_SIZE,
    alignToGrid,
    getDisplayMatchedVolume,
    toNumber
} from '../../utils/betfairMoneyFlow.js';

function formatTime(timestamp) {
    if (!timestamp) {
        return '';
    }

    const date = new Date(timestamp);

    if (Number.isNaN(date.getTime())) {
        return String(timestamp);
    }

    return date.toLocaleTimeString('it-IT', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}

function getLabelIndexes(total) {
    if (total <= 1) {
        return [];
    }

    const last = total - 1;

    return [...new Set([
        0,
        Math.round(last * 0.25),
        Math.round(last * 0.5),
        Math.round(last * 0.75),
        last
    ])];
}

export default function MoneyFlowChart({
    runnerHistory = [],
    sharedGrid = [],
    sharedMaxVal = 0
}) {
    const [hoveredIndex, setHoveredIndex] = useState(null);

    const slots = useMemo(() => {
        if (sharedGrid.length > 0) {
            return alignToGrid(sharedGrid, runnerHistory);
        }

        return runnerHistory.slice(-GRID_SIZE);
    }, [runnerHistory, sharedGrid]);

    const displayVolumes = slots.map(getDisplayMatchedVolume);
    const calculatedMax = Math.max(
        100,
        toNumber(sharedMaxVal),
        ...displayVolumes
    );
    const axisMax = Math.ceil(calculatedMax / 100) * 100;
    const hovered = hoveredIndex === null
        ? null
        : slots[hoveredIndex];
    const hoveredVolume = getDisplayMatchedVolume(hovered);

    const axisLeft = 42;
    const plotWidth = 308;
    const chartHeight = 120;
    const plotTop = 8;
    const baselineY = 94;
    const maxBarHeight = baselineY - plotTop;
    const labelIndexes = getLabelIndexes(slots.length);

    return (
        <div className="bg-black/30 rounded-xl border border-white/5 p-4 flex flex-col space-y-2 relative">
            <div className="flex justify-between items-center text-[10px] min-h-4">
                <span className="font-bold text-slate-400 uppercase tracking-wider">
                    Volume abbinato nel tempo
                </span>

                {hovered && (
                    <span className="font-mono text-slate-300">
                        VOLUME ABBINATO: {hoveredVolume.toFixed(0)} EUR
                    </span>
                )}
            </div>

            <div className="relative h-[110px] w-full overflow-hidden">
                <svg
                    viewBox={`0 0 350 ${chartHeight}`}
                    className="w-full h-full"
                    preserveAspectRatio="none"
                    style={{ overflow: 'hidden' }}
                >
                    <text
                        x={axisLeft - 2}
                        y={plotTop + 6}
                        fill="rgba(148, 163, 184, 0.7)"
                        fontSize="8"
                        fontFamily="monospace"
                        textAnchor="end"
                    >
                        {axisMax}
                    </text>

                    <text
                        x={axisLeft - 2}
                        y={Math.round((plotTop + baselineY) / 2) + 3}
                        fill="rgba(148, 163, 184, 0.7)"
                        fontSize="8"
                        fontFamily="monospace"
                        textAnchor="end"
                    >
                        {Math.round(axisMax / 2)}
                    </text>

                    <text
                        x={axisLeft - 2}
                        y={baselineY + 3}
                        fill="rgba(148, 163, 184, 0.7)"
                        fontSize="8"
                        fontFamily="monospace"
                        textAnchor="end"
                    >
                        0
                    </text>

                    <text
                        x={axisLeft - 2}
                        y={baselineY + 11}
                        fill="rgba(148, 163, 184, 0.4)"
                        fontSize="6"
                        fontFamily="monospace"
                        textAnchor="end"
                    >
                        EUR
                    </text>

                    <line
                        x1={axisLeft}
                        y1={baselineY}
                        x2="350"
                        y2={baselineY}
                        stroke="rgba(148, 163, 184, 0.28)"
                        strokeWidth="1"
                    />

                    <line
                        x1={axisLeft}
                        y1={Math.round((plotTop + baselineY) / 2)}
                        x2="350"
                        y2={Math.round((plotTop + baselineY) / 2)}
                        stroke="rgba(255,255,255,0.04)"
                        strokeWidth="1"
                        strokeDasharray="3 3"
                    />

                    <line
                        x1={axisLeft}
                        y1={plotTop}
                        x2="350"
                        y2={plotTop}
                        stroke="rgba(255,255,255,0.04)"
                        strokeWidth="1"
                        strokeDasharray="3 3"
                    />

                    {slots.map((point, index) => {
                        const stepWidth = plotWidth / Math.max(slots.length, 1);
                        const x = axisLeft + index * stepWidth;
                        const barWidth = Math.max(4, stepWidth - 3);
                        const matchedVolume = displayVolumes[index];
                        const barHeight = matchedVolume > 0
                            ? (matchedVolume / calculatedMax) * maxBarHeight
                            : 0;

                        return (
                            <g
                                key={`${point.timestamp || 'empty'}-${index}`}
                                onMouseEnter={() => setHoveredIndex(index)}
                                onMouseLeave={() => setHoveredIndex(null)}
                                className="cursor-pointer"
                            >
                                <rect
                                    x={x}
                                    y="0"
                                    width={stepWidth}
                                    height={chartHeight}
                                    fill="white"
                                    fillOpacity={hoveredIndex === index ? 0.04 : 0}
                                    rx="2"
                                />

                                {barHeight > 0 && (
                                    <rect
                                        x={x + stepWidth / 2 - barWidth / 2}
                                        y={baselineY - barHeight}
                                        width={barWidth}
                                        height={barHeight}
                                        fill="rgba(148, 163, 184, 0.9)"
                                        rx="1"
                                    />
                                )}
                            </g>
                        );
                    })}

                    {labelIndexes.map((index) => {
                        const point = slots[index];
                        const stepWidth = plotWidth / Math.max(slots.length, 1);
                        const x = axisLeft + index * stepWidth;

                        return (
                            <text
                                key={`label-${index}`}
                                x={x + stepWidth / 2}
                                y="116"
                                fill="rgba(148, 163, 184, 0.8)"
                                fontSize="7"
                                fontFamily="monospace"
                                textAnchor="middle"
                            >
                                {formatTime(point?.timestamp)}
                            </text>
                        );
                    })}
                </svg>
            </div>

            <div className="flex justify-between items-center text-[8px] text-slate-500 uppercase tracking-widest px-1">
                <span>← Older</span>
                <span>Live →</span>
            </div>
        </div>
    );
}
