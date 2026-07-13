import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const DATA_DIR = path.resolve(__dirname, '..', '..', '..', 'match_history');

export { fs, path };

export function createAssertionSuite(scope) {
    let passed = 0;
    let failed = 0;

    function assert(label, condition, detail = '') {
        if (condition) {
            console.log(`  PASS [${label}]`);
            passed += 1;
        } else {
            console.error(`  FAIL [${label}]${detail ? ': ' + detail : ''}`);
            failed += 1;
        }
    }

    function finish() {
        console.log(`\n=== ${scope}: ${passed} passed, ${failed} failed ===`);
        if (failed > 0) {
            throw new Error(`${failed} ${scope} assertions failed`);
        }
    }

    return { assert, finish };
}

export function cleanupFixture(eventId) {
    try {
        if (fs.existsSync(DATA_DIR)) {
            const files = fs.readdirSync(DATA_DIR);
            for (const file of files) {
                if (file.includes(eventId)) {
                    fs.unlinkSync(path.join(DATA_DIR, file));
                }
            }
        }
    } catch (error) {
        console.error(`[Cleanup] Error cleaning up eventId ${eventId}:`, error);
    }
}

export function countTmpFiles(eventId) {
    if (!fs.existsSync(DATA_DIR)) return 0;
    const files = fs.readdirSync(DATA_DIR);
    return files.filter(file => file.includes(eventId) && file.endsWith('.tmp')).length;
}
