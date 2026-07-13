import fs from 'fs';

export function readRecentLogLines(logFile, limit = 100) {
if (!fs.existsSync(logFile)) {
return [];
}

return fs.readFileSync(logFile, 'utf8')
    .split('\n')
    .filter(Boolean)
    .slice(-limit);

}
