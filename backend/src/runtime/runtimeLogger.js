import fs from 'fs';
import path from 'path';

export const MAX_RUNTIME_TEXT_LENGTH = 800;
export const MAX_RUNTIME_LOG_LINE_LENGTH = 1000;
export const MAX_RUNTIME_LOG_LINES = 200;

const LEVELS = new Set(['debug', 'info', 'warn', 'error']);
const FIELD_ORDER = [
    'eventId', 'role', 'state', 'status', 'reason', 'mode', 'source',
    'scope', 'service', 'ownership', 'pid', 'port', 'attempt', 'count',
    'requested', 'graceful', 'forceKilled', 'alreadyExited', 'remaining',
    'active', 'stopping', 'graphUrlCount', 'hasBetfairUrl', 'ok', 'code',
    'text'
];
const FIELD_ALLOWLIST = new Set(FIELD_ORDER);
const STATIC_CODE = /^[a-z][a-z0-9_]*$/;
const REDACTED = '<redacted>';
const TRUNCATED = '<truncated>';

function safeString(value) {
    try {
        return String(value ?? '');
    } catch (_error) {
        return '';
    }
}

export function normalizeRuntimeCode(value, fallback = 'unknown') {
    const normalized = safeString(value).trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
    return STATIC_CODE.test(normalized) ? normalized : fallback;
}

export function redactRuntimeText(value, maxLength = MAX_RUNTIME_TEXT_LENGTH) {
    try {
        let text = safeString(value);
        text = text.replace(/\x1b\[[0-?]*[ -\/]*[@-~]/g, '');
        text = text.replace(/[\u0000-\u001f\u007f-\u009f]+/g, ' ');
        text = text.replace(/\s+/g, ' ').trim();
        text = text.replace(/\b(?:https?|wss?):\/\/[^\s"'<>]+/gi, REDACTED);

        text = text.replace(
            /(["'])(Authorization|Proxy-Authorization|Cookie|Set-Cookie|BETFAIR_APP_KEY|APP_KEY|app_key|token|access_token|refresh_token|session|password|secret)\1\s*:\s*(?:"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|[^\s,}\]]+)/gi,
            (_match, quote, key) => `${quote}${key}${quote}:${quote}${REDACTED}${quote}`
        );
        text = text.replace(
            /\b(Authorization|Proxy-Authorization|Cookie|Set-Cookie)\s*:\s*.*$/gi,
            `$1: ${REDACTED}`
        );
        text = text.replace(
            /\b(BETFAIR_APP_KEY|APP_KEY|app_key|token|access_token|refresh_token|session|password|secret)\s*[:=]\s*(?:"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|[^\s,;}\]]+)/gi,
            (_match, key) => `${key}=${REDACTED}`
        );
        text = text.replace(/\bBearer\s+[^\s,;]+/gi, `Bearer ${REDACTED}`);

        text = text.replace(/\\\\\?\\[A-Za-z]:[\\/][^\s"'<>]*/g, REDACTED);
        text = text.replace(/\\\\[^\\/\s"'<>]+[\\/][^\\/\s"'<>]+(?:[\\/][^\s"'<>]*)*/g, REDACTED);
        text = text.replace(/\b[A-Za-z]:[\\/][^\s"'<>]*/g, REDACTED);
        text = text.replace(
            /(^|[\s=(,:])\/(?!\/)(?:[A-Za-z0-9._~+-]+(?:\/[A-Za-z0-9._~+-]+)*)/g,
            (_match, prefix) => `${prefix}${REDACTED}`
        );

        if (text.length > maxLength) {
            const keep = Math.max(0, maxLength - TRUNCATED.length);
            text = text.slice(0, keep) + TRUNCATED;
        }
        return text;
    } catch (_error) {
        return REDACTED;
    }
}
function sanitizePrimitive(value) {
    if (value === null) return null;
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;
    if (typeof value === 'string') return redactRuntimeText(value);
    return undefined;
}

export function sanitizeRuntimeFields(fields = {}) {
    if (!fields || typeof fields !== 'object' || Array.isArray(fields)) return {};
    const result = {};
    for (const key of FIELD_ORDER) {
        if (!FIELD_ALLOWLIST.has(key) || !Object.prototype.hasOwnProperty.call(fields, key)) continue;
        const sanitized = sanitizePrimitive(fields[key]);
        if (sanitized !== undefined) result[key] = sanitized;
    }
    return result;
}

export function runtimeErrorCode(error, fallback = 'unexpected_error') {
    const direct = typeof error?.code === 'string'
        ? normalizeRuntimeCode(error.code, '')
        : '';
    if (direct) return direct;
    const normalizedFallback = normalizeRuntimeCode(fallback, 'unexpected_error');
    return normalizedFallback || 'unexpected_error';
}

function formatValue(value) {
    if (value === null) return 'null';
    if (typeof value === 'string') return JSON.stringify(value);
    return String(value);
}

export function formatRuntimeLog(record = {}, options = {}) {
    const now = typeof options.now === 'function' ? options.now : () => new Date();
    const date = now();
    const timestamp = date instanceof Date && !Number.isNaN(date.getTime())
        ? date.toISOString()
        : new Date(0).toISOString();
    const level = LEVELS.has(record.level) ? record.level : 'info';
    const component = normalizeRuntimeCode(record.component, 'runtime');
    const event = normalizeRuntimeCode(record.event, 'unknown_event');
    const fields = sanitizeRuntimeFields(record.fields);
    const parts = [
        `[${timestamp}]`,
        `level=${level}`,
        `component=${component}`,
        `event=${event}`
    ];
    for (const key of FIELD_ORDER) {
        if (Object.prototype.hasOwnProperty.call(fields, key)) {
            parts.push(`${key}=${formatValue(fields[key])}`);
        }
    }
    return redactRuntimeText(parts.join(' '), MAX_RUNTIME_LOG_LINE_LENGTH);
}

export function createRuntimeLogger(options = {}) {
    const stdout = typeof options.stdout === 'function'
        ? options.stdout
        : line => console.log(line);
    const stderr = typeof options.stderr === 'function'
        ? options.stderr
        : line => console.error(line);
    const now = typeof options.now === 'function' ? options.now : () => new Date();

    function emit(level, component, event, fields = {}) {
        try {
            const line = formatRuntimeLog({ level, component, event, fields }, { now });
            const writer = level === 'warn' || level === 'error' ? stderr : stdout;
            try {
                writer(line);
            } catch (_writerError) {
                try {
                    stderr('level=error component=runtime_logger event=logger_failure');
                } catch (_ignored) {
                }
            }
            return { ok: true, line };
        } catch (_error) {
            const fallback = 'level=error component=runtime_logger event=logger_failure';
            try {
                stderr(fallback);
            } catch (_ignored) {
            }
            return { ok: false, line: fallback };
        }
    }

    return {
        debug: (component, event, fields) => emit('debug', component, event, fields),
        info: (component, event, fields) => emit('info', component, event, fields),
        warn: (component, event, fields) => emit('warn', component, event, fields),
        error: (component, event, fields) => emit('error', component, event, fields)
    };
}

export const runtimeLog = createRuntimeLogger();

export function createFileLogWriter(options = {}) {
    const filePath = options.filePath;
    const appendFile = options.appendFile || fs.appendFileSync;
    const mkdir = options.mkdir || fs.mkdirSync;
    const directory = path.dirname(filePath || '');
    return function writeLine(line) {
        try {
            if (!filePath) return { ok: false, code: 'log_path_missing' };
            mkdir(directory, { recursive: true });
            appendFile(filePath, `${redactRuntimeText(line, MAX_RUNTIME_LOG_LINE_LENGTH)}\n`, 'utf8');
            return { ok: true };
        } catch (_error) {
            return { ok: false, code: 'log_write_failed' };
        }
    };
}

export function readBoundedRuntimeLog(filePath, options = {}) {
    const maxLines = Number.isInteger(options.maxLines) ? Math.min(Math.max(options.maxLines, 0), MAX_RUNTIME_LOG_LINES) : MAX_RUNTIME_LOG_LINES;
    const maxLineLength = Number.isInteger(options.maxLineLength) ? Math.min(Math.max(options.maxLineLength, 1), MAX_RUNTIME_LOG_LINE_LENGTH) : MAX_RUNTIME_LOG_LINE_LENGTH;
    const statSync = options.statSync || fs.statSync;
    const openSync = options.openSync || fs.openSync;
    const readSync = options.readSync || fs.readSync;
    const closeSync = options.closeSync || fs.closeSync;
    try {
        const stat = statSync(filePath);
        const maxBytes = 512 * 1024;
        const size = Math.max(0, Number(stat.size) || 0);
        const length = Math.min(size, maxBytes);
        const start = Math.max(0, size - length);
        const buffer = Buffer.alloc(length);
        const fd = openSync(filePath, 'r');
        try {
            if (length > 0) readSync(fd, buffer, 0, length, start);
        } finally {
            closeSync(fd);
        }
        let lines = buffer.toString('utf8').split(/\r?\n/);
        if (start > 0 && lines.length) lines = lines.slice(1);
        lines = lines.filter(Boolean).slice(-maxLines).map(line => redactRuntimeText(line, maxLineLength));
        return { status: 'ok', lines };
    } catch (error) {
        if (error?.code === 'ENOENT') return { status: 'not_found', lines: [] };
        return { status: 'read_failed', lines: [] };
    }
}
