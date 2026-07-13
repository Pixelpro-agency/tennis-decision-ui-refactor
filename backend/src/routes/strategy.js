import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { extractEventId } from '../sofa/extractEventId.js';
import { buildSofaAnalysis } from '../sofa/buildSofaAnalysis.js';
import { loadTimeline } from '../sofa/timelineStore.js';
import { buildLayTheWinnerViewModel } from './strategy/layTheWinner.js';
import {
    buildLayTheWinnerErrorResponse,
    normalizeLayTheWinnerRequest
} from './strategy/layTheWinnerResponse.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOG_FILE = path.join(__dirname, '..', '..', 'backend_debug.log');

const router = express.Router();

function logDebug(message) {
    const time = new Date().toISOString();
    fs.appendFileSync(
        LOG_FILE,
`[${time}] [StrategyRoute] ${message}\n`
    );
}

router.get('/lay-the-winner', async (req, res) => {
    logDebug('New lay-the-winner request received');
    
    const request = normalizeLayTheWinnerRequest(
        req.query.url,
        extractEventId
    );
    
    if (!request.ok) {
        return res.status(request.httpStatus).json(request.body);
    }
    
    const { eventId } = request;
    
    logDebug(`Extracted EventID: ${eventId}`);
    
    try {
        const { snapshot } = await buildSofaAnalysis(eventId);
        
        const betfairTimeline = loadTimeline('betfair', eventId);
        
        const viewModel = buildLayTheWinnerViewModel(
            snapshot,
            null,
            betfairTimeline,
            eventId
        );
        
        return res.json(viewModel);
    } catch (error) {
        console.error('Strategy lay-the-winner error:', error);
        
        const errorResponse = buildLayTheWinnerErrorResponse(error);
        
        return res
        .status(errorResponse.httpStatus)
        .json(errorResponse.body);
    }
    
});

export default router;