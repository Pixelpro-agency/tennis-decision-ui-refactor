const LEVELS = new Set(['debug', 'info', 'warn', 'error']);
const FIELDS = ['code', 'status', 'source'];
const STATIC_CODE = /^[a-z][a-z0-9_]*$/;

function code(value, fallback) {
    const normalized = String(value ?? '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
    return STATIC_CODE.test(normalized) ? normalized : fallback;
}

export function frontendRuntimeLog(level, event, fields = {}, writer = console) {
    try {
        const normalizedLevel = LEVELS.has(level) ? level : 'info';
        const parts = ['[Frontend]', `event=${code(event, 'runtime_event')}`];
        for (const key of FIELDS) {
            const value = fields?.[key];
            if (typeof value === 'string' && STATIC_CODE.test(value)) {
                parts.push(`${key}=${value}`);
            }
        }
        const method = normalizedLevel === 'error' ? 'error'
            : normalizedLevel === 'warn' ? 'warn'
                : normalizedLevel === 'debug' ? 'debug' : 'log';
        const fn = typeof writer?.[method] === 'function' ? writer[method].bind(writer) : null;
        if (fn) fn(parts.join(' '));
    } catch (_error) {
    }
}
