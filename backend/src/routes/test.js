import express from 'express';
import { extractEventId } from '../sofa/extractEventId.js';
import { validateGraphUrls } from './test/graphUrlValidation.js';

const router = express.Router();

router.get('/health', (req, res) => {
    res.json({
        ok: true,
        service: 'backend',
        timestamp: new Date().toISOString()
    });
});

router.post('/cdp', async (req, res) => {
    const cdpUrl = (req.body && req.body.cdpUrl) || 'http://127.0.0.1:9222';
    const normalizedCdpUrl = String(cdpUrl).trim().replace(/\/+$/, '');
    const checkedUrl = `${normalizedCdpUrl}/json/version`;
    
    try {
        const response = await fetch(checkedUrl);
        const text = await response.text();
        
        if (text.trim() === '') {
            return res.json({
                ok: false,
                cdpUrl: normalizedCdpUrl,
                checkedUrl,
                webSocketDebuggerUrl: false,
                error: 'Empty response from CDP'
            });
        }
        
        let data;
        try {
            data = JSON.parse(text);
        } catch (parseErr) {
            const snippet = text.slice(0, 300);
            return res.json({
                ok: false,
                cdpUrl: normalizedCdpUrl,
                checkedUrl,
                webSocketDebuggerUrl: false,
                error: 'Invalid JSON from CDP',
                snippet
            });
        }
        
        if (!response.ok) {
            return res.json({
                ok: false,
                cdpUrl: normalizedCdpUrl,
                checkedUrl,
                status: response.status,
                webSocketDebuggerUrl: false,
                error: `CDP returned HTTP ${response.status}`
            });
        }
        
        if (data.webSocketDebuggerUrl) {
            return res.json({
                ok: true,
                cdpUrl: normalizedCdpUrl,
                checkedUrl,
                webSocketDebuggerUrl: true,
                browser: data.Browser || null
            });
        }
        
        return res.json({
            ok: false,
            cdpUrl: normalizedCdpUrl,
            checkedUrl,
            webSocketDebuggerUrl: false,
            browser: data.Browser || null,
            error: 'CDP endpoint reached but webSocketDebuggerUrl is missing'
        });
    } catch (error) {
        return res.json({
            ok: false,
            cdpUrl: normalizedCdpUrl,
            checkedUrl,
            webSocketDebuggerUrl: false,
            error: error.message || 'CDP unreachable'
        });
    }
});

router.post('/sofa-url', (req, res) => {
    const { sofaUrl } = req.body || {};
    const eventId = extractEventId(sofaUrl);
    
    if (!eventId) {
        return res.json({
            ok: false,
            error: 'Could not extract SofaScore eventId'
        });
    }
    
    res.json({
        ok: true,
        eventId
    });
});

router.post('/betfair-url', (req, res) => {
    const { betfairUrl } = req.body || {};
    
    if (!betfairUrl || typeof betfairUrl !== 'string') {
        return res.json({
            ok: false,
            error: 'Betfair URL missing'
        });
    }
    
    let parsed;
    try {
        parsed = new URL(betfairUrl);
    } catch (error) {
        return res.json({
            ok: false,
            error: 'Invalid URL format'
        });
    }
    
    const isBetfair = /betfair\.\w+$/i.test(parsed.hostname);
    if (!isBetfair) {
        return res.json({
            ok: false,
            error: 'Not a Betfair domain'
        });
    }
    
    const slugMatch = parsed.pathname.match(/-([\d]{6,})(?:\/|$)/);
    const eventId = slugMatch ? slugMatch[1] : null;
    
    if (!eventId) {
        return res.json({
            ok: false,
            betfairUrl,
            domain: parsed.hostname,
            error: 'Could not extract numeric event id from URL slug'
        });
    }
    
    res.json({
        ok: true,
        betfairUrl,
        domain: parsed.hostname,
        eventId
    });
});

router.post('/graph-urls', (req, res) => {
    const { graphUrls } = req.body || {};
    
    res.json(validateGraphUrls(graphUrls));
});

export default router;