import { Activity, AlertCircle, History } from 'lucide-react';
import { MarketEvidenceBadge } from './MarketEvidencePrimitives.jsx';

export function MarketEvidenceHeader({ unavailable, historical }) {
    return (
        <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Market Evidence
            </h3>
            {unavailable ? (
                <MarketEvidenceBadge type="warning">UNAVAILABLE</MarketEvidenceBadge>
            ) : historical ? (
                <MarketEvidenceBadge type="historical">
                    <History className="w-3 h-3 inline -mt-0.5 mr-0.5" />
                    HISTORICAL
                </MarketEvidenceBadge>
            ) : (
                <MarketEvidenceBadge type="success">LIVE</MarketEvidenceBadge>
            )}
        </div>
    );
}

export function MarketEvidenceUnavailable({ reason }) {
    return (
        <div className="flex items-start gap-2 text-sm text-gray-400">
            <AlertCircle className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
            <div>
                <p>Betfair market evidence is not available.</p>
                {reason && <p className="text-orange-400/80 text-xs mt-1 font-mono">{reason}</p>}
            </div>
        </div>
    );
}
