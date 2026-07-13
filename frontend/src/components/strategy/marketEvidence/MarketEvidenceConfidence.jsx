import { MarketEvidenceBadge } from './MarketEvidencePrimitives.jsx';

function confidenceBadgeType(level) {
    if (level === 'high') return 'success';
    if (level === 'medium') return 'warning';
    return 'neutral';
}

export default function MarketEvidenceConfidence({ confidence }) {
    if (!confidence) return null;

    return (
        <div className="bg-gray-900/50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Confidence</span>
                <MarketEvidenceBadge type={confidenceBadgeType(confidence.level)}>
                    {confidence.level?.toUpperCase()}
                </MarketEvidenceBadge>
            </div>
            <div className="text-2xl font-bold text-white mb-1">
                {confidence.score}
                <span className="text-sm text-gray-500">/100</span>
            </div>
            {confidence.reasons && confidence.reasons.length > 0 && (
                <ul className="space-y-0.5">
                    {confidence.reasons.map((reason, idx) => (
                        <li key={idx} className="text-[10px] text-gray-500 flex items-start gap-1">
                            <span className="text-orange-400">•</span>
                            {reason}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
