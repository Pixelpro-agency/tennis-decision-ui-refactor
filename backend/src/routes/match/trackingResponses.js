import {
    extractEventId as extractEventIdDefault
} from '../../sofa/extractEventId.js';
import {
    trackMatch as trackMatchDefault,
    untrackMatch as untrackMatchDefault,
    stopAllMatchTrackers as stopAllMatchTrackersDefault
} from '../../sofa/matchTracker.js';
import {
    terminateActiveBetfairScrapers as terminateActiveBetfairScrapersDefault
} from '../../sofa/betfairFetch.js';

export function buildTrackMatchResponse(
    payload = {},
    dependencies = {}
) {
    const extractEventId =
    typeof dependencies.extractEventId === 'function'
    ? dependencies.extractEventId
    : extractEventIdDefault;
    
    const trackMatch =
    typeof dependencies.trackMatch === 'function'
    ? dependencies.trackMatch
    : trackMatchDefault;
    
    const log = typeof dependencies.log === 'function'
    ? dependencies.log
    : console.log;
    
    const {
        sofaUrl,
        betfairUrl,
        betfairGraphUrls,
        chromeProfilePath,
        betfairMode,
        cdpUrl
    } = payload;
    
    if (!sofaUrl) {
        return {
            httpStatus: 400,
            body: {
                error: 'URL SofaScore mancante'
            }
        };
    }
    
    const eventId = extractEventId(sofaUrl);
    
    if (!eventId) {
        return {
            httpStatus: 400,
            body: {
                error: 'URL non valido o eventId non trovato'
            }
        };
    }
    
    const mode = betfairMode === 'persistent' || betfairMode === 'cdp'
    ? betfairMode
    : 'persistent';
    
    if (mode === 'cdp' && (!cdpUrl || !String(cdpUrl).trim())) {
        return {
            httpStatus: 400,
            body: {
                error: 'CDP non disponibile. Seleziona Profilo Persistent o attendi Chrome.'
            }
        };
    }
    
    const cdp = mode === 'cdp'
    ? cdpUrl
    : cdpUrl || '';
    
    const graphUrlCount = String(betfairGraphUrls || '')
    .split('\n')
    .filter(Boolean)
    .length;
    
    log(
        `[MatchRoute] track eventId=${eventId} betfairMode=${mode} hasBetfairUrl=${Boolean(betfairUrl)} graphUrls=${graphUrlCount}`
    );
    
    trackMatch(
        sofaUrl,
        betfairUrl || '',
        betfairGraphUrls || '',
        chromeProfilePath || '',
        mode,
        cdp
    );
    
    return {
        httpStatus: 200,
        body: {
            ok: true,
            eventId
        }
    };
    
}

export function buildUntrackMatchResponse(
    payload = {},
    dependencies = {}
) {
    const untrackMatch =
    typeof dependencies.untrackMatch === 'function'
    ? dependencies.untrackMatch
    : untrackMatchDefault;
    
    const eventId = payload.eventId;
    
    untrackMatch(eventId);
    
    return {
        httpStatus: 200,
        body: {
            ok: true
        }
    };
    
}

export function buildStopMatchResponse(
    payload = {},
    dependencies = {}
) {
    const stopAllMatchTrackers =
    typeof dependencies.stopAllMatchTrackers === 'function'
    ? dependencies.stopAllMatchTrackers
    : stopAllMatchTrackersDefault;
    
    const terminateActiveBetfairScrapers =
    typeof dependencies.terminateActiveBetfairScrapers === 'function'
    ? dependencies.terminateActiveBetfairScrapers
    : terminateActiveBetfairScrapersDefault;
    
    const logError = typeof dependencies.logError === 'function'
    ? dependencies.logError
    : console.error;
    
    const eventId = payload.eventId || null;
    
    try {
        stopAllMatchTrackers();
    } catch (error) {
        logError('[MatchRoute] stopAllMatchTrackers cleanup error:', error);
    }
    
    try {
        terminateActiveBetfairScrapers();
    } catch (error) {
        logError('[MatchRoute] terminateActiveBetfairScrapers cleanup error:', error);
    }
    
    return {
        httpStatus: 200,
        body: {
            ok: true,
            eventId,
            stopped: true,
            scope: 'all-live-tracking'
        }
    };
    
}
