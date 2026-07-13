import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
    buildDebugLastResponse,
    buildMatchHistoryResponse,
    buildSofaTimelineResponse
} from './match/readResponses.js';
import { getMatchPersistenceIntegrity } from '../sofa/matchHistory.js';
import {
    buildStopMatchResponse,
    buildTrackMatchResponse,
    buildUntrackMatchResponse
} from './match/trackingResponses.js';
import {
    buildMatchAnalysisResponse
} from './match/analysisResponse.js';
import {
    buildSourceIdentityStatusResponse
} from './match/sourceIdentityStatusResponse.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOG_FILE = path.join(__dirname, '..', '..', 'backend_debug.log');

const router = express.Router();

function logDebug(message) {
    const time = new Date().toISOString();
    fs.appendFileSync(LOG_FILE, `[${time}] ${message}\n`);
}

let lastDebugData = null;

router.get('/debug-last', (req, res) => {
    return res.json(buildDebugLastResponse(lastDebugData));
});

router.get('/:eventId/source-identity-status', (req, res) => {
    const { eventId } = req.params;
    const result = buildSourceIdentityStatusResponse(eventId);
    
    return res.status(result.httpStatus).json(result.body);
});

router.get('/:eventId/history', (req, res) => {
    const { eventId } = req.params;
    const result = buildMatchHistoryResponse(
        eventId,
        { getMatchPersistenceIntegrity }
    );

    return res.status(result.httpStatus).json(result.body);

});

router.get('/:eventId/json', (req, res) => {
    const { eventId } = req.params;
    const result = buildSofaTimelineResponse(
        eventId,
        { getMatchPersistenceIntegrity }
    );

    return res.status(result.httpStatus).json(result.body);

});

router.post('/track', (req, res) => {
    const result = buildTrackMatchResponse(req.body || {});
    
    return res.status(result.httpStatus).json(result.body);
    
});

router.post('/untrack', (req, res) => {
    const result = buildUntrackMatchResponse(req.body || {});
    
    return res.status(result.httpStatus).json(result.body);
    
});

router.post('/stop', (req, res) => {
    const result = buildStopMatchResponse(req.body || {});
    
    return res.status(result.httpStatus).json(result.body);
    
});

router.post('/analyze', async (req, res) => {
    const result = await buildMatchAnalysisResponse(
        req.body || {},
        {
            logDebug,
            logError: (label, error) => {
                console.error(label, error);
            }
        }
    );
    
    return res.status(result.httpStatus).json(result.body);
    
});

router.post('/snapshot', async (req, res) => {
    return res.redirect(307, '/api/match/analyze');
});

export default router;
