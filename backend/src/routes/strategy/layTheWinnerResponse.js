export function normalizeLayTheWinnerRequest(rawUrl, extractEventId) {
    const url = typeof rawUrl === 'string'
    ? rawUrl.trim()
    : '';
    
    if (!url) {
        return {
            ok: false,
            httpStatus: 400,
            body: {
                error: 'URL mancante. Usa ?url=<sofascoreMatchUrl>'
            }
        };
    }
    
    const eventId = extractEventId(url);
    
    if (!eventId) {
        return {
            ok: false,
            httpStatus: 400,
            body: {
                error: 'URL non valido o eventId non trovato'
            }
        };
    }
    
    return {
        ok: true,
        url,
        eventId
    };
    
}

export function buildLayTheWinnerErrorResponse(error) {
    const message = error instanceof Error
    ? error.message
    : String(error);
    
    let httpStatus = 500;
    
    if (message.includes('404') || message.includes('not found')) {
        httpStatus = 404;
    }
    
    if (message.includes('403') || message.includes('blocked')) {
        httpStatus = 503;
    }
    
    return {
        httpStatus,
        body: {
            error: message
        }
    };
    
}
