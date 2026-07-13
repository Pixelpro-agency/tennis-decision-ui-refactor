
export function normalizeBetfairUrl(url) {
    if (!url) return url;
    try {
        const u = new URL(url);
        for (const key of ['loginStatus', 'loginstatus', 'ott', 'm', 'ref', 'pid']) {
            u.searchParams.delete(key);
        }
        return u.toString();
    } catch {
        return url;
    }
}

export function scraperKey(url) {
    return normalizeBetfairUrl(url) || url;
}

