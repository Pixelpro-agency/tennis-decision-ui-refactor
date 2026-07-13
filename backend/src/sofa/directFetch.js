import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOG_FILE = path.join(__dirname, '..', '..', 'sofa_debug.log');

function logDebug(msg) {
    const time = new Date().toISOString();
    fs.appendFileSync(LOG_FILE, `[${time}] ${msg}\n`);
}

let currentRequest = Promise.resolve();

export async function directFetch(url) {
    const results = await batchFetch([url]);
    return results[url] || { error: { code: 500, message: "No result for URL" } };
}

export async function batchFetch(urls) {
    if (!urls || urls.length === 0) return {};

    const nextRequest = currentRequest.then(async () => {
        logDebug(`[BatchFetch] Starting for ${urls.length} targets: ${urls.join(', ').slice(0, 100)}...`);

        return new Promise((resolve) => {
            const scraperPath = path.join(__dirname, '..', '..', '..', 'scraper.py');
            logDebug(`[BatchFetch] scraperPath=${scraperPath}`);
            logDebug(`[BatchFetch] scraperExists=${fs.existsSync(scraperPath)}`);
            const pythonProcess = spawn('python', [scraperPath, ...urls]);

            let stdout = '';
            let stderr = '';

            pythonProcess.stdout.on('data', (data) => {
                stdout += data.toString();
            });

            pythonProcess.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            pythonProcess.on('close', (code) => {
                logDebug(`[BatchFetch] Python exited (code ${code})`);
                if (stderr) logDebug(`[BatchFetch] STDERR: ${stderr.slice(0, 500)}`);

                if (code !== 0) {
                    const stderrTail = stderr.slice(-2000).trim();
                    const message = `Scraper process failure: python exited code ${code}${stderrTail ? `; stderr: ${stderrTail}` : ''}`;
                    const errorResults = {};
                    urls.forEach(url => {
                        errorResults[url] = { error: { code: 500, message } };
                    });
                    return resolve(errorResults);
                }

                try {
                    if (!stdout.trim()) {
                        throw new Error("No stdout output from scraper");
                    }

                    const jsonData = JSON.parse(stdout);
                    logDebug(`[BatchFetch] SUCCESS: Received ${Object.keys(jsonData).length} keys`);
                    resolve(jsonData);
                } catch (err) {
                    logDebug(`[BatchFetch] JSON PARSE ERROR: ${err.message}. Raw stdout start: ${stdout.slice(0, 500)}; stderr tail: ${stderr.slice(-2000).trim()}`);
                    const errorResults = {};
                    urls.forEach(url => {
                        errorResults[url] = { error: { code: 500, message: "Scraper result parse error" } };
                    });
                    resolve(errorResults);
                }
            });

            pythonProcess.on('error', (err) => {
                logDebug(`[BatchFetch] PROCESS SPAWN ERROR: ${err.message}`);
                const errorResults = {};
                urls.forEach(url => {
                    errorResults[url] = { error: { code: 500, message: `Spawn error: ${err.message}` } };
                });
                resolve(errorResults);
            });
        });
    });

    currentRequest = nextRequest.catch(() => { });

    return nextRequest;
}