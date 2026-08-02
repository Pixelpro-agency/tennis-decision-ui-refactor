import path from 'path';
import { fileURLToPath } from 'url';
import {
    capturePythonGeneration,
    isPythonGenerationCurrent,
    PYTHON_PROCESS_ROLES,
    spawnOwnedPython,
    terminatePythonExecution
} from '../runtime/pythonProcessRegistry.js';
import { createFileLogWriter, createRuntimeLogger, runtimeErrorCode } from '../runtime/runtimeLogger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOG_FILE = path.join(__dirname, '..', '..', 'sofa_debug.log');
const DEFAULT_TIMEOUT_MS = 120000;

const writeSofaLogLine = createFileLogWriter({ filePath: LOG_FILE });
const sofaFileLogger = createRuntimeLogger({
    stdout: line => { writeSofaLogLine(line); },
    stderr: line => { writeSofaLogLine(line); }
});

function logDebug(event, fields = {}) {
    sofaFileLogger.info('sofa_fetch', event, fields);
}

function buildErrorResults(urls, code, message) {
    const results = {};
    for (const url of urls) {
        results[url] = { error: { code, message } };
    }
    return results;
}

export function createDirectFetchRuntime({
    captureGeneration = capturePythonGeneration,
    isGenerationCurrent = isPythonGenerationCurrent,
    spawnPython = spawnOwnedPython,
    terminateExecution = terminatePythonExecution,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    setTimeoutFn = setTimeout,
    clearTimeoutFn = clearTimeout,
    log = logDebug
} = {}) {
    let currentBarrier = Promise.resolve();

    async function directFetch(url) {
        const results = await batchFetch([url]);
        return results[url] || {
            error: { code: 500, message: 'No result for URL' }
        };
    }

    async function batchFetch(urls) {
        if (!urls || urls.length === 0) return {};

        const targets = [...urls];
        const generation = captureGeneration('tracking');
        let resolveResult;
        const resultPromise = new Promise(resolve => {
            resolveResult = resolve;
        });

        const requestBarrier = currentBarrier.then(async () => {
            if (!isGenerationCurrent('tracking', generation)) {
                log('sofa_cancelled', { reason: 'scraper_cancelled' });
                resolveResult(buildErrorResults(
                    targets,
                    499,
                    'scraper_cancelled'
                ));
                return;
            }

            log('sofa_batch_started', { count: targets.length });

            const scraperPath = path.join(
                __dirname,
                '..',
                '..',
                '..',
                'scraper.py'
            );
            let handle;
            try {
                handle = spawnPython({
                    role: PYTHON_PROCESS_ROLES.SOFA_TRACKING,
                    args: [scraperPath, ...targets],
                    generation,
                    metadata: { logicalKey: 'sofa_batch' }
                });
            } catch (error) {
                log('sofa_spawn_failed', { reason: runtimeErrorCode(error, 'scraper_spawn_failed') });
                const cancelled = error?.code === 'scraper_cancelled';
                if (cancelled) {
                    log('sofa_cancelled', { reason: 'scraper_cancelled' });
                }
                resolveResult(buildErrorResults(
                    targets,
                    cancelled ? 499 : 500,
                    cancelled
                        ? 'scraper_cancelled'
                        : 'scraper_spawn_failed'
                ));
                return;
            }

            const proc = handle.proc;
            let stdout = '';
            let resultSettled = false;
            let timedOut = false;
            let timer = null;

            const settleResult = result => {
                if (resultSettled) return;
                resultSettled = true;
                if (timer !== null) {
                    clearTimeoutFn(timer);
                }
                resolveResult(result);
            };

            const cancelled = () =>
                handle.isTerminationRequested() ||
                !isGenerationCurrent('tracking', generation);

            const settleFromProcessEnd = code => {
                if (cancelled()) {
                    log('sofa_cancelled', { reason: 'scraper_cancelled' });
                    settleResult(buildErrorResults(
                        targets,
                        499,
                        'scraper_cancelled'
                    ));
                    return;
                }

                if (code !== 0) {
                    log('sofa_process_failed', { reason: 'scraper_process_failed' });
                    settleResult(buildErrorResults(
                        targets,
                        500,
                        'scraper_process_failed'
                    ));
                    return;
                }

                try {
                    if (!stdout.trim()) {
                        throw new Error('empty');
                    }
                    const jsonData = JSON.parse(stdout);
                    log('sofa_batch_completed', { count: Object.keys(jsonData).length });
                    settleResult(jsonData);
                } catch (_error) {
                    log('sofa_output_invalid', { reason: 'output_invalid' });
                    settleResult(buildErrorResults(
                        targets,
                        500,
                        'Scraper result parse error'
                    ));
                }
            };

            proc.stdout.on('data', data => {
                stdout += data.toString();
            });
            proc.stderr.on('data', () => {});

            // Pre-spawn errors are classified by handle.spawnReady.
            // A post-spawn error is not proof that the child has exited.
            proc.on('error', () => {});

            proc.on('close', code => {
                settleFromProcessEnd(code);
            });

            Promise.resolve(handle.terminationRequested)
                .then(() => {
                    if (timedOut) return;
                    log('sofa_cancelled', { reason: 'scraper_cancelled' });
                    settleResult(buildErrorResults(
                        targets,
                        499,
                        'scraper_cancelled'
                    ));
                })
                .catch(() => {});

            const ready = await Promise.resolve(handle.spawnReady)
                .catch(() => ({
                    ok: false,
                    code: 'python_spawn_failed'
                }));

            if (ready?.ok !== true) {
                settleResult(buildErrorResults(
                    targets,
                    500,
                    'scraper_spawn_failed'
                ));
                await Promise.resolve(handle.completion);
                return;
            }

            if (cancelled()) {
                log('sofa_cancelled', { reason: 'scraper_cancelled' });
                settleResult(buildErrorResults(
                    targets,
                    499,
                    'scraper_cancelled'
                ));
            }

            if (!resultSettled) {
                timer = setTimeoutFn(() => {
                    timedOut = true;
                    log('sofa_timeout', { reason: 'scraper_timeout' });
                    settleResult(buildErrorResults(
                        targets,
                        504,
                        'scraper_timeout'
                    ));
                    void Promise.resolve(terminateExecution(
                        handle.executionId,
                        handle.ownerToken
                    )).catch(() => {});
                }, timeoutMs);
            }

            // This is the physical queue barrier. The caller result may have
            // settled earlier, but the next child cannot start until the
            // registry confirms exit for this owned process.
            await Promise.resolve(handle.completion);

            if (!resultSettled) {
                if (cancelled()) {
                    settleResult(buildErrorResults(
                        targets,
                        499,
                        'scraper_cancelled'
                    ));
                } else if (
                    proc.exitCode !== null &&
                    proc.exitCode !== undefined
                ) {
                    settleFromProcessEnd(proc.exitCode);
                } else {
                    settleResult(buildErrorResults(
                        targets,
                        500,
                        'scraper_process_failed'
                    ));
                }
            }
        }).catch(() => {
            resolveResult(buildErrorResults(
                targets,
                500,
                'scraper_spawn_failed'
            ));
        });

        currentBarrier = requestBarrier.catch(() => {});
        return resultPromise;
    }

    return { directFetch, batchFetch };
}

const defaultRuntime = createDirectFetchRuntime();

export const directFetch = defaultRuntime.directFetch;
export const batchFetch = defaultRuntime.batchFetch;
