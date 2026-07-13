import { MarketEvidenceBadge, MarketEvidenceRow } from './MarketEvidencePrimitives.jsx';
import { formatPercent, formatValue } from './formatters.js';

function formatImbalance(liquidity) {
    if (liquidity?.imbalance === null || liquidity?.imbalance === undefined) return '—';
    return `${(liquidity.imbalance * 100).toFixed(1)}%`;
}

export default function MarketEvidenceTargetRunner({ market, targetRunner, dataQuality }) {
    if (!targetRunner) return null;

    return (
        <>
            <div className="space-y-1">
                <div className="flex items-center gap-2 mb-1">
                    <span className="text-white font-bold text-sm">{targetRunner.name}</span>
                    <MarketEvidenceBadge type={targetRunner.role === 'FIRST_SET_WINNER' ? 'success' : 'neutral'}>
                        {targetRunner.role}
                    </MarketEvidenceBadge>
                </div>
                <MarketEvidenceRow
                    label="LTP"
                    value={formatValue(targetRunner.lastTradedPrice)}
                    hint={dataQuality?.usingStalePrice ? 'last usable' : null}
                />
                <MarketEvidenceRow
                    label="Best Back"
                    value={`${formatValue(targetRunner.bestBack)} (${formatValue(targetRunner.bestBackSize)})`}
                    hint={dataQuality?.usingStalePrice ? 'last usable' : null}
                />
                <MarketEvidenceRow
                    label="Best Lay"
                    value={`${formatValue(targetRunner.bestLay)} (${formatValue(targetRunner.bestLaySize)})`}
                    hint={dataQuality?.usingStalePrice ? 'last usable' : null}
                />
                <MarketEvidenceRow label="WOM" value={formatValue(targetRunner.wom)} />
                <MarketEvidenceRow label="Money Flow" value={targetRunner.moneyFlow?.trend || '—'} />
            </div>

            <div className="border-t border-gray-800 pt-3 space-y-1">
                <MarketEvidenceRow label="Price Δ" value={formatPercent(targetRunner.priceDeltaPct)} />
                <MarketEvidenceRow label="Matched Δ" value={formatValue(targetRunner.matchedDelta)} />
                <MarketEvidenceRow label="Market Total Matched" value={formatValue(market?.totalMatched)} />
                <MarketEvidenceRow label="Total Matched Δ" value={formatValue(market?.totalMatchedDelta)} />
                <MarketEvidenceRow label="Volume Accel." value={targetRunner.volumeAcceleration?.label || '—'} />
                <MarketEvidenceRow
                    label="Liquidity"
                    value={targetRunner.liquidity?.label || '—'}
                    hint={dataQuality?.usingStaleLadder ? 'last usable ladder' : null}
                />
                <MarketEvidenceRow label="Imbalance" value={formatImbalance(targetRunner.liquidity)} />
                <MarketEvidenceRow label="Pressure" value={targetRunner.pressure?.label || '—'} />
                <MarketEvidenceRow
                    label="Pressure Score"
                    value={targetRunner.pressure?.score !== null && targetRunner.pressure?.score !== undefined
                        ? targetRunner.pressure.score
                        : '—'}
                />
            </div>
        </>
    );
}
