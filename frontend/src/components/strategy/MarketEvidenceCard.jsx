import MarketEvidenceConfidence from './marketEvidence/MarketEvidenceConfidence.jsx';
import { MarketEvidenceStaleNotices, MarketEvidenceWarnings } from './marketEvidence/MarketEvidenceDataQuality.jsx';
import MarketEvidenceMiniSeries from './marketEvidence/MarketEvidenceMiniSeries.jsx';
import MarketEvidenceRunners from './marketEvidence/MarketEvidenceRunners.jsx';
import { MarketEvidenceHeader, MarketEvidenceUnavailable } from './marketEvidence/MarketEvidenceStatus.jsx';
import MarketEvidenceTargetRunner from './marketEvidence/MarketEvidenceTargetRunner.jsx';

const MarketEvidenceCard = ({ evidence }) => {
    if (!evidence) return null;

    const {
        available,
        reason,
        market,
        targetRunner,
        runners,
        miniSeries,
        dataQuality,
        confidence
    } = evidence;

    const isUnavailable = !available;
    const isHistorical = !isUnavailable && dataQuality?.marketProbablyFinished;

    return (
        <div className="bg-[#1a2332] rounded-xl border border-gray-800 p-5">
            <MarketEvidenceHeader unavailable={isUnavailable} historical={isHistorical} />

            {isUnavailable ? (
                <MarketEvidenceUnavailable reason={reason} />
            ) : (
                <div className="space-y-4">
                    <MarketEvidenceConfidence confidence={confidence} />
                    <MarketEvidenceStaleNotices dataQuality={dataQuality} />
                    <MarketEvidenceTargetRunner
                        market={market}
                        targetRunner={targetRunner}
                        dataQuality={dataQuality}
                    />
                    <MarketEvidenceRunners runners={runners} />
                    <MarketEvidenceMiniSeries miniSeries={miniSeries} />
                    <MarketEvidenceWarnings dataQuality={dataQuality} />
                </div>
            )}
        </div>
    );
};

export default MarketEvidenceCard;
