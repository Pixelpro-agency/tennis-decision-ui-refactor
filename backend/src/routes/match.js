import express from 'express';
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
import { buildMatchAnalysisResponse } from './match/analysisResponse.js';
import { buildSourceIdentityStatusResponse } from './match/sourceIdentityStatusResponse.js';
import { runtimeLog, runtimeErrorCode } from '../runtime/runtimeLogger.js';

const router = express.Router();

function logDebug(_message) {
    runtimeLog.debug('match_route', 'analysis_debug', { reason: 'analysis_event' });
}

let lastDebugData = null;

router.get('/debug-last', (_req, res) => {
    return res.json(buildDebugLastResponse(lastDebugData));
});
router.get('/:eventId/source-identity-status', (req, res) => {
    const result = buildSourceIdentityStatusResponse(req.params.eventId);
    return res.status(result.httpStatus).json(result.body);
});
router.get('/:eventId/history', (req, res) => {
    const result = buildMatchHistoryResponse(
        req.params.eventId,
        { getMatchPersistenceIntegrity }
    );
    return res.status(result.httpStatus).json(result.body);
});
router.get('/:eventId/json', (req, res) => {
    const result = buildSofaTimelineResponse(
        req.params.eventId,
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
router.post('/stop', async (req, res) => {
    const result = await buildStopMatchResponse(req.body || {});
    return res.status(result.httpStatus).json(result.body);
});
router.post('/analyze', async (req, res) => {
    const result = await buildMatchAnalysisResponse(req.body || {}, {
        logDebug,
        logError: (_label, error) => runtimeLog.error('match_route', 'analysis_failed', {
            reason: runtimeErrorCode(error, 'analysis_failed')
        })
    });
    return res.status(result.httpStatus).json(result.body);
});
router.post('/snapshot', async (_req, res) => {
    return res.redirect(307, '/api/match/analyze');
});

export default router;
