export function validateGraphUrls(graphUrls) {
    const urls = Array.isArray(graphUrls)
        ? graphUrls
        : (typeof graphUrls === 'string'
            ? graphUrls
                .split(/\n|,/)
                .map((value) => value.trim())
                .filter(Boolean)
            : []);

    if (urls.length === 0) {
        return {
            ok: false,
            error: 'No graph URLs provided'
        };
    }

    const graphs = [];
    const marketIds = new Set();

    for (const url of urls) {
        try {
            const parsed = new URL(url);

            if (!/^graphs\.betfair\.\w+$/i.test(parsed.hostname)) {
                graphs.push({
                    url,
                    marketId: null,
                    selectionId: null,
                    valid: false,
                    error: 'Not a graphs.betfair.* domain'
                });
                continue;
            }

            const parts = parsed.pathname.split('/').filter(Boolean);

            if (parts.length < 2) {
                graphs.push({
                    url,
                    marketId: null,
                    selectionId: null,
                    valid: false,
                    error: 'Path too short'
                });
                continue;
            }

            const [marketId, selectionId] = parts;
            const marketValid = /^\d+\.\d+$/.test(marketId);
            const selectionValid = /^\d+$/.test(selectionId);

            if (!marketValid || !selectionValid) {
                graphs.push({
                    url,
                    marketId: marketValid ? marketId : null,
                    selectionId: selectionValid ? selectionId : null,
                    valid: false,
                    error: 'marketId or selectionId format invalid'
                });
                continue;
            }

            marketIds.add(marketId);

            graphs.push({
                url,
                marketId,
                selectionId,
                valid: true
            });
        } catch (error) {
            graphs.push({
                url,
                marketId: null,
                selectionId: null,
                valid: false,
                error: 'Invalid URL'
            });
        }
    }

    const validCount = graphs.filter((graph) => graph.valid).length;
    const invalidCount = graphs.length - validCount;

    return {
        ok: validCount > 0 && invalidCount === 0,
        graphs,
        sameMarket: marketIds.size === 1,
        count: graphs.length,
        validCount,
        invalidCount
    };
}
