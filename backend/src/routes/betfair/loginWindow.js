import { classifyCdpBaseUrl } from '../../utils/cdpUrl.js';

function loginError(code) {
    const error = new Error(code);
    error.code = code;
    return error;
}

function normalizeProfileDir(value) {
    return typeof value === 'string' ? value.trim() : '';
}

export function buildLoginRuntimeIdentity({
    mode = 'persistent',
    profileDir = '',
    cdpUrl
} = {}) {
    if (mode === 'cdp') {
        const classified = classifyCdpBaseUrl(cdpUrl);
        if (!classified.ok) throw loginError(classified.code);
        return Object.freeze({ mode: 'cdp', cdpUrl: classified.value });
    }
    return Object.freeze({
        mode: 'persistent',
        profileDir: normalizeProfileDir(profileDir)
    });
}

export function sameLoginRuntimeIdentity(left, right) {
    if (!left || !right || left.mode !== right.mode) return false;
    return left.mode === 'cdp'
        ? left.cdpUrl === right.cdpUrl
        : left.profileDir === right.profileDir;
}

export function buildLoginWindowArgs({
    scraperPath,
    url,
    mode = 'persistent',
    profileDir = '',
    cdpUrl
}) {
    const runtimeIdentity = buildLoginRuntimeIdentity({
        mode,
        profileDir,
        cdpUrl
    });
    const args = [
        scraperPath,
        url,
        '--login-only',
        '--mode',
        runtimeIdentity.mode
    ];
    if (
        runtimeIdentity.mode === 'persistent' &&
        runtimeIdentity.profileDir
    ) {
        args.push('--profile-dir', runtimeIdentity.profileDir);
    }
    if (runtimeIdentity.mode === 'cdp') {
        args.push('--cdp-url', runtimeIdentity.cdpUrl);
    }
    return { args, runtimeIdentity };
}
