
export function getSofaEventId(url) {
    if (!url) return '';
    const match = url.match(/#id[=:](\d+)/i) || url.match(/\/event\/(\d+)/) || url.match(/\/match\/[^\/]+\/([^\/]+)\/(\d+)/) || url.match(/\/match\/([^\/]+)\/(\d+)$/);
    if (match) return match[match.length - 1];
    const digitMatch = url.match(/[^\d](\d{7,9})(?:[^\d]|$)/);
    if (digitMatch) return digitMatch[1];
    const endMatch = url.match(/(\d{6,})/);
    return endMatch ? endMatch[1] : '';
}

export function parseGraphUrls(text) {
    if (!text) return [];
    return text.split(/\n|,/).map(s => s.trim()).filter(Boolean);
}


export async function safeFetchJson(input, init = {}) {
    const url = typeof input === 'string' ? input : input.url;
    const res = await fetch(input, init);
    const text = await res.text();

    if (text.trim() === '') {
        throw new Error(`Risposta vuota da ${url} (status ${res.status})`);
    }

    let data;
    try {
        data = JSON.parse(text);
    } catch (parseErr) {
        const snippet = text.length > 120 ? text.slice(0, 120) + '...' : text;
        throw new Error(`Risposta non JSON da ${url} (status ${res.status}): ${snippet}`);
    }

    return { res, data };
}

