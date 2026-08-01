import express from 'express';
import { extractEventId } from '../sofa/extractEventId.js';
import { validateGraphUrls } from './test/graphUrlValidation.js';
import { classifyCdpBaseUrl, buildCdpVersionUrl } from '../utils/cdpUrl.js';

const router = express.Router();

router.get('/health', (req, res) => {
    res.json({
        ok: true,
        service: 'backend',
        timestamp: new Date().toISOString()
    });
});

export async function handleCdpTestRequest(
    req,
    res,
    dependencies = {}
) {
    const fetchFn = dependencies.fetchFn || fetch;
    const classified = classifyCdpBaseUrl(req.body?.cdpUrl);

    if (!classified.ok) {
        return res.status(400).json({
            ok: false,
            code: classified.code,
            error: classified.code === 'cdp_url_required'
                ? 'CDP URL required'
                : 'Invalid CDP URL'
        });
    }

    const normalizedCdpUrl = classified.value;
    const checkedUrl = buildCdpVersionUrl(normalizedCdpUrl);

    try {
        const response = await fetchFn(checkedUrl);
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
        } catch (_) {
            return res.json({
                ok: false,
                cdpUrl: normalizedCdpUrl,
                checkedUrl,
                webSocketDebuggerUrl: false,
                error: 'Invalid JSON from CDP'
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
    } catch (_) {
        return res.json({
            ok: false,
            cdpUrl: normalizedCdpUrl,
            checkedUrl,
            webSocketDebuggerUrl: false,
            error: 'CDP unreachable'
        });
    }
}

router.post('/cdp', handleCdpTestRequest);

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