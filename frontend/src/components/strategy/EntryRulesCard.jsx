import React from 'react';
import { CheckCircle, AlertTriangle, XCircle, Volume2 } from 'lucide-react';

const EntryRulesCard = ({ rules }) => {
    if (!rules || rules.length === 0) return null;

    const getIcon = (iconName) => {
        switch (iconName) {
            case 'check': return <CheckCircle className="w-5 h-5" />;
            case 'warning': return <AlertTriangle className="w-5 h-5" />;
            case 'x': return <XCircle className="w-5 h-5" />;
            default: return null;
        }
    };

    const getColors = (level) => {
        switch (level) {
            case 'GREEN': return {
                bg: 'bg-green-900/20',
                border: 'border-green-800/40',
                text: 'text-green-400'
            };
            case 'YELLOW': return {
                bg: 'bg-yellow-900/20',
                border: 'border-yellow-800/40',
                text: 'text-yellow-400'
            };
            case 'RED': return {
                bg: 'bg-red-900/20',
                border: 'border-red-800/40',
                text: 'text-red-400'
            };
            default: return {
                bg: 'bg-gray-900',
                border: 'border-gray-800',
                text: 'text-gray-400'
            };
        }
    };

    return (
        <div className="bg-[#1a2332] rounded-xl border border-gray-800 p-5">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Volume2 className="w-4 h-4" />
                Entry Rules
            </h3>
            <div className="space-y-3">
                {rules.map((rule, idx) => {
                    const colors = getColors(rule.level);
                    return (
                        <div key={idx} className={`flex items-start gap-3 p-3 rounded-lg border ${colors.border} ${colors.bg}`}>
                            <div className={`mt-0.5 shrink-0 ${colors.text}`}>
                                {getIcon(rule.uiIcon)}
                            </div>
                            <div className="flex-1">
                                <div className={`font-bold text-sm mb-1 ${colors.text}`}>
                                    {rule.level}: {rule.label}
                                </div>
                                <div className="text-white text-sm mb-0.5">
                                    {rule.rule}
                                </div>
                                <div className="text-gray-400 text-xs font-mono">
                                    {rule.edgeRule}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default EntryRulesCard;
