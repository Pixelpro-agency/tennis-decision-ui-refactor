
import { parseGraphUrls, safeFetchJson } from '../utils/preflight.js';

export function usePreflightChecks({
  apiBase,
  cdpUrl,
  matchUrl,
  betfairUrl,
  betfairGraphUrls,
  betfairMode,
  setChecks
}) {
    const setCheck = (key, status, message) => {
        setChecks(prev => ({
            ...prev,
            [key]: { status, message }
        }));
    };

    const testBackend = async () => {
        setCheck('backend', 'checking', '');
        try {
            const { data } = await safeFetchJson(`${apiBase}/api/health`);
            if (data.ok) {
                setCheck('backend', 'ok', 'Backend OK');
                return true;
            }
            setCheck('backend', 'error', 'Backend ERRORE âEUR” risposta non valida');
            return false;
        } catch (e) {
            setCheck('backend', 'error', `Backend ERRORE âEUR” ${e.message}`);
            return false;
        }
    };

    const testCdp = async () => {
        setCheck('cdp', 'checking', '');
        const targetCdp = cdpUrl === undefined ? 'http://127.0.0.1:9222' : cdpUrl;
        if (targetCdp === '') {
            setCheck('cdp', 'error', 'CDP non disponibile: usa modalità Persistent oppure attendi l’avvio di Chrome.');
            return null;
        }
        try {
            const { data } = await safeFetchJson(`${apiBase}/api/test/cdp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cdpUrl: targetCdp })
            });
            if (data.ok) {
                setCheck('cdp', 'ok', `CDP OK âEUR” Chrome debug attivo (${data.browser || targetCdp})`);
                return true;
            }
            setCheck('cdp', 'error', `CDP ERRORE âEUR” ${data.error || 'Chrome non raggiungibile'} (${data.checkedUrl || targetCdp})`);
            return false;
        } catch (e) {
            setCheck('cdp', 'error', `CDP ERRORE âEUR” ${e.message} su ${targetCdp}`);
            return false;
        }
    };

    const testSofaUrl = async () => {
        setCheck('sofa', 'checking', '');
        if (!matchUrl) {
            setCheck('sofa', 'error', 'Sofa ERRORE âEUR” URL mancante');
            return false;
        }
        try {
            const { data } = await safeFetchJson(`${apiBase}/api/test/sofa-url`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sofaUrl: matchUrl })
            });
            if (data.ok) {
                setCheck('sofa', 'ok', `Sofa OK âEUR” eventId ${data.eventId}`);
                return true;
            }
            setCheck('sofa', 'error', `Sofa ERRORE âEUR” ${data.error || 'eventId non trovato'}`);
            return false;
        } catch (e) {
            setCheck('sofa', 'error', `Sofa ERRORE âEUR” ${e.message}`);
            return false;
        }
    };

    const testBetfairUrl = async () => {
        setCheck('betfair', 'checking', '');
        if (!betfairUrl) {
            setCheck('betfair', 'idle', 'Betfair URL non fornito');
            return null;
        }
        try {
            const { data } = await safeFetchJson(`${apiBase}/api/test/betfair-url`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ betfairUrl })
            });
            if (data.ok) {
                setCheck('betfair', 'ok', `Betfair URL OK âEUR” eventId ${data.eventId}`);
                return true;
            }
            setCheck('betfair', 'error', `Betfair URL ERRORE âEUR” ${data.error || 'URL non valido'}`);
            return false;
        } catch (e) {
            setCheck('betfair', 'error', `Betfair URL ERRORE âEUR” ${e.message}`);
            return false;
        }
    };

    const testGraphUrls = async () => {
        setCheck('graphs', 'checking', '');
        const urls = parseGraphUrls(betfairGraphUrls);
        if (urls.length === 0) {
            setCheck('graphs', 'idle', 'Graph URLs non forniti');
            return null;
        }
        try {
            const { data } = await safeFetchJson(`${apiBase}/api/test/graph-urls`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ graphUrls: urls })
            });
            if (data.ok) {
                const marketId = data.graphs && data.graphs[0] ? data.graphs[0].marketId : null;
                const selectionIds = data.graphs.map(g => g.selectionId).filter(Boolean).join(' / ');
                setCheck('graphs', 'ok', `Graph URLs OK âEUR” marketId ${marketId}, selections ${selectionIds}`);
                return true;
            }
            const firstError = data.graphs && data.graphs.find(g => !g.valid);
            setCheck('graphs', 'error', `Graph URLs ERRORE âEUR” ${firstError ? firstError.error : (data.error || 'formato non valido')}`);
            return false;
        } catch (e) {
            setCheck('graphs', 'error', `Graph URLs ERRORE âEUR” ${e.message}`);
            return false;
        }
    };

    const runAllChecks = async () => {
        await testBackend();
        if (betfairMode === 'cdp') {
            await testCdp();
        } else {
            setCheck('cdp', 'idle', 'CDP non richiesto in modalitÃ  persistent');
        }
        await testSofaUrl();
        await testBetfairUrl();
        await testGraphUrls();
    };


  return {
    testBackend,
    testCdp,
    testSofaUrl,
    testBetfairUrl,
    testGraphUrls,
    runAllChecks
  };
}

