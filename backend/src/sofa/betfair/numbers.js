export function normalizeMoney(str) {
    if (typeof str === 'number') return Number.isFinite(str) ? str : 0;
    if (!str) return 0;

    let cleaned = String(str).replace(/[^0-9.,-]/g, '').trim();
    if (!cleaned) return 0;

    const lastDot = cleaned.lastIndexOf('.');
    const lastComma = cleaned.lastIndexOf(',');

    if (lastDot !== -1 && lastComma !== -1) {
        if (lastComma > lastDot) {
            cleaned = cleaned.replace(/\./g, '').replace(',', '.');
        } else {
            cleaned = cleaned.replace(/,/g, '');
        }
    } else if (lastComma !== -1) {
        const parts = cleaned.split(',');
        const decimals = parts[parts.length - 1];
        const intPart = parts.slice(0, -1).join('');
        if (parts.length === 2 && decimals.length === 3 && intPart.length >= 1 && intPart.length <= 3) {
            cleaned = parts.join('');
        } else {
            cleaned = intPart + '.' + decimals;
        }
    } else if (lastDot !== -1) {
        const parts = cleaned.split('.');
        if (parts.length > 2) {
            cleaned = parts.join('');
        }
    }

    const num = parseFloat(cleaned);
    return Number.isFinite(num) ? num : 0;
}