export const SOURCES = new Set(['sofa', 'betfair']);
export const DOCUMENT_NAMES = ['history', 'timeline'];
export const FORBIDDEN_KEY_CONCEPTS = [
    'cookie',
    'token',
    'header',
    'authorization',
    'credential',
    'password',
    'secret',
    'browser',
    'profile',
    'network',
    'capture'
];

export const SENSITIVE_QUERY_PARAMS = [
    'token',
    'access_token',
    'id_token',
    'api_key',
    'apikey',
    'authorization',
    'cookie',
    'session',
    'sessionid',
    'password',
    'secret',
    'credential',
    'signature',
    'sig'
].map(param => param.toLowerCase().replace(/[^a-z0-9]/g, ''));

export const NETWORK_CAPTURE_SUMMARY_FIELDS = [
    'enabled',
    'response_count',
    'json_count',
    'errors_count',
    'candidates_count'
];

export function hasOwn(value, key) {
    return Object.prototype.hasOwnProperty.call(value, key);
}

export function isPlainObject(value) {
    if (value === null || typeof value !== 'object' || Array.isArray(value)) {
        return false;
    }

    const prototype = Object.getPrototypeOf(value);
    return prototype === Object.prototype || prototype === null;
}

export function hasOnlyKeys(value, allowedKeys) {
    return Object.keys(value).every(key => allowedKeys.includes(key));
}

export function isValidEventId(eventId) {
    return typeof eventId === 'string' && eventId.trim().length > 0;
}

export function isValidSource(source) {
    return SOURCES.has(source);
}

export function isValidCommitId(commitId) {
    return typeof commitId === 'string' &&
        /^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/.test(commitId);
}

export function isValidTarget(target) {
    return typeof target === 'string' && target.trim().length > 0;
}

export function isValidRecoveryReason(reason) {
    return typeof reason === 'string' &&
        /^[a-z][a-z0-9_-]{0,127}$/.test(reason);
}

export function isNonNegativeInteger(value) {
    return Number.isInteger(value) && value >= 0;
}

export function isValidNetworkCaptureSummary(value) {
    return isPlainObject(value) &&
        Object.keys(value).length === NETWORK_CAPTURE_SUMMARY_FIELDS.length &&
        hasOnlyKeys(value, NETWORK_CAPTURE_SUMMARY_FIELDS) &&
        typeof value.enabled === 'boolean' &&
        isNonNegativeInteger(value.response_count) &&
        isNonNegativeInteger(value.json_count) &&
        isNonNegativeInteger(value.errors_count) &&
        isNonNegativeInteger(value.candidates_count);
}

export function isForbiddenKey(key) {
    if (typeof key !== 'string') return true;

    const normalized = key.toLowerCase().replace(/[^a-z0-9]/g, '');

    return FORBIDDEN_KEY_CONCEPTS.some(concept =>
        normalized.includes(concept)
    );
}

export function hasSensitiveQueryParameter(value) {
    if (typeof value !== 'string') {
        return false;
    }

    const queryStart = value.indexOf('?');
    if (queryStart === -1) {
        return false;
    }

    const query = value.slice(queryStart + 1);
    if (!query) {
        return false;
    }

    const pairs = query.split('&');

    for (const pair of pairs) {
        const rawKey = pair.split('=', 1)[0];
        if (!rawKey) continue;

        let key;
        try {
            key = decodeURIComponent(rawKey);
        } catch (_) {
            key = rawKey;
        }

        const normalized = key.toLowerCase().replace(/[^a-z0-9]/g, '');

        if (SENSITIVE_QUERY_PARAMS.includes(normalized)) {
            return true;
        }
    }

    return false;
}

export function isSafeJsonValue(value, seen = new Set(), parentKey = null) {
    if (value === null) return true;

    const valueType = typeof value;

    if (valueType === 'boolean') {
        return true;
    }

    if (valueType === 'string') {
        return !hasSensitiveQueryParameter(value);
    }

    if (valueType === 'number') {
        return Number.isFinite(value);
    }

    if (valueType !== 'object') {
        return false;
    }

    if (seen.has(value)) {
        return false;
    }

    seen.add(value);

    let safe = true;

    if (Array.isArray(value)) {
        safe = value.every(item => isSafeJsonValue(item, seen, null));
    } else if (isPlainObject(value)) {
        safe = Object.keys(value).every(key => {
            if (key === 'networkCaptureSummary') {
                return parentKey === 'diagnostics' &&
                    isValidNetworkCaptureSummary(value[key]);
            }

            return !isForbiddenKey(key) &&
                isSafeJsonValue(value[key], seen, key);
        });
    } else {
        safe = false;
    }

    seen.delete(value);
    return safe;
}

export function stableJson(value) {
    if (value === null) return 'null';

    if (Array.isArray(value)) {
        return `[${value.map(stableJson).join(',')}]`;
    }

    if (typeof value === 'object') {
        return `{${Object.keys(value)
            .sort()
            .map(key => `${JSON.stringify(key)}:${stableJson(value[key])}`)
            .join(',')}}`;
    }

    return JSON.stringify(value);
}

export function cloneJson(value) {
    return JSON.parse(JSON.stringify(value));
}

export function freezeRecord(record) {
    if (record && typeof record === 'object' && !Object.isFrozen(record)) {
        Object.freeze(record);
        for (const value of Object.values(record)) {
            freezeRecord(value);
        }
    }

    return record;
}

export function getAffectedDocuments(record) {
    return DOCUMENT_NAMES.filter(name => record.documents[name].completed === false);
}

export function isActiveRecord(record) {
    return (
        (record.status === 'pending' || record.status === 'recovery_failed') &&
        getAffectedDocuments(record).length > 0
    );
}

export function compareIntegrityRecords(left, right) {
    const leftPriority = left.status === 'recovery_failed' ? 0 : 1;
    const rightPriority = right.status === 'recovery_failed' ? 0 : 1;

    if (leftPriority !== rightPriority) {
        return leftPriority - rightPriority;
    }

    const leftCreatedAt = Date.parse(left.createdAt);
    const rightCreatedAt = Date.parse(right.createdAt);

    if (leftCreatedAt !== rightCreatedAt) {
        return leftCreatedAt - rightCreatedAt;
    }

    if (left.commitId < right.commitId) return -1;
    if (left.commitId > right.commitId) return 1;
    return 0;
}
