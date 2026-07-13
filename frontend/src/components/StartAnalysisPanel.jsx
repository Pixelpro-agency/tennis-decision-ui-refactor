import PreflightChecks from './PreflightChecks';

export default function StartAnalysisPanel({
  matchUrl,
  setMatchUrl,
  betfairUrl,
  setBetfairUrl,
  betfairGraphUrls,
  setBetfairGraphUrls,
  betfairMode,
  setBetfairMode,
  chromeProfilePath,
  setChromeProfilePath,
  chromeProfileName,
  cdpUrl,
  setCdpUrl,
  openBetfairLogin,
  fetchBetfairLog,
  showBetfairLog,
  setShowBetfairLog,
  betfairLog,
  checks,
  testBackend,
  testCdp,
  testSofaUrl,
  testBetfairUrl,
  testGraphUrls,
  runAllChecks,
  handleSearch,
  sofaLoading,
  sofaError
}) {
  return (
                <div className="w-full flex items-center justify-center p-6">
                    <div className="w-full max-w-md">
                        <h1 className="text-3xl font-bold text-white text-center mb-8 uppercase tracking-widest">Tennis Decision</h1>

                        <div className="dashboardCard p-6">
                            <h2 className="text-lg font-semibold text-white mb-4">Start Analysis</h2>

                            <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">SofaScore URL</label>
                            <input
                                type="text"
                                placeholder="Paste SofaScore URL..."
                                className="w-full bg-[var(--bg-1)] border border-[var(--card-border)] text-white px-4 py-3 rounded-lg mb-4 focus:outline-none focus:border-[var(--accent-blue)] transition-colors"
                                value={matchUrl}
                                onChange={(e) => setMatchUrl(e.target.value)}
                            />

                            <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">Betfair Exchange URL</label>
                            <input
                                type="text"
                                placeholder="Paste Betfair URL..."
                                className="w-full bg-[var(--bg-1)] border border-[var(--card-border)] text-white px-4 py-3 rounded-lg mb-4 focus:outline-none focus:border-[var(--accent-blue)] transition-colors"
                                value={betfairUrl}
                                onChange={(e) => setBetfairUrl(e.target.value)}
                            />

                            <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">Betfair Ladder/Graph URL(s) (opzionale, uno per riga)</label>
                            <textarea
                                placeholder="https://graphs.betfair.it/...&#10;https://graphs.betfair.it/..."
                                className="w-full bg-[var(--bg-1)] border border-[var(--card-border)] text-white px-4 py-3 rounded-lg mb-4 focus:outline-none focus:border-[var(--accent-blue)] transition-colors h-20 resize-none"
                                value={betfairGraphUrls}
                                onChange={(e) => setBetfairGraphUrls(e.target.value)}
                            />

                            <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">ModalitÃ  sessione Betfair</label>
                            <div className="flex gap-2 mb-4">
                                <button
                                    type="button"
                                    onClick={() => setBetfairMode('persistent')}
                                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${betfairMode === 'persistent' ? 'bg-[var(--accent-blue)] text-white' : 'bg-slate-700 text-slate-300'}`}
                                >
                                    Profilo Persistent
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setBetfairMode('cdp')}
                                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${betfairMode === 'cdp' ? 'bg-[var(--accent-blue)] text-white' : 'bg-slate-700 text-slate-300'}`}
                                >
                                    Chrome CDP
                                </button>
                            </div>

                            {betfairMode === 'persistent' ? (
                                <>
                                    <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">Cartella dati browser dedicata</label>
                                    <input
                                        type="text"
                                        placeholder="C:\\BetfairChromeProfile"
                                        className="w-full bg-[var(--bg-1)] border border-[var(--card-border)] text-white px-4 py-3 rounded-lg mb-2 focus:outline-none focus:border-[var(--accent-blue)] transition-colors"
                                        value={chromeProfilePath}
                                        onChange={(e) => setChromeProfilePath(e.target.value)}
                                    />
                                    <p className="text-[10px] text-slate-500 mb-4">
                                        Usa una cartella dedicata, es: C:\BetfairChromeProfile. Non usare il tuo profilo Chrome principale.
                                    </p>
                                </>
                            ) : (
                                <>
                                    <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">CDP URL</label>
                                    <input
                                        type="text"
                                        placeholder="http://127.0.0.1:9222"
                                        className="w-full bg-[var(--bg-1)] border border-[var(--card-border)] text-white px-4 py-3 rounded-lg mb-4 focus:outline-none focus:border-[var(--accent-blue)] transition-colors"
                                        value={cdpUrl}
                                        onChange={(e) => setCdpUrl(e.target.value)}
                                    />
                                    <p className="text-[10px] text-slate-500 mb-4">
                                        Avvia Chrome con: chrome.exe --remote-debugging-port=9222 --user-data-dir="C:\\BetfairChromeProfile"
                                    </p>
                                </>
                            )}

                            <div className="flex gap-2 mb-4">
                                <button
                                    type="button"
                                    onClick={openBetfairLogin}
                                    disabled={!betfairUrl}
                                    className="flex-1 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold py-2 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Apri login Betfair
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { fetchBetfairLog(); setShowBetfairLog(!showBetfairLog); }}
                                    className="flex-1 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold py-2 rounded-lg transition-all"
                                >
                                    {showBetfairLog ? 'Nascondi log' : 'Mostra log Betfair'}
                                </button>
                            </div>

                            {showBetfairLog && (
                                <div className="mb-4 p-3 bg-black/40 border border-white/10 rounded-lg h-40 overflow-y-auto font-mono text-[10px] text-slate-300">
                                    {betfairLog.length === 0 ? (
                                        <span className="text-slate-500">Nessun log disponibile.</span>
                                    ) : (
                                        betfairLog.map((line, i) => <div key={i}>{line}</div>)
                                    )}
                                </div>
                            )}

                            <PreflightChecks
                                checks={checks}
                                testBackend={testBackend}
                                testCdp={testCdp}
                                testSofaUrl={testSofaUrl}
                                testBetfairUrl={testBetfairUrl}
                                testGraphUrls={testGraphUrls}
                                runAllChecks={runAllChecks}
                            />

                            <button
                                onClick={() => handleSearch(matchUrl, betfairUrl, betfairGraphUrls, betfairMode, chromeProfilePath, chromeProfileName, cdpUrl)}
                                disabled={!matchUrl || sofaLoading}
                                className="w-full bg-[var(--accent-blue)] hover:bg-blue-600 text-white font-bold py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center mt-2"
                            >
                                {sofaLoading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                                        Connecting...
                                    </>
                                ) : 'Link Accounts & Start'}
                            </button>

                            {sofaError && (
                                <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm text-center">
                                    {sofaError}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
  );
}
