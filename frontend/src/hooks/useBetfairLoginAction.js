import { useCallback } from 'react';
import { openBetfairLoginWindow } from '../services/liveSessionApi';
import { buildBetfairLoginRequest } from '../utils/liveSessionRequests.js';

export function useBetfairLoginAction({
    betfairUrl,
    confirmedBetfairUrl,
    betfairMode,
    confirmedBetfairMode,
    chromeProfilePath,
    confirmedChromeProfilePath,
    cdpUrl,
    confirmedCdpUrl
}) {
    return useCallback(async () => {
        const loginRequest = buildBetfairLoginRequest({
            betfairUrl,
            confirmedBetfairUrl,
            betfairMode,
            confirmedBetfairMode,
            chromeProfilePath,
            confirmedChromeProfilePath,
            cdpUrl,
            confirmedCdpUrl
        });

        if (!loginRequest) {
            return;
        }

        try {
            await openBetfairLoginWindow(loginRequest);
        } catch (error) {
            console.error('Failed to open Betfair login window:', error);
        }
    }, [
        betfairUrl,
        confirmedBetfairUrl,
        betfairMode,
        confirmedBetfairMode,
        chromeProfilePath,
        confirmedChromeProfilePath,
        cdpUrl,
        confirmedCdpUrl
    ]);
}
