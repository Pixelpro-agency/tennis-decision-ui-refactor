import { useCallback } from 'react';
import { openBetfairLoginWindow } from '../services/liveSessionApi';
import { buildBetfairLoginRequest } from '../utils/liveSessionRequests.js';
import { frontendRuntimeLog } from '../utils/runtimeLog.js';

export function useBetfairLoginAction(input) {
    const {
        betfairUrl,
        confirmedBetfairUrl,
        betfairMode,
        confirmedBetfairMode,
        chromeProfilePath,
        confirmedChromeProfilePath,
        cdpUrl,
        confirmedCdpUrl
    } = input;

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
        try {
            return await openBetfairLoginWindow(loginRequest);
        } catch (_error) {
            frontendRuntimeLog('error', 'betfair_login_failed', { code: 'login_request_failed' });
            return null;
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
