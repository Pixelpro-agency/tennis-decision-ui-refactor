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
    const selectionIds = new Set();

    for (const url of urls) {
        try {
            const parsed = new URL(url);
            const hasExplicitPort = /^[a-z][a-z0-9+.-]*:\/\/[^/]*:\d+(?:\/|$)/i.test(url);

            if (
                parsed.protocol !== 'https:' ||
                parsed.hostname !== 'graphs.betfair.it' ||
                parsed.username || parsed.password || parsed.port || hasExplicitPort
            ) {
                graphs.push({
                    url,
                    marketId: null,
                    selectionId: null,
                    valid: false,
                    error: 'bad_graph_url_invalid'
                });
                continue;
            }

            const parts = parsed.pathname.split('/').filter(Boolean);

            if (parts.length !== 3 || parts[2] !== '0') {
                graphs.push({
                    url,
                    marketId: null,
                    selectionId: null,
                    valid: false,
                    error: 'bad_graph_url_invalid'
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
                    error: 'bad_graph_url_invalid'
                });
                continue;
            }

            if (selectionIds.has(selectionId)) {
                graphs.push({
                    url,
                    marketId,
                    selectionId,
                    valid: false,
                    error: 'bad_graph_url_duplicate_selection'
                });
                continue;
            }

            marketIds.add(marketId);
            selectionIds.add(selectionId);

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
                    error: 'bad_graph_url_invalid'
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
