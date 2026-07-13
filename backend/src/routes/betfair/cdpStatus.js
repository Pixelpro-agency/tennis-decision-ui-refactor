export async function checkCdpStatus(mode, cdpUrl) {
    if (mode !== 'cdp' || !cdpUrl) {
        return null;
    }
    
    try {
        const normalized = cdpUrl.replace(/\/$/, '');
        const url = `${normalized}/json/version`;
        
        if (typeof AbortController !== 'undefined') {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 1500);
            
            try {
                const response = await fetch(url, {
                    signal: controller.signal
                });
                
                return response.ok === true;
            } finally {
                clearTimeout(timeout);
            }
        }
        
        const response = await fetch(url);
        
        return response.ok === true;
    } catch (_) {
        return false;
    }
    
}
