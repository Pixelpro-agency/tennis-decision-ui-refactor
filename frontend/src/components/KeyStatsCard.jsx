import React, { useState } from 'react';
import { BarChart3 } from 'lucide-react';

const KeyStatsCard = ({ data }) => {
    if (!data) return null;
    const { title, tabs, rows } = data;

    const [activeTabId, setActiveTabId] = useState(tabs.find(t => t.active)?.id || 'total');

    const currentRows = Array.isArray(rows) ? rows : (rows[activeTabId] || []);

    return (
        <div className="dashboardCard p-6 flex flex-col h-0 min-h-full">
            {}
            <div className="flex flex-col mb-6">
                <h2 className="text-[12px] font-bold tracking-widest text-[var(--muted)] mb-4 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    {title}
                </h2>

                {}
                <div className="flex border-b border-[var(--card-border)]">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTabId(tab.id)}
                            className={`px-4 py-2 text-sm font-medium transition-colors relative
                ${activeTabId === tab.id
                                    ? 'text-[var(--accent-blue)]'
                                    : 'text-[var(--muted)] hover:text-white'
                                }
              `}
                        >
                            {tab.label}
                            {activeTabId === tab.id && (
                                <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[var(--accent-blue)]"></div>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {}
            <div className="flex-1 flex flex-col gap-5 overflow-y-auto pr-2">
                {currentRows.map((row) => (
                    <div key={row.key} className="flex flex-col w-full animate-modal-enter">
                        {}
                        <div className="flex justify-between items-end mb-2 text-sm">
                            <span className="font-medium text-[var(--accent-blue)]">
                                {row.homeValue}
                            </span>

                            <span className="text-[11px] font-bold text-[var(--muted)] uppercase tracking-wider mb-0.5">
                                {row.label}
                            </span>

                            <span className="font-medium text-[var(--danger)]">
                                {row.awayValue}
                            </span>
                        </div>

                        {}
                        <div className="w-full h-1.5 bg-[rgba(255,255,255,0.05)] rounded-full flex overflow-hidden">
                            {}
                            <div
                                style={{ width: `${row.bar.homeShare}%` }}
                                className="h-full bg-[var(--accent-blue)] opacity-80 duration-500 transition-all"
                            ></div>

                            <div style={{ flex: 1, background: 'transparent' }}></div>

                            {}
                            <div
                                style={{ width: `${row.bar.awayShare}%` }}
                                className="h-full bg-[var(--danger)] opacity-80 duration-500 transition-all"
                            ></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default KeyStatsCard;
