import { EventEmitter } from 'events';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { createScraperLifecycle } from '../scraperLifecycle.js';
import {
    assert,
    completeLifecyclePromise,
    createFakeProcess,
    createHarness,
    expectRejected,
    finish,
    getRejectionError,
    runFacadeToLifecycleMatrix
} from './scraperLifecycleTestFixtures.mjs';

await runFacadeToLifecycleMatrix();

finish('scraperLifecycle/facade');
