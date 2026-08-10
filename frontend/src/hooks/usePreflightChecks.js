import { parseGraphUrls, safeFetchJson } from '../utils/preflight.js';
import { normalizeCdpBaseUrl } from '../utils/cdpUrl.js';
import { frontendRuntimeLog } from '../utils/runtimeLog.js';

export function usePreflightChecks({
  apiBase, cdpUrl, matchUrl, betfairUrl, betfairGraphUrls, betfairMode, setChecks
}) {
    const setCheck = (key, status, message) => setChecks(previous => ({
        ...previous,
        [key]: { status, message }
    }));

    const failed = (source, key, message) => {
        frontendRuntimeLog('warn', 'preflight_failed', { source });
        setCheck(key, 'error', message);
        return false;
    };

    const testBackend = async () => {
        setCheck('backend', 'checking', '');
        try {
            const { data } = await safeFetchJson(`${apiBase}/api/health`);
            if (data.ok === true && data.service === 'backend' && data.project === 'tennis-decision-ui') {
                setCheck('backend', 'ok', 'Backend OK');
                return true;
            }
            return failed('backend', 'backend', 'Backend non riconosciuto.');
        } catch (_) {
            return failed('backend', 'backend', 'Backend non raggiungibile.');
        }
    };

    const testCdp = async () => {
        setCheck('cdp', 'checking', '');
        const targetCdp = normalizeCdpBaseUrl(cdpUrl);
        if (!targetCdp) {
            setCheck('cdp', 'error', 'CDP non disponibile: usa modalità Persistent oppure attendi l’avvio di Chrome.');
            return null;
        }
        try {
            const { data } = await safeFetchJson(`${apiBase}/api/test/cdp`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cdpUrl: targetCdp })
            });
            if (data.ok) {
                setCheck('cdp', 'ok', `CDP OK — Chrome debug attivo${data.browser ? ` (${data.browser})` : ''}`);
                return true;
            }
            return failed('cdp', 'cdp', data.code === 'cdp_timeout'
                ? 'CDP non disponibile: tempo di attesa superato.'
                : 'CDP non raggiungibile o non valido.');
        } catch (_) {
            return failed('cdp', 'cdp', 'CDP non raggiungibile.');
        }
    };

    const testSofaUrl = async () => {
        setCheck('sofa', 'checking', '');
        if (!matchUrl) {
            setCheck('sofa', 'error', 'SofaScore: URL mancante.');
            return false;
        }
        try {
            const { data } = await safeFetchJson(`${apiBase}/api/test/sofa-url`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sofaUrl: matchUrl })
            });
            if (data.ok) {
                setCheck('sofa', 'ok', `SofaScore OK — eventId ${data.eventId}`);
                return true;
            }
            return failed('sofa', 'sofa', 'SofaScore: URL non valida o eventId assente.');
        } catch (_) {
            return failed('sofa', 'sofa', 'SofaScore: controllo non disponibile.');
        }
    };

    const testBetfairUrl = async () => {
        setCheck('betfair', 'checking', '');
        if (!betfairUrl) {
            setCheck('betfair', 'idle', 'Betfair URL non fornita.');
            return null;
        }
        try {
            const { data } = await safeFetchJson(`${apiBase}/api/test/betfair-url`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ betfairUrl })
            });
            if (data.ok) {
                setCheck('betfair', 'ok', `Betfair URL OK — eventId ${data.eventId}`);
                return true;
            }
            return failed('betfair', 'betfair', 'Betfair: URL non valida o eventId assente.');
        } catch (_) {
            return failed('betfair', 'betfair', 'Betfair: controllo non disponibile.');
        }
    };

    const testGraphUrls = async () => {
        setCheck('graphs', 'checking', '');
        const urls = parseGraphUrls(betfairGraphUrls);
        if (urls.length === 0) {
            setCheck('graphs', 'idle', 'Graph URL non fornite.');
            return null;
        }
        try {
            const { data } = await safeFetchJson(`${apiBase}/api/test/graph-urls`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ graphUrls: urls })
            });
            if (data.ok) {
                const marketId = data.graphs?.[0]?.marketId || null;
                const selectionIds = data.graphs.map(graph => graph.selectionId).filter(Boolean).join(' / ');
                setCheck('graphs', 'ok', `Graph URL OK — marketId ${marketId}, selections ${selectionIds}`);
                return true;
            }
            const duplicate = data.graphs?.some(graph => graph.error === 'bad_graph_url_duplicate_selection');
            return failed('graphs', 'graphs', duplicate
                ? 'Graph URL: selectionId duplicato.'
                : 'Graph URL non valida.');
        } catch (_) {
            return failed('graphs', 'graphs', 'Graph URL: controllo non disponibile.');
        }
    };

    const runAllChecks = async () => {
        await testBackend();
        if (betfairMode === 'cdp') await testCdp();
        else setCheck('cdp', 'idle', 'CDP non richiesto in modalità Persistent.');
        await testSofaUrl();
        await testBetfairUrl();
        await testGraphUrls();
    };

    return { testBackend, testCdp, testSofaUrl, testBetfairUrl, testGraphUrls, runAllChecks };
}
