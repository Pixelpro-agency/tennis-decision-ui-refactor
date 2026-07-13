import { spawn } from 'child_process';

export function openBetfairLoginWindow({
scraperPath,
url,
mode = 'persistent',
profileDir = '',
cdpUrl = ''
}) {
const args = [
scraperPath,
url,
'--login-only',
'--mode',
mode
];

if (mode === 'persistent' && profileDir) {
    args.push('--profile-dir', profileDir);
}

if (mode === 'cdp' && cdpUrl) {
    args.push('--cdp-url', cdpUrl);
}

console.log(
    `[BetfairRoute] Spawning login window: python ${args.map(
        argument => `"${argument}"`
    ).join(' ')}`
);

const proc = spawn('python', args, {
    detached: false,
    windowsHide: false,
    stdio: ['ignore', 'pipe', 'pipe']
});

proc.on('error', error => {
    console.error('[BetfairRoute] Login window spawn error:', error);
});

proc.stderr.on('data', data => {
    data.toString()
        .split('\n')
        .filter(Boolean)
        .forEach(line => {
            console.log(`[LoginWindow] ${line}`);
        });
});

proc.on('exit', code => {
    console.log(`[BetfairRoute] Login window exited with code ${code}`);
});

return proc;

}
