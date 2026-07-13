import { useCallback, useState } from 'react';
import { buildAnalysisSessionUpdate } from '../utils/analysisSessionState.js';

export function useAnalysisSessionState() {
    const [matchUrl, setMatchUrl] = useState('');
    const [betfairUrl, setBetfairUrl] = useState('');
    const [betfairGraphUrls, setBetfairGraphUrls] = useState('');
    const [betfairMode, setBetfairMode] = useState('persistent');
    const [chromeProfilePath, setChromeProfilePath] = useState('');
    const [chromeProfileName, setChromeProfileName] = useState('Default');
    const [cdpUrl, setCdpUrl] = useState((import.meta.env.VITE_CDP_URL !== undefined ? import.meta.env.VITE_CDP_URL : 'http://127.0.0.1:9222'));

    const [confirmedUrl, setConfirmedUrl] = useState('');
    const [confirmedBetfairUrl, setConfirmedBetfairUrl] = useState('');
    const [confirmedBetfairGraphUrls, setConfirmedBetfairGraphUrls] = useState('');
    const [confirmedBetfairMode, setConfirmedBetfairMode] = useState('persistent');
    const [confirmedChromeProfilePath, setConfirmedChromeProfilePath] = useState('');
    const [confirmedChromeProfileName, setConfirmedChromeProfileName] = useState('Default');
    const [confirmedCdpUrl, setConfirmedCdpUrl] = useState((import.meta.env.VITE_CDP_URL !== undefined ? import.meta.env.VITE_CDP_URL : 'http://127.0.0.1:9222'));

    const applySearchSession = useCallback(({
        sofaUrl,
        betfairUrl: nextBetfairUrl,
        betfairGraphUrls: nextBetfairGraphUrls,
        betfairMode: nextBetfairMode,
        chromeProfileInput,
        fullChromeProfilePath,
        cdpUrl: nextCdpUrl
    }) => {
        const sessionUpdate = buildAnalysisSessionUpdate({
            sofaUrl,
            betfairUrl: nextBetfairUrl,
            betfairGraphUrls: nextBetfairGraphUrls,
            betfairMode: nextBetfairMode,
            chromeProfileInput,
            fullChromeProfilePath,
            cdpUrl: nextCdpUrl
        });

        setConfirmedUrl(sessionUpdate.confirmed.url);
        setMatchUrl(sessionUpdate.current.matchUrl);
        setConfirmedBetfairUrl(sessionUpdate.confirmed.betfairUrl);
        setBetfairUrl(sessionUpdate.current.betfairUrl);
        setConfirmedBetfairGraphUrls(sessionUpdate.confirmed.betfairGraphUrls);
        setBetfairGraphUrls(sessionUpdate.current.betfairGraphUrls);
        setConfirmedBetfairMode(sessionUpdate.confirmed.betfairMode);
        setBetfairMode(sessionUpdate.current.betfairMode);
        setConfirmedChromeProfilePath(sessionUpdate.confirmed.chromeProfilePath);
        setChromeProfilePath(sessionUpdate.current.chromeProfilePath);
        setConfirmedCdpUrl(sessionUpdate.confirmed.cdpUrl);
        setCdpUrl(sessionUpdate.current.cdpUrl);
    }, []);

    const clearConfirmedSession = useCallback(() => {
        setConfirmedUrl('');
        setConfirmedBetfairUrl('');
        setConfirmedBetfairGraphUrls('');
        setConfirmedBetfairMode('persistent');
        setConfirmedChromeProfilePath('');
        setConfirmedCdpUrl((import.meta.env.VITE_CDP_URL !== undefined ? import.meta.env.VITE_CDP_URL : 'http://127.0.0.1:9222'));
    }, []);

    return {
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
        setChromeProfileName,
        cdpUrl,
        setCdpUrl,
        confirmedUrl,
        setConfirmedUrl,
        confirmedBetfairUrl,
        setConfirmedBetfairUrl,
        confirmedBetfairGraphUrls,
        setConfirmedBetfairGraphUrls,
        confirmedBetfairMode,
        setConfirmedBetfairMode,
        confirmedChromeProfilePath,
        setConfirmedChromeProfilePath,
        confirmedChromeProfileName,
        setConfirmedChromeProfileName,
        confirmedCdpUrl,
        setConfirmedCdpUrl,
        applySearchSession,
        clearConfirmedSession
    };
}