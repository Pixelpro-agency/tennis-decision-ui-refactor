import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BETFAIR_CACHE_DIR = path.join(__dirname, '..', '..', '..', 'betfair_cache');

export function clearBetfairCache() {
    try {
        if (fs.existsSync(BETFAIR_CACHE_DIR)) {
            const files = fs.readdirSync(BETFAIR_CACHE_DIR);
            for (const file of files) {
                fs.unlinkSync(path.join(BETFAIR_CACHE_DIR, file));
            }
        }
    } catch (e) {
        console.error('[Tracker] Failed to clear Betfair cache:', e.message);
    }
}
