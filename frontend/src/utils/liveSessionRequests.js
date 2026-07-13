const DEFAULT_CDP_URL = 'http://127.0.0.1:9222';

function selectCdpUrl(cdpUrl, confirmedCdpUrl) {
    if (cdpUrl !== undefined) {
        return cdpUrl;
    }

    if (confirmedCdpUrl !== undefined) {
        return confirmedCdpUrl;
    }

    return DEFAULT_CDP_URL;
}

export function buildBetfairLoginRequest({
    betfairUrl,
    confirmedBetfairUrl,
    betfairMode,
    confirmedBetfairMode,
    chromeProfilePath,
    confirmedChromeProfilePath,
    cdpUrl,
    confirmedCdpUrl
} = {}) {
    const url = betfairUrl || confirmedBetfairUrl;

    if (!url) {
        return null;
    }

    return {
        url,
        mode: betfairMode || confirmedBetfairMode,
        profileDir: chromeProfilePath || confirmedChromeProfilePath,
        cdpUrl: selectCdpUrl(cdpUrl, confirmedCdpUrl)
    };
}

export function buildMatchTrackingRequest({
    sofaUrl,
    betfairUrl,
    betfairGraphUrls,
    betfairMode,
    chromeProfilePath,
    cdpUrl
} = {}) {
    return {
        sofaUrl,
        betfairUrl,
        betfairGraphUrls,
        betfairMode,
        chromeProfilePath,
        cdpUrl
    };
}