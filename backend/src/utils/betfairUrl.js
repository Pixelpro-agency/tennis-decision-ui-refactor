const ALLOWED_BETFAIR_HOSTS = new Set([
    'betfair.it', 'www.betfair.it', 'betfair.com', 'www.betfair.com'
]);

function failure(code) {
    return { ok: false, code, value: '', eventId: null, hostname: null };
}

export function classifyBetfairUrl(value, { allowEmpty = false, requireEventId = false } = {}) {
    if (value === undefined || value === null || (typeof value === 'string' && !value.trim())) {
        return allowEmpty ? { ok: true, code: null, value: '', eventId: null, hostname: null } : failure('betfair_url_required');
    }
    if (typeof value !== 'string') return failure('betfair_url_invalid');

    const normalized = value.trim();
    const hasExplicitPort = /^[a-z][a-z0-9+.-]*:\/\/[^/]*:\d+(?:\/|$)/i.test(normalized);
    let parsed;
    try {
        parsed = new URL(normalized);
    } catch (_) {
        return failure('betfair_url_invalid');
    }

    const hostname = parsed.hostname.toLowerCase();
    if (
        parsed.protocol !== 'https:' ||
        !ALLOWED_BETFAIR_HOSTS.has(hostname) ||
        parsed.username ||
        parsed.password ||
        parsed.port || hasExplicitPort
    ) return failure('betfair_url_invalid');

    const eventMatch = parsed.pathname.match(/-([0-9]{6,})(?:\/|$)/);
    const eventId = eventMatch?.[1] || null;
    if (requireEventId && !eventId) return failure('betfair_event_id_missing');

    return {
        ok: true,
        code: null,
        value: parsed.toString(),
        eventId,
        hostname
    };
}
