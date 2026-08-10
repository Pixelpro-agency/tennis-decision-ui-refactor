const EVENT_ID_PATTERN = /^[A-Za-z0-9_-]+$/;
const MAX_EVENT_ID_LENGTH = 128;

export function normalizeEventId(value) {
    if (typeof value !== 'string') return null;
    const normalized = value.trim();
    if (
        !normalized ||
        normalized.length > MAX_EVENT_ID_LENGTH ||
        !EVENT_ID_PATTERN.test(normalized)
    ) return null;
    return normalized;
}

export function isValidEventId(value) {
    return normalizeEventId(value) !== null;
}
