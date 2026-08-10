import assert from 'node:assert/strict';
import {
  buildMarketSourceView,
  formatMarkerTypes,
  isBranchAvailable,
  shouldShowCausalityDisclaimer
} from './marketReactionViewModel.js';

assert.equal(isBranchAvailable({ available: false }), false);
assert.equal(isBranchAvailable({ available: true }), true);
assert.equal(isBranchAvailable({}), false);

assert.deepEqual(buildMarketSourceView({
  runner: 'Runner A',
  observedFlowAmount: 1200,
  absoluteFlowTier: 'strong',
  relativeFlowTier: 'unusual',
  direction: 'back',
  flowAmbiguous: false
}), {
  runner: 'Runner A',
  amount: 1200,
  absoluteTier: 'strong',
  relativeTier: 'unusual',
  direction: 'back',
  flowAmbiguous: false
});
assert.equal(formatMarkerTypes(['BREAK_POINT', 'DEUCE']), 'BREAK_POINT, DEUCE');
assert.equal(formatMarkerTypes([]), '—');
assert.equal(shouldShowCausalityDisclaimer({ summary: { causalityClaimed: false } }), true);

console.log('marketReactionViewModel.test: 7 assertions passed');
