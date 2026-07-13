import {
    extractEventId as extractEventIdDefault
} from '../../sofa/extractEventId.js';
import {
    buildSofaAnalysis as buildSofaAnalysisDefault
} from '../../sofa/buildSofaAnalysis.js';
import {
    addSofaUpdate as addSofaUpdateDefault
} from '../../sofa/matchHistory.js';

function getErrorMessage(error) {
    return error instanceof Error
    ? error.message
    : String(error);
}

function getErrorStatus(message) {
    if (message.includes('404') || message.includes('not found')) {
        return 404;
    }
    
    if (message.includes('403') || message.includes('blocked')) {
        return 503;
    }
    
    return 500;
    
}

function getHistoryDate(eventData, now) {
    const startTimestamp = eventData?.event?.startTimestamp;
    
    if (startTimestamp) {
        return new Date(startTimestamp * 1000)
        .toISOString()
        .split('T')[0];
    }
    
    return now.toISOString().split('T')[0];
    
}

export async function buildMatchAnalysisResponse(
    payload = {},
    dependencies = {}
) {
    const extractEventId =
    typeof dependencies.extractEventId === 'function'
    ? dependencies.extractEventId
    : extractEventIdDefault;
    
    const buildSofaAnalysis =
    typeof dependencies.buildSofaAnalysis === 'function'
    ? dependencies.buildSofaAnalysis
    : buildSofaAnalysisDefault;
    
    const addSofaUpdate =
    typeof dependencies.addSofaUpdate === 'function'
    ? dependencies.addSofaUpdate
    : addSofaUpdateDefault;
    
    const logDebug = typeof dependencies.logDebug === 'function'
    ? dependencies.logDebug
    : () => {};
    
    const logError = typeof dependencies.logError === 'function'
    ? dependencies.logError
    : console.error;
    
    const now = dependencies.now instanceof Date
    ? dependencies.now
    : new Date();
    
    const url = typeof payload.url === 'string'
    ? payload.url.trim()
    : '';
    
    logDebug(`[Analyze] New POST Request for URL: ${url}`);
    
    if (!url) {
        return {
            httpStatus: 400,
            body: {
                error: 'URL mancante'
            }
        };
    }
    
    const eventId = extractEventId(url);
    
    logDebug(`[Analyze] Extracted ID: ${eventId}`);
    
    if (!eventId) {
        return {
            httpStatus: 400,
            body: {
                error: 'URL non valido o eventId non trovato'
            }
        };
    }
    
    try {
        logDebug('[Analyze] Starting SofaScore analysis');
        
        const {
            eventData,
            snapshot,
            localContext
        } = await buildSofaAnalysis(eventId);
        
        logDebug(`[Analyze] SUCCESS: Data processed for ${eventId}`);
        
        try {
            const tournamentName = eventData?.event?.tournament?.name
            || 'unknown_tournament';
            
            const dateStr = getHistoryDate(eventData, now);
            
            const historyResult = addSofaUpdate(
                eventId,
                snapshot,
                tournamentName,
                dateStr,
                {
                    snapshot,
                    localContext
                }
            );

            if (!historyResult?.ok) {
                const reason = historyResult?.reason || 'write_failed';
                logDebug(
                    `[Analyze] Match History Save Failed eventId=${eventId} reason=${reason}`
                );
            }
        } catch (historyError) {
            logDebug(
                `[Analyze] Match History Save Error: ${getErrorMessage(historyError)}`
            );
        }
        
        return {
            httpStatus: 200,
            body: {
                snapshot,
                localContext
            }
        };
    } catch (error) {
        const message = getErrorMessage(error);
        
        logDebug(`[Analyze] ERROR: ${message}`);
        logError('Match analyze error:', error);
        
        return {
            httpStatus: getErrorStatus(message),
            body: {
                error: message
            }
        };
    }
    
}
