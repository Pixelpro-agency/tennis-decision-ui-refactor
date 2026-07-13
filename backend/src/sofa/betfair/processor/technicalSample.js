const defaultEventStatus = { hasFinished: false, statusText: null, source: null };

function isPlainObject(value) {
    return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function hasOwn(value, property) {
    return Object.prototype.hasOwnProperty.call(value, property);
}

export function parseBetfairTotalMatched(value) {
    if (typeof value === 'number') {
        return Number.isFinite(value) ? value : null;
    }

    if (typeof value !== 'string') {
        return null;
    }

    const trimmed = value.trim();
    if (!trimmed) {
        return null;
    }

    const normalized = trimmed.replace(/[^\d.,+-]/g, '').replace(/,/g, '');
    if (!/\d/.test(normalized)) {
        return null;
    }

    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
}

export function classifyBetfairTechnicalSample(raw) {
    if (!isPlainObject(raw)) {
        return { usable: false, reason: 'invalid_raw', totalMatched: null };
    }

    if (hasOwn(raw, 'error')) {
        return { usable: false, reason: 'raw_error', totalMatched: null };
    }

    if (hasOwn(raw, 'api_error')) {
        return { usable: false, reason: 'api_error', totalMatched: null };
    }

    if (!Array.isArray(raw.runners)) {
        return { usable: false, reason: 'runners_missing', totalMatched: null };
    }

    if (raw.runners.length === 0) {
        return { usable: false, reason: 'runners_empty', totalMatched: null };
    }

    if (!isPlainObject(raw.market_info) || !hasOwn(raw.market_info, 'total_matched')) {
        return { usable: false, reason: 'total_matched_missing', totalMatched: null };
    }

    const totalMatched = parseBetfairTotalMatched(raw.market_info.total_matched);
    if (totalMatched === null) {
        return { usable: false, reason: 'total_matched_invalid', totalMatched };
    }

    if (totalMatched <= 0) {
        return { usable: false, reason: 'total_matched_non_positive', totalMatched };
    }

    return { usable: true, reason: null, totalMatched };
}

export function buildTechnicalFailureResult(raw, technicalFailure) {
    const source = isPlainObject(raw) ? raw : {};

    return {
        ...source,
        runners: Array.isArray(source.runners) ? source.runners : [],
        market_info: isPlainObject(source.market_info) ? source.market_info : {},
        network_capture: source.network_capture,
        diagnostics: source.diagnostics || {},
        graph_diagnostics: source.graph_diagnostics || {},
        event_status: source.event_status || defaultEventStatus,
        technicalFailure
    };
}
