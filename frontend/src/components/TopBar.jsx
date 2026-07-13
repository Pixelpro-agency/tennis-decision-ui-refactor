import React, { useState, useEffect } from 'react';
import { Clock, Check, MessageSquare } from 'lucide-react';

const TopBar = ({ data, connections }) => {
    if (!data) return null;
    const { left, statusBadges, right } = data;

    const [timeLabel, setTimeLabel] = useState("");
    const [sofaTimeLabel, setSofaTimeLabel] = useState('—');
    const [betfairTimeLabel, setBetfairTimeLabel] = useState('—');

    const sofaStatus = ['connected', 'waiting', 'disconnected'].includes(
        connections?.sofa?.status
    )
        ? connections.sofa.status
        : connections?.sofa?.ok
            ? 'connected'
            : 'disconnected';

    const sofaStatusLabel =
        sofaStatus === 'connected'
            ? 'Connected'
            : sofaStatus === 'waiting'
                ? 'In attesa'
                : 'Disconnected';

    const sofaStatusColor =
        sofaStatus === 'connected'
            ? 'text-green-400'
            : sofaStatus === 'waiting'
                ? 'text-amber-400'
                : 'text-red-400';

    const sofaStatusTimeLabel =
        sofaStatus === 'waiting' ? '—' : sofaTimeLabel;

    useEffect(() => {
        const updateTime = () => {
            const val = right.lastUpdate.value;
            try {
                const date = new Date(val);
                if (!isNaN(date.getTime())) {
                    const diff = Math.floor((new Date() - date) / 1000);
                    setTimeLabel(`${Math.max(0, diff)}s fa`);
                } else {
                    setTimeLabel(val);
                }
            } catch (e) {
                setTimeLabel(val);
            }
        };
        updateTime();
        const interval = setInterval(updateTime, 1000);
        return () => clearInterval(interval);
    }, [right.lastUpdate.value]);

    useEffect(() => {
        if (!connections?.sofa?.lastUpdate) {
            setSofaTimeLabel('—');
            return;
        }
        const update = () => {
            const d = new Date(connections.sofa.lastUpdate);
            if (!isNaN(d.getTime())) {
                const diff = Math.floor((new Date() - d) / 1000);
                setSofaTimeLabel(`${Math.max(0, diff)}s fa`);
            } else {
                setSofaTimeLabel('—');
            }
        };
        update();
        const interval = setInterval(update, 1000);
        return () => clearInterval(interval);
    }, [connections?.sofa?.lastUpdate]);

    useEffect(() => {
        if (!connections?.betfair?.lastUpdate) {
            setBetfairTimeLabel('—');
            return;
        }
        const update = () => {
            const d = new Date(connections.betfair.lastUpdate);
            if (!isNaN(d.getTime())) {
                const diff = Math.floor((new Date() - d) / 1000);
                setBetfairTimeLabel(`${Math.max(0, diff)}s fa`);
            } else {
                setBetfairTimeLabel('—');
            }
        };
        update();
        const interval = setInterval(update, 1000);
        return () => clearInterval(interval);
    }, [connections?.betfair?.lastUpdate]);

    return (
        <div className="topBar w-full h-[75px] flex items-center justify-between px-8 py-4">
            {}
            <div className="flex items-center gap-4">
                {}
                <div className="flex gap-3">
                    {statusBadges.map((badge) => (
                        <div
                            key={badge.id}
                            className={`px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase ${badge.state === 'ok' ? 'badgeOk' : 'badgeOn'
                                }`}
                        >
                            <div className="flex items-center gap-1.5">
                                <div className={`w-1.5 h-1.5 rounded-full ${badge.state === 'ok' ? 'bg-[#27d17c]' : 'bg-[#3b82f6]'}`}></div>
                                {badge.label}
                            </div>
                        </div>
                    ))}
                </div>

                {}
                {connections && (
                    <div className="flex items-center gap-3 ml-2 border-l border-[var(--card-border)] pl-4">
                        <div className={`flex items-center gap-1.5 text-xs ${sofaStatusColor}`}>
                            <span className="font-medium">Sofa:</span>
                            <span className="font-bold">{sofaStatusLabel}</span>
                            <span className="text-gray-500 ml-1">({sofaStatusTimeLabel})</span>
                            {sofaStatus === 'connected' && <Check className="w-3.5 h-3.5" />}
                        </div>

                        {(() => {
                            const health = connections?.betfair?.health;
                            const transition = connections?.betfair?.transition;
                            const hasHealth = !!health;
                            const isRed = health?.status === 'red';

                            const statusText =
                                health?.status === 'green' ? 'OK' :
                                    health?.status === 'yellow' ? 'STALE' :
                                        health?.status === 'red' ? 'ALERT' :
                                            health?.status === 'finished' ? 'FINISHED' : 'UNKNOWN';

                            const statusColor =
                                health?.status === 'green' ? 'text-green-400' :
                                    health?.status === 'yellow' ? 'text-amber-400' :
                                        health?.status === 'red' ? 'text-red-400' :
                                            'text-gray-400';

                            const dotColor =
                                health?.status === 'green' ? 'bg-green-500' :
                                    health?.status === 'yellow' ? 'bg-amber-500' :
                                        health?.status === 'red' ? 'bg-red-500' :
                                            'bg-gray-500';

                            const transitionBadge =
                                transition === 'to-red' ? { text: 'NEW ALERT', color: 'bg-red-500 text-white' } :
                                    transition === 'recovered' ? { text: 'RECOVERED', color: 'bg-emerald-500 text-white' } :
                                        null;

                            return (
                                <div
                                    title={health?.message || ''}
                                    className={`flex items-center gap-1.5 text-xs ${
                                        isRed 
                                            ? 'bg-red-900/40 border border-red-500/40 px-2.5 py-1 rounded-lg font-bold' 
                                            : ''
                                    }`}
                                >
                                    <div className={`w-2 h-2 rounded-full ${dotColor} ${isRed ? 'animate-pulse' : ''}`}></div>
                                    {isRed ? (
                                        <span className="text-red-400 font-bold uppercase tracking-wider">BETFAIR ALERT</span>
                                    ) : (
                                        <>
                                            <span className="font-medium text-gray-300">Betfair:</span>
                                            <span className={`font-bold ${hasHealth ? statusColor : 'text-gray-400'}`}>
                                                {hasHealth ? statusText : 'UNKNOWN'}
                                            </span>
                                        </>
                                    )}
                                    {transitionBadge && (
                                        <span className={`ml-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${transitionBadge.color}`}>
                                            {transitionBadge.text}
                                        </span>
                                    )}
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            connections?.betfair?.onToggleAudioAlert?.();
                                        }}
                                        className={`ml-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider transition-colors ${connections?.betfair?.audioAlertEnabled ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'}`}
                                        title={connections?.betfair?.audioAlertEnabled ? 'Sound ON — click to disable' : 'Sound OFF — click to enable'}
                                    >
                                        {connections?.betfair?.audioAlertEnabled ? 'Sound ON' : 'Sound OFF'}
                                    </button>
                                    <span className="text-gray-500 ml-1">({betfairTimeLabel})</span>
                                </div>
                            );
                        })()}

                        <div className={`flex items-center gap-1.5 text-xs ${connections.modelTot?.ok ? 'text-green-400' : 'text-gray-500'}`}>
                            <span className="font-medium">Model/TOT:</span>
                            {connections.modelTot?.ok && <Check className="w-3.5 h-3.5" />}
                            {!connections.modelTot?.ok && <span className="text-gray-600">—</span>}
                        </div>
                    </div>
                )}
            </div>

            {}
            <div className="flex items-center text-[13px] text-[var(--muted)] font-medium">
                <Clock className="w-4 h-4 mr-2 opacity-70" />
                <span className="opacity-70 mr-1">{right.lastUpdate.label}:</span>
                <span className="text-[var(--text)] min-w-[50px]">{timeLabel}</span>
                {}
                <div className="ml-3 w-5 h-5 rounded-full border border-[var(--card-border)] flex items-center justify-center">
                    <div className="w-2 h-2 bg-[var(--accent-green)] rounded-full animate-pulse"></div>
                </div>
            </div>
        </div>
    );
};

export default TopBar;
