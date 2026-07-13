export function buildAnalysisSessionUpdate({
    sofaUrl,
    betfairUrl,
    betfairGraphUrls,
    betfairMode,
    chromeProfileInput,
    fullChromeProfilePath,
    cdpUrl
} = {}) {
    return {
        current: {
            matchUrl: sofaUrl,
            betfairUrl,
            betfairGraphUrls,
            betfairMode,
            chromeProfilePath: chromeProfileInput,
            cdpUrl
        },
        confirmed: {
            url: sofaUrl,
            betfairUrl,
            betfairGraphUrls,
            betfairMode,
            chromeProfilePath: fullChromeProfilePath,
            cdpUrl
        }
    };
}