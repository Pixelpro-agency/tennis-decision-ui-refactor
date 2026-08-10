import {
    extractEventId as extractEventIdDefault
} from '../../sofa/extractEventId.js';
import {
    buildSofaAnalysis as buildSofaAnalysisDefault
} from '../../sofa/buildSofaAnalysis.js';

function getErrorMessage(error) {
    return error instanceof Error
    ? error.message
    : String(error);
}

function buildPublicAnalysisError(message) {
    const normalizedMessage = message.toLowerCase();

    if (normalizedMessage.includes('404') || normalizedMessage.includes('not found')) {
        return {
            httpStatus: 404,
            body: {
                code: 'sofa_event_not_found',
                error: 'Evento SofaScore non trovato.'
            }
        };
    }

    if (normalizedMessage.includes('403') || normalizedMessage.includes('blocked')) {
        return {
            httpStatus: 503,
            body: {
                code: 'sofa_access_blocked',
                error: 'SofaScore non disponibile.'
            }
        };
    }

    return {
        httpStatus: 500,
        body: {
            code: 'analysis_failed',
            error: 'Analisi SofaScore non riuscita.'
        }
    };
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
    
    const logDebug = typeof dependencies.logDebug === 'function'
    ? dependencies.logDebug
    : () => {};
    
    const logError = typeof dependencies.logError === 'function'
    ? dependencies.logError
    : console.error;
    
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
            snapshot,
            localContext
        } = await buildSofaAnalysis(eventId);
        
        logDebug(`[Analyze] SUCCESS: Data processed for ${eventId}`);
        
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
        
        return buildPublicAnalysisError(message);
    }
    
}
