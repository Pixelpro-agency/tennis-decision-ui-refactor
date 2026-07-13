export const formatValue = (value) => {
    if (value === null || value === undefined || Number.isNaN(value)) return '—';
    if (typeof value === 'number') {
        const abs = Math.abs(value);
        if (abs >= 1000) return `${(value / 1000).toFixed(1)}k`;
        if (abs % 1 === 0) return value.toString();
        return value.toFixed(2);
    }
    return String(value);
};

export const formatPercent = (value) => {
    if (value === null || value === undefined || Number.isNaN(value)) return '—';
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
};
