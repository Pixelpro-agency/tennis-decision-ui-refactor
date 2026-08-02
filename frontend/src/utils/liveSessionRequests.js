import { normalizeCdpStateValue } from './cdpUrl.js';

function hasOwn(object, key) {
    return Object.prototype.hasOwnProperty.call(object, key);
}

function selectCdpUrl(input) {
    if (hasOwn(input, 'cdpUrl') && input.cdpUrl !== undefined) {
        return normalizeCdpStateValue(input.cdpUrl);
    }
    if (
        hasOwn(input, 'confirmedCdpUrl') &&
        input.confirmedCdpUrl !== undefined
    ) {
        return normalizeCdpStateValue(input.confirmedCdpUrl);
    }
    return '';
}

export function buildBetfairLoginRequest(input = {}) {
    const url = input.betfairUrl || input.confirmedBetfairUrl || '';
    const mode = input.betfairMode ||
        input.confirmedBetfairMode ||
        'persistent';
    const request = { url, mode };

    if (mode === 'persistent') {
        request.profileDir = input.chromeProfilePath ||
            input.confirmedChromeProfilePath ||
            '';
    } else if (mode === 'cdp') {
        request.cdpUrl = selectCdpUrl(input);
    }
    return request;
}

export function buildMatchTrackingRequest(input = {}) {
    const request = {
        sofaUrl: input.sofaUrl,
        betfairUrl: input.betfairUrl,
        betfairGraphUrls: input.betfairGraphUrls,
        betfairMode: input.betfairMode
    };
    if (input.betfairMode === 'persistent') {
        request.chromeProfilePath = input.chromeProfilePath;
    } else if (input.betfairMode === 'cdp') {
        request.cdpUrl = selectCdpUrl(input);
    }
    return request;
}
