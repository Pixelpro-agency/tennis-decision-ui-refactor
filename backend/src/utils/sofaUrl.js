import { extractEventId } from '../sofa/extractEventId.js';

const ALLOWED_HOSTS = new Set(['sofascore.com', 'www.sofascore.com']);

export function classifySofaUrl(value) {
    if (value === undefined || value === null || (typeof value === 'string' && !value.trim())) {
        return { ok: false, code: 'sofa_url_required', value: '', eventId: null };
    }
    if (typeof value !== 'string') {
        return { ok: false, code: 'sofa_url_invalid', value: '', eventId: null };
    }

    const normalized = value.trim();
    const hasExplicitPort = /^[a-z][a-z0-9+.-]*:\/\/[^/]*:\d+(?:\/|$)/i.test(normalized);
    let parsed;
    try {
        parsed = new URL(normalized);
    } catch (_) {
        return { ok: false, code: 'sofa_url_invalid', value: '', eventId: null };
    }

    if (
        parsed.protocol !== 'https:' ||
        !ALLOWED_HOSTS.has(parsed.hostname.toLowerCase()) ||
        parsed.username ||
        parsed.password ||
        parsed.port || hasExplicitPort
    ) {
        return { ok: false, code: 'sofa_url_invalid', value: '', eventId: null };
    }

    const eventId = extractEventId(parsed.toString());
    if (!eventId) return { ok: false, code: 'sofa_event_id_missing', value: '', eventId: null };
    return { ok: true, code: null, value: parsed.toString(), eventId };
}
