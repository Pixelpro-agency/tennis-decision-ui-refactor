
const CHECK_ORDER = ['backend', 'cdp', 'sofa', 'betfair', 'graphs'];

function getCheckButtonClass(status) {
  switch (status) {
    case 'ok': return 'bg-emerald-600 hover:bg-emerald-500 text-white';
    case 'error': return 'bg-red-600 hover:bg-red-500 text-white';
    case 'checking': return 'bg-amber-600 hover:bg-amber-500 text-white cursor-wait';
    default: return 'bg-slate-700 hover:bg-slate-600 text-white';
  }
}

function getCheckMessageClass(status) {
  switch (status) {
    case 'ok': return 'text-emerald-400';
    case 'error': return 'text-red-400';
    case 'checking': return 'text-amber-400';
    default: return 'text-slate-500';
  }
}

export default function PreflightChecks({
  checks,
  testBackend,
  testCdp,
  testSofaUrl,
  testBetfairUrl,
  testGraphUrls,
  runAllChecks
}) {
  return (
    <>
                            {}
                            <div className="mb-4 p-4 border border-[var(--card-border)] rounded-lg bg-[var(--bg-1)]/50">
                                <h3 className="text-sm font-bold text-white mb-3 uppercase tracking-wider">Pre-flight checks</h3>

                                <div className="grid grid-cols-2 gap-2 mb-3">
                                    <button
                                        type="button"
                                        onClick={testBackend}
                                        disabled={checks.backend.status === 'checking'}
                                        className={`text-xs font-bold py-2 rounded-lg transition-all disabled:opacity-70 ${getCheckButtonClass(checks.backend.status)}`}
                                    >
                                        {checks.backend.status === 'checking' ? (
                                            <span className="inline-flex items-center justify-center">
                                                <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin mr-1"></span>
                                                Test Backend
                                            </span>
                                        ) : 'Test Backend'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={testCdp}
                                        disabled={checks.cdp.status === 'checking'}
                                        className={`text-xs font-bold py-2 rounded-lg transition-all disabled:opacity-70 ${getCheckButtonClass(checks.cdp.status)}`}
                                    >
                                        {checks.cdp.status === 'checking' ? (
                                            <span className="inline-flex items-center justify-center">
                                                <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin mr-1"></span>
                                                Test CDP
                                            </span>
                                        ) : 'Test CDP'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={testSofaUrl}
                                        disabled={checks.sofa.status === 'checking'}
                                        className={`text-xs font-bold py-2 rounded-lg transition-all disabled:opacity-70 ${getCheckButtonClass(checks.sofa.status)}`}
                                    >
                                        {checks.sofa.status === 'checking' ? (
                                            <span className="inline-flex items-center justify-center">
                                                <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin mr-1"></span>
                                                Test Sofa URL
                                            </span>
                                        ) : 'Test Sofa URL'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={testBetfairUrl}
                                        disabled={checks.betfair.status === 'checking'}
                                        className={`text-xs font-bold py-2 rounded-lg transition-all disabled:opacity-70 ${getCheckButtonClass(checks.betfair.status)}`}
                                    >
                                        {checks.betfair.status === 'checking' ? (
                                            <span className="inline-flex items-center justify-center">
                                                <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin mr-1"></span>
                                                Test Betfair URL
                                            </span>
                                        ) : 'Test Betfair URL'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={testGraphUrls}
                                        disabled={checks.graphs.status === 'checking'}
                                        className={`col-span-2 text-xs font-bold py-2 rounded-lg transition-all disabled:opacity-70 ${getCheckButtonClass(checks.graphs.status)}`}
                                    >
                                        {checks.graphs.status === 'checking' ? (
                                            <span className="inline-flex items-center justify-center">
                                                <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin mr-1"></span>
                                                Test Graph URLs
                                            </span>
                                        ) : 'Test Graph URLs'}
                                    </button>
                                </div>

                                <button
                                    type="button"
                                    onClick={runAllChecks}
                                    disabled={Object.values(checks).some(c => c.status === 'checking')}
                                    className="w-full bg-[var(--accent-blue)] hover:bg-blue-600 text-white text-xs font-bold py-2 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed mb-3"
                                >
                                    Run All Checks
                                </button>

                                <div className="space-y-1 text-xs">
                                    {CHECK_ORDER.map(key => (
                                        checks[key].message ? (
                                            <p key={key} className={getCheckMessageClass(checks[key].status)}>
                                                {checks[key].message}
                                            </p>
                                        ) : null
                                    ))}
                                </div>
                            </div>

    </>
  );
}
