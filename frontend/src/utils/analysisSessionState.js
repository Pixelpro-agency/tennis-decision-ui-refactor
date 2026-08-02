import { normalizeCdpStateValue } from './cdpUrl.js';

export function buildAnalysisSessionUpdate({
    sofaUrl,
    betfairUrl,
    betfairGraphUrls,
    betfairMode,
    chromeProfileInput,
    fullChromeProfilePath,
    cdpUrl
} = {}) {
    const normalizedCdpUrl = normalizeCdpStateValue(cdpUrl);

    return {
        current: {
            matchUrl: sofaUrl,
            betfairUrl,
            betfairGraphUrls,
            betfairMode,
            chromeProfilePath: chromeProfileInput,
            cdpUrl: normalizedCdpUrl
        },
        confirmed: {
            url: sofaUrl,
            betfairUrl,
            betfairGraphUrls,
            betfairMode,
            chromeProfilePath: fullChromeProfilePath,
            cdpUrl: normalizedCdpUrl
        }
    };
}
