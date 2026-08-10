import express from 'express';
import { validateGraphUrls } from './test/graphUrlValidation.js';
import { classifyCdpBaseUrl, buildCdpVersionUrl } from '../utils/cdpUrl.js';
import { classifySofaUrl } from '../utils/sofaUrl.js';
import { classifyBetfairUrl } from '../utils/betfairUrl.js';
import { fetchWithTimeout, FetchTimeoutError } from '../utils/fetchWithTimeout.js';

const router = express.Router();

export async function handleCdpTestRequest(
    req,
    res,
    dependencies = {}
) {
    const fetchFn = dependencies.fetchFn || fetch;
    const timeoutMs = dependencies.timeoutMs || 4000;
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
        const response = await fetchWithTimeout(fetchFn, checkedUrl, {}, timeoutMs);
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
    } catch (error) {
        return res.json({
            ok: false,
            code: error instanceof FetchTimeoutError ? 'cdp_timeout' : 'cdp_unreachable',
            cdpUrl: normalizedCdpUrl,
            checkedUrl,
            webSocketDebuggerUrl: false,
            error: 'CDP unreachable'
        });
    }
}

router.post('/cdp', handleCdpTestRequest);

export function handleSofaUrlTestRequest(req, res) {
    const { sofaUrl } = req.body || {};
    const result = classifySofaUrl(sofaUrl);
    if (!result.ok) {
        return res.json({
            ok: false,
            code: result.code,
            error: 'Invalid SofaScore URL'
        });
    }
    return res.json({
        ok: true,
        eventId: result.eventId
    });
}

router.post('/sofa-url', handleSofaUrlTestRequest);

export function handleBetfairUrlTestRequest(req, res) {
    const { betfairUrl } = req.body || {};
    const result = classifyBetfairUrl(betfairUrl, { requireEventId: true });
    if (!result.ok) {
        return res.json({
            ok: false,
            code: result.code,
            error: 'Invalid Betfair URL'
        });
    }
    return res.json({
        ok: true,
        betfairUrl: result.value,
        domain: result.hostname,
        eventId: result.eventId
    });
}

router.post('/betfair-url', handleBetfairUrlTestRequest);

router.post('/graph-urls', (req, res) => {
    const { graphUrls } = req.body || {};
    
    res.json(validateGraphUrls(graphUrls));
});

export default router;
