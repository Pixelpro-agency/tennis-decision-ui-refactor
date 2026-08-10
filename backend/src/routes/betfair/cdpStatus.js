import { classifyCdpBaseUrl } from '../../utils/cdpUrl.js';

export async function checkCdpStatus(mode, cdpUrl, dependencies = {}) {
    if (mode !== 'cdp' || !cdpUrl) {
        return null;
    }

    const classified = classifyCdpBaseUrl(cdpUrl);
    if (!classified.ok) {
        return false;
    }

    const fetchImpl = typeof dependencies.fetch === 'function'
        ? dependencies.fetch
        : fetch;

    try {
        const url = `${classified.value}/json/version`;
        
        if (typeof AbortController !== 'undefined') {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 1500);
            
            try {
                const response = await fetchImpl(url, {
                    signal: controller.signal
                });
                
                return response.ok === true;
            } finally {
                clearTimeout(timeout);
            }
        }
        
        const response = await fetchImpl(url);
        
        return response.ok === true;
    } catch (_) {
        return false;
    }
    
}
