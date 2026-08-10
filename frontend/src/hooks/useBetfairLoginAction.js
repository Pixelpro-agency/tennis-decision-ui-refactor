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
        } catch (error) {
            const code = error?.code || 'login_request_failed';
            frontendRuntimeLog('error', 'betfair_login_failed', { code });
            return {
                ok: false,
                code,
                error: 'Unable to open Betfair login.'
            };
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
