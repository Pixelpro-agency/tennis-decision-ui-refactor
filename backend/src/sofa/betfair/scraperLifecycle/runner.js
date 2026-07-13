import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createScraperRunner({
    spawnProcess = spawn,
    timeoutMs = 90000,
    killEscalationMs = 5000
} = {}) {
    const activeScrapers = new Map();
    const activeScraperProcesses = new Set();

    function spawnScraper(url, options, logDebug = () => {}) {
        const scraperPath = path.join(__dirname, '../../../../../betfair_scraper.py');
        const args = [scraperPath, url];

        const mode = options.mode || 'persistent';
        const ladderUrls = Array.isArray(options.ladderUrls) ? options.ladderUrls : [];
        const networkCapture = options.networkCapture === true;
        const networkCaptureInput = Object.prototype.hasOwnProperty.call(
            options,
            'networkCaptureInput'
        )
            ? options.networkCaptureInput
            : options.networkCapture;

        args.push('--mode', mode);

        if (mode === 'persistent' && options.profileDir) {
            args.push('--profile-dir', options.profileDir);
        }

        if (mode === 'cdp' && options.cdpUrl) {
            args.push('--cdp-url', options.cdpUrl);
        }

        if (ladderUrls.length) {
            args.push('--ladder-urls', ladderUrls.join(','));
        }

        if (networkCapture === false) {
            args.push('--no-network-capture');
        }

        if (ladderUrls.length || networkCaptureInput !== false) {
            args.push('--no-cache');
        }

        logDebug(
            `[BetfairFetch] Spawning scraper ` +
            `mode=${mode} graphUrls=${ladderUrls.length} ` +
            `networkCapture=${networkCapture}`
        );

        return spawnProcess('python', args, {
            windowsHide: false,
            stdio: ['ignore', 'pipe', 'pipe']
        });
    }

    function fetchScraperLifecycle({
        key,
        url,
        sofaEventId = null,
        options = {},
        logDebug = () => {},
        processBetfairResults
    }) {
        if (activeScrapers.has(key)) {
            logDebug('[BetfairFetch] Scraper already active; skipping spawn.');
            return activeScrapers.get(key);
        }

        const ladderUrls = Array.isArray(options.ladderUrls) ? options.ladderUrls : [];
        const mode = options.mode || 'persistent';
        const profileDir = options.profileDir || '';
        const cdpUrl = options.cdpUrl || '';
        const networkCapture = options.networkCapture === true;
        const networkCaptureInput = Object.prototype.hasOwnProperty.call(
            options,
            'networkCaptureInput'
        )
            ? options.networkCaptureInput
            : options.networkCapture;

        logDebug(
            `[BetfairFetch] Starting scraper ` +
            `mode=${mode} graphUrls=${ladderUrls.length} ` +
            `networkCapture=${networkCapture}`
        );

        const scraperPromise = new Promise((resolve, reject) => {
            const proc = spawnScraper(
                url,
                { mode, profileDir, cdpUrl, ladderUrls, networkCapture, networkCaptureInput },
                logDebug
            );

            activeScraperProcesses.add(proc);

            let stdoutData = '';
            let finished = false;
            const startedAt = Date.now();
            let stdoutBytes = 0;
            let stderrBytes = 0;
            let lastStdoutAt = null;
            let lastStderrAt = null;

            const buildRunSummary = () => {
                const now = Date.now();

                return `pid=${proc.pid || 'n/a'} mode=${mode} graphUrls=${ladderUrls.length} networkCapture=${networkCapture} elapsedMs=${now - startedAt} stdoutBytes=${stdoutBytes} stderrBytes=${stderrBytes} lastStdoutAgeMs=${lastStdoutAt ? now - lastStdoutAt : 'never'} lastStderrAgeMs=${lastStderrAt ? now - lastStderrAt : 'never'} exitCode=${proc.exitCode ?? 'null'} signalCode=${proc.signalCode ?? 'null'} killed=${proc.killed}`;
            };

            const safeCleanup = (reason, err) => {
                if (finished) return;

                finished = true;
                clearTimeout(timeout);
                activeScrapers.delete(key);
                activeScraperProcesses.delete(proc);

                logDebug(`[BetfairFetch] Removed active scraper reason=${reason} ${buildRunSummary()}`);

                if (proc.exitCode === null && !proc.killed) {
                    try {
                        proc.kill('SIGTERM');

                        setTimeout(() => {
                            if (proc.exitCode === null && !proc.killed) {
                                proc.kill('SIGKILL');
                            }
                        }, killEscalationMs);
                    } catch (e) {
                    }
                }

                if (err) {
                    logDebug(
                        `[BetfairFetch] Scraper failed ` +
                        `reason=${reason} ${buildRunSummary()}`
                    );
                    reject(err);
                }
            };

            const timeout = setTimeout(() => {
                logDebug(`[BetfairFetch] Scraper timed out after ${timeoutMs}ms ${buildRunSummary()}`);
                safeCleanup('timeout', new Error(`Scraper timed out after ${timeoutMs}ms`));
            }, timeoutMs);

            proc.stdout.on('data', (data) => {
                const text = data.toString();
                stdoutData += text;
                stdoutBytes += data.length;
                lastStdoutAt = Date.now();
            });

            proc.stderr.on('data', (data) => {
                stderrBytes += data.length;
                lastStderrAt = Date.now();
            });

            proc.on('error', () => {
                safeCleanup(
                    'proc_error',
                    new Error('Failed to start Betfair scraper')
                );
            });

            proc.on('close', (code) => {
                if (finished) {
                    safeCleanup('already_finished');
                    return;
                }

                if (code !== 0) {
                    safeCleanup(
                        'non_zero_exit',
                        new Error(`Scraper exited with code ${code}`)
                    );
                    return;
                }

                try {
                    const jsonStart = stdoutData.indexOf('{');

                    if (jsonStart === -1) {
                        throw new Error('No JSON found in scraper output');
                    }

                    const rawResult = JSON.parse(stdoutData.substring(jsonStart));
                    const results = processBetfairResults(key, rawResult, sofaEventId);

                    logDebug(`[BetfairFetch] Scraper finished runners=${results?.runners?.length || 0} ${buildRunSummary()}`);

                    safeCleanup('success');
                    resolve(results);
                } catch (_error) {
                    safeCleanup(
                        'parse_error',
                        new Error('Invalid scraper JSON output')
                    );
                }
            });
        });

        activeScrapers.set(key, scraperPromise);
        logDebug('[BetfairFetch] Scraper started.');

        return scraperPromise;
    }

    function terminateActiveScrapers() {
        for (const proc of activeScraperProcesses) {
            try {
                if (proc && proc.exitCode === null && !proc.killed) {
                    proc.kill('SIGTERM');
                }
            } catch (e) {
            }
        }

        activeScraperProcesses.clear();
    }

    return {
        fetchScraperLifecycle,
        terminateActiveScrapers
    };
}
