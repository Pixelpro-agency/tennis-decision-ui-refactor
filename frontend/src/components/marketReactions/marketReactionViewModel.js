export function isBranchAvailable(evidence) {
  return evidence?.available === true;
}

export function formatMarkerTypes(value) {
  return Array.isArray(value) && value.length > 0 ? value.join(', ') : '—';
}

export function buildMarketSourceView(source) {
  if (!source || typeof source !== 'object') return null;
  return {
    runner: source.runner ?? null,
    amount: source.observedFlowAmount ?? null,
    absoluteTier: source.absoluteFlowTier ?? null,
    relativeTier: source.relativeFlowTier ?? null,
    direction: source.direction ?? null,
    flowAmbiguous: source.flowAmbiguous === true
  };
}

export function shouldShowCausalityDisclaimer(evidence) {
  return evidence?.summary?.causalityClaimed === false ||
    evidence?.causalityClaimed === false;
}
