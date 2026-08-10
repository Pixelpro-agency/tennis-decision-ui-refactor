const LOCAL_HOSTS = new Set(['127.0.0.1', 'localhost', '::1']);

function hostnameFromAuthority(value) {
    if (typeof value !== 'string' || !value.trim()) return null;
    try {
        return new URL(`http://${value.trim()}`).hostname.replace(/^\[|\]$/g, '').toLowerCase();
    } catch (_) {
        return null;
    }
}

export function classifyLocalHttpRequest({ host, origin }) {
    const hostname = hostnameFromAuthority(host);
    if (!hostname || !LOCAL_HOSTS.has(hostname)) return { ok: false, code: 'host_not_allowed' };
    if (origin === undefined || origin === null || origin === '') return { ok: true, code: null };
    try {
        const parsed = new URL(origin);
        const originHost = parsed.hostname.replace(/^\[|\]$/g, '').toLowerCase();
        if (parsed.protocol !== 'http:' || !LOCAL_HOSTS.has(originHost) || parsed.username || parsed.password) {
            return { ok: false, code: 'origin_not_allowed' };
        }
        return { ok: true, code: null };
    } catch (_) {
        return { ok: false, code: 'origin_not_allowed' };
    }
}

export function localHttpBoundary(req, res, next) {
    const result = classifyLocalHttpRequest({ host: req.headers.host, origin: req.headers.origin });
    if (!result.ok) return res.status(403).json({ ok: false, code: result.code, error: 'Local request required.' });
    return next();
}

