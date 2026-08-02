import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { openBetfairLoginWindow } from './betfair/loginWindowLifecycle.js';
import {
    buildLatestBetfairPayload,
    buildBetfairJsonResponse
} from './betfair/latestPayload.js';
import { buildBetfairOddsResponse } from './betfair/oddsResponse.js';
import { getMatchPersistenceIntegrity } from '../sofa/matchHistory.js';
import { classifyCdpBaseUrl } from '../utils/cdpUrl.js';
import { readBoundedRuntimeLog } from '../runtime/runtimeLogger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOG_FILE = path.join(__dirname, '..', '..', 'betfair_scraper.log');
const router = express.Router();

router.get('/:eventId/latest', async (req, res) => {
    const { eventId } = req.params;
    const mode = req.query.mode || '';
    const cdpUrl = req.query.cdpUrl || '';
    const result = await buildLatestBetfairPayload({
        eventId,
        mode,
        cdpUrl,
        dependencies: { getMatchPersistenceIntegrity }
    });
    return res.status(result.httpStatus).json(result.body);
});

router.get('/:eventId/json', (req, res) => {
    const result = buildBetfairJsonResponse(
        req.params.eventId,
        { getMatchPersistenceIntegrity }
    );
    return res.status(result.httpStatus).json(result.body);
});

export function handleBetfairLogRequest(_req, res, dependencies = {}) {
    const readLog = dependencies.readBoundedRuntimeLog || readBoundedRuntimeLog;
    const filePath = dependencies.logFile || LOG_FILE;
    res.setHeader('Cache-Control', 'no-store');
    const result = readLog(filePath, { maxLines: 200, maxLineLength: 1000 });
    return res.status(200).json({
        lines: Array.isArray(result?.lines) ? result.lines : [],
        status: result?.status || 'read_failed'
    });
}

router.get('/log', (req, res) => handleBetfairLogRequest(req, res));

export function normalizeBetfairLoginTarget(value) {
    if (value === undefined || value === null) return '';
    if (typeof value !== 'string') return null;
    const normalized = value.trim();
    if (!normalized) return '';
    try {
        const parsed = new URL(normalized);
        const hostname = parsed.hostname.toLowerCase();
        const allowedHost = hostname === 'betfair.it' ||
            hostname.endsWith('.betfair.it');
        if (
            !['http:', 'https:'].includes(parsed.protocol) ||
            !allowedHost ||
            parsed.username ||
            parsed.password
        ) return null;
        return normalized;
    } catch (_error) {
        return null;
    }
}

export async function buildBetfairLoginWindowResponse(
    payload = {},
    dependencies = {}
) {
    const existsSync = dependencies.existsSync || fs.existsSync;
    const openWindow = dependencies.openBetfairLoginWindow ||
        openBetfairLoginWindow;
    const scraperPath = dependencies.scraperPath || path.join(
        __dirname,
        '..',
        '..',
        '..',
        'betfair_scraper.py'
    );
    const target = normalizeBetfairLoginTarget(payload.url);

    if (target === '') {
        return {
            httpStatus: 200,
            body: {
                ok: true,
                status: 'no_target',
                opened: false,
                reused: false
            }
        };
    }
    if (target === null) {
        return {
            httpStatus: 400,
            body: {
                ok: false,
                code: 'betfair_url_invalid',
                error: 'Invalid Betfair URL'
            }
        };
    }

    const mode = payload.mode === 'cdp' ? 'cdp' : 'persistent';
    let normalizedCdpUrl = '';
    if (mode === 'cdp') {
        const classified = classifyCdpBaseUrl(payload.cdpUrl);
        if (!classified.ok) {
            return {
                httpStatus: 400,
                body: {
                    ok: false,
                    code: classified.code,
                    error: classified.code === 'cdp_url_required'
                        ? 'CDP URL required'
                        : 'Invalid CDP URL'
                }
            };
        }
        normalizedCdpUrl = classified.value;
    }

    if (!existsSync(scraperPath)) {
        return {
            httpStatus: 500,
            body: {
                ok: false,
                code: 'scraper_not_found',
                error: 'Betfair scraper not available'
            }
        };
    }

    try {
        const result = await openWindow({
            scraperPath,
            url: target,
            mode,
            profileDir: typeof payload.profileDir === 'string'
                ? payload.profileDir.trim()
                : '',
            cdpUrl: normalizedCdpUrl
        });
        return { httpStatus: 200, body: result };
    } catch (error) {
        if (error?.code === 'login_runtime_conflict') {
            return {
                httpStatus: 409,
                body: {
                    ok: false,
                    code: 'login_runtime_conflict',
                    error: 'An incompatible login session is already active.'
                }
            };
        }
        if (error?.code === 'cdp_url_required' || error?.code === 'cdp_url_invalid') {
            return {
                httpStatus: 400,
                body: { ok: false, code: error.code, error: error.code }
            };
        }
        return {
            httpStatus: 500,
            body: {
                ok: false,
                code: 'login_spawn_failed',
                error: 'Unable to open Betfair login window.'
            }
        };
    }
}

router.post('/login-window', async (req, res) => {
    const result = await buildBetfairLoginWindowResponse(req.body || {});
    return res.status(result.httpStatus).json(result.body);
});

router.get('/odds', async (req, res) => {
    const result = await buildBetfairOddsResponse(req.query);
    if (result.contentType) {
        res.setHeader('content-type', result.contentType);
    }
    if (result.jsonBody) {
        return res.status(result.httpStatus).json(result.jsonBody);
    }
    return res.status(result.httpStatus).send(result.serializedBody);
});

export default router;
