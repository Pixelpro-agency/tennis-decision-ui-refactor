import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { readRecentLogLines } from './betfair/logReader.js';
import { openBetfairLoginWindow } from './betfair/loginWindow.js';
import {
    buildLatestBetfairPayload,
    buildBetfairJsonResponse
} from './betfair/latestPayload.js';
import { buildBetfairOddsResponse } from './betfair/oddsResponse.js';
import { getMatchPersistenceIntegrity } from '../sofa/matchHistory.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOG_FILE = path.join(__dirname, '..', '..', 'betfair_debug.log');

const router = express.Router();

router.get('/:eventId/latest', async (req, res) => {
    const { eventId } = req.params;
    const mode = req.query.mode || '';
    const cdpUrl = req.query.cdpUrl || '';

    const result = await buildLatestBetfairPayload({
        eventId,
        mode,
        cdpUrl,
        dependencies: {
            getMatchPersistenceIntegrity
        }
    });

    return res.status(result.httpStatus).json(result.body);

});

router.get('/:eventId/json', (req, res) => {
    const { eventId } = req.params;
    const result = buildBetfairJsonResponse(
        eventId,
        { getMatchPersistenceIntegrity }
    );

    return res.status(result.httpStatus).json(result.body);

});

router.get('/log', (req, res) => {
    try {
        const lines = readRecentLogLines(LOG_FILE);

        return res.json({ lines });
    } catch (error) {
        return res.status(500).json({
            error: error.message
        });
    }

});

router.post('/login-window', (req, res) => {
    const {
        url,
        mode = 'persistent',
        profileDir = '',
        cdpUrl = ''
    } = req.body;

    if (!url) {
        return res.status(400).json({
            error: 'Missing Betfair URL'
        });
    }

    const scraperPath = path.join(
        __dirname,
        '..',
        '..',
        '..',
        'betfair_scraper.py'
    );

    if (!fs.existsSync(scraperPath)) {
        return res.status(500).json({
            error: `Scraper not found: ${scraperPath}`
        });
    }

    openBetfairLoginWindow({
        scraperPath,
        url,
        mode,
        profileDir,
        cdpUrl
    });

    return res.json({
        ok: true,
        message: 'Login window opened. Log in and close it when done.'
    });

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
