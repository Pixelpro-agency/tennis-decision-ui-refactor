import path from 'node:path';
import { createHistoryStorage } from '../storage.js';
import {
    addSofaUpdate,
    addBetfairUpdate,
    getHistoryFile,
    loadHistory,
    loadHistoryResult,
    saveHistory
} from '../../matchHistory.js';
import {
    assert,
    captureErrors,
    createFakeFs,
    createStorage,
    finish
} from './storageTestFixtures.mjs';

assert(
    'T14-public-facade-contract',
    typeof addSofaUpdate === 'function' &&
        typeof addBetfairUpdate === 'function' &&
        typeof getHistoryFile === 'function' &&
        typeof loadHistory === 'function' &&
        typeof loadHistoryResult === 'function' &&
        typeof saveHistory === 'function'
);

finish('storage/facade');
