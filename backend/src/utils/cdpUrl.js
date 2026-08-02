const LOCAL_CDP_HOSTS = new Set([
    '127.0.0.1',
    'localhost',
    '::1'
]);

function normalizedHostname(hostname) {
    return String(hostname || '').replace(/^\[|\]$/g, '').toLowerCase();
}

export function normalizeCdpBaseUrl(value) {
    if (value === undefined || value === null) {
        return '';
    }

    if (typeof value !== 'string') {
        return null;
    }

    const normalized = value.trim().replace(/\/+$/, '');

    if (!normalized) {
        return '';
    }

    let parsed;
    try {
        parsed = new URL(normalized);
    } catch (_) {
        return null;
    }

    const port = Number(parsed.port);
    const pathname = parsed.pathname || '/';

    if (
        parsed.protocol !== 'http:' ||
        parsed.username ||
        parsed.password ||
        parsed.search ||
        parsed.hash ||
        pathname !== '/' ||
        !LOCAL_CDP_HOSTS.has(normalizedHostname(parsed.hostname)) ||
        !parsed.port ||
        !Number.isInteger(port) ||
        port < 1 ||
        port > 65535
    ) {
        return null;
    }

    return normalized;
}

export function validateCdpBaseUrl(value) {
    const normalized = normalizeCdpBaseUrl(value);
    return typeof normalized === 'string' && normalized.length > 0;
}

export function buildCdpVersionUrl(value) {
    const normalized = normalizeCdpBaseUrl(value);
    return normalized ? `${normalized}/json/version` : null;
}

export function classifyCdpBaseUrl(value) {
    const normalized = normalizeCdpBaseUrl(value);

    if (normalized === '') {
        return {
            ok: false,
            code: 'cdp_url_required',
            value: ''
        };
    }

    if (normalized === null) {
        return {
            ok: false,
            code: 'cdp_url_invalid',
            value: ''
        };
    }

    return {
        ok: true,
        code: null,
        value: normalized
    };
}
