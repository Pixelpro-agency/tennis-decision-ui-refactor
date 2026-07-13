import React, { useState, useEffect } from 'react';
import HeroCard from './strategy/HeroCard';
import EntryRulesCard from './strategy/EntryRulesCard';
import SetupContextCard from './strategy/SetupContextCard';
import MarketEvidenceCard from './strategy/MarketEvidenceCard';
import { SuccessProbabilityCard, StrategyChecklistCard, ExitPlanCard } from './strategy/SecondaryCards';
import DebugPanel from './strategy/DebugPanel';

const LayTheWinner = ({ matchUrl }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!matchUrl) return;

        const fetchData = async () => {
            try {
                if (!data) setLoading(true);

                const encodedUrl = encodeURIComponent(matchUrl);
                const response = await fetch(`http://localhost:3001/api/strategy/lay-the-winner?url=${encodedUrl}`);

                if (!response.ok) {
                    throw new Error(`API Error: ${response.status}`);
                }

                const result = await response.json();
                setData(result);
                setError(null);
            } catch (err) {
                console.error("Fetch strategy error:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();

        const intervalId = setInterval(fetchData, 3000);

        return () => clearInterval(intervalId);
    }, [matchUrl]);

    if (loading && !data) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-20 text-center">
                <div className="w-12 h-12 border-4 border-[var(--accent-blue)] border-t-transparent rounded-full animate-spin mb-6"></div>
                <h3 className="text-white text-xl font-bold mb-2">Analyzing Strategy...</h3>
                <p className="text-[var(--muted)] max-w-md">
                    Loading the available match data. The first load may take a few seconds.
                </p>
                <div className="mt-8 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full text-xs text-blue-400 animate-pulse">
                    ENCRYPTED TUNNEL ACTIVE
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-full p-10">
                <div className="text-red-400 text-lg border border-red-500/30 bg-red-500/10 p-4 rounded-lg">
                    Error loading strategy: {error}
                </div>
            </div>
        );
    }

    if (!data) return null;

    const { header, app, strategy, footerHints } = data;

    return (
        <div className="flex flex-col min-h-full">
            <div className="flex-1 p-6 max-w-7xl mx-auto w-full">
                {}
                {header && (
                    <div className="mb-6">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-[#1a2332] rounded-xl border border-gray-800 p-4">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Match</span>
                                    <span className="text-white font-bold text-sm">{header.matchTitle}</span>
                                    {header.status === 'LIVE' && (
                                        <span className="bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded uppercase">LIVE</span>
                                    )}
                                </div>
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-400">
                                    {header.status && <span>Status: <span className="text-gray-300">{header.status}</span></span>}
                                    {header.set && <span>Set: <span className="text-gray-300">{header.set}</span></span>}
                                    {header.gameScore && <span>Game: <span className="text-gray-300">{header.gameScore}</span></span>}
                                    {header.serving && <span>Serving: <span className="text-blue-400">{header.serving}</span></span>}
                                </div>
                            </div>
                            <div className="flex items-center gap-3 text-xs">
                                <div className="flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-green-400"></span>
                                    <span className="text-gray-400">Sofa</span>
                                    <span className="text-green-400 font-medium">connected</span>
                                </div>
                                <div className="flex items-center gap-1.5 opacity-45 grayscale cursor-not-allowed" title="Model/TOT not available">
                                    <span className="w-2 h-2 rounded-full bg-gray-500"></span>
                                    <span className="text-gray-500">Model/TOT</span>
                                    <span className="text-gray-500 font-medium">offline</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {}
                <div className="mb-6">
                    <HeroCard decision={strategy.decision} />
                </div>

                {}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {}
                    <div className="space-y-6">
                        <EntryRulesCard rules={strategy.entryRules} />
                        <SetupContextCard context={strategy.setupContext} />
                        <MarketEvidenceCard evidence={strategy.marketEvidence} />
                    </div>

                    {}
                    <div className="space-y-6">
                        <SuccessProbabilityCard data={strategy.successProbability} />
                        <StrategyChecklistCard items={strategy.strategyChecklist} />
                        <ExitPlanCard exitPlan={strategy.exitPlan} />
                    </div>
                </div>

                {}
                <div className="mt-8 pt-4 border-t border-gray-800">
                    <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                        <span>ENTER/SKIP based on <span className="font-bold">{footerHints.source}</span></span>
                        <span>|</span>
                        <span className="flex items-center gap-1">
                            {footerHints.update}
                            <span className="text-green-400">✓</span>
                        </span>
                        <span>|</span>
                        <span>{footerHints.note}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LayTheWinner;
