import React from 'react';
import { Home, Layout, Zap, Repeat, Activity } from 'lucide-react';
import SourceIdentityGateIndicator from './SourceIdentityGateIndicator';

const Sidebar = ({
    activeView,
    onViewChange,
    betfairHealth,
    sourceIdentityGateStatus,
    hasBetfairUrl,
    trackingStopped,
    onOpenSourceIdentityConfirmation
}) => {
    const menuItems = [
        { id: 'overview', label: 'Overview', icon: Home },
        { id: 'market-reactions', label: 'Market Reactions', icon: Activity },
        { id: 'lay', label: 'Lay the Winner', icon: Layout },
        { id: 'banca', label: 'Banca Servizio', icon: Repeat },
        { id: 'superbreak', label: 'Superbreak', icon: Zap }
    ];

    return (
        <aside className="w-64 bg-[var(--bg-1)] border-r border-[var(--card-border)] h-screen sticky top-0 flex flex-col p-6 z-[60]">
            <div className="flex items-center gap-3 mb-10 px-2">
                <div className="w-8 h-8 bg-[var(--accent-blue)] rounded-lg flex items-center justify-center font-bold text-white">TD</div>
                <span className="font-bold text-lg tracking-tight text-white uppercase">Tennis Decision</span>
            </div>

            <nav className="flex-1 flex flex-col gap-2">
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeView === item.id;

                    return (
                        <button
                            key={item.id}
                            onClick={() => onViewChange(item.id)}
                            className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 group
                                ${isActive
                                    ? 'bg-[var(--accent-blue)] text-white shadow-[0_0_20px_rgba(59,130,246,0.2)]'
                                    : 'text-[var(--muted)] hover:bg-[rgba(255,255,255,0.05)] hover:text-white'
                                }
                            `}
                        >
                            <Icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-[var(--muted)] group-hover:text-[var(--accent-blue)]'}`} />
                            <span className="font-semibold text-sm">{item.label}</span>
                            {isActive && (
                                <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full" />
                            )}
                        </button>
                    );
                })}
            </nav>

            <div className="mt-auto space-y-3 pt-6 border-t border-[var(--card-border)]">
                <SourceIdentityGateIndicator
                    status={sourceIdentityGateStatus}
                    hasBetfairUrl={hasBetfairUrl}
                    trackingStopped={trackingStopped}
                    onOpenConfirmation={onOpenSourceIdentityConfirmation}
                />

                <div className="px-4 py-3 bg-[var(--card)] rounded-xl border border-[var(--card-border)]">
                    <div className="text-[10px] text-[var(--muted)] uppercase tracking-widest font-bold mb-1">
                        Status
                    </div>
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full animate-pulse ${betfairHealth?.status === 'red' ? 'bg-amber-500' : 'bg-[var(--accent-green)]'}`} />
                        <span className="text-xs font-semibold text-white">
                            {betfairHealth?.status === 'red'
                                ? 'Dashboard engine active'
                                : 'Live Engine Active'}
                        </span>
                    </div>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
