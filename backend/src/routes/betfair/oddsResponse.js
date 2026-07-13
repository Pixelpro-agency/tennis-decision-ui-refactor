import {
fetchBetfairData as fetchBetfairDataDefault
} from '../../sofa/betfairFetch.js';

function serializePayload(payload) {
try {
return JSON.stringify(payload ?? {});
} catch (_) {
return '{}';
}
}

function getLadderUrls(query) {
const graphParam = query.ladderUrls ||
query.graphUrls ||
'';

return String(graphParam)
    .split('\n')
    .flatMap(value => value.split(','))
    .map(value => value.trim())
    .filter(Boolean);

}

export async function buildBetfairOddsResponse(
query = {},
dependencies = {}
) {
const fetchBetfairData =
typeof dependencies.fetchBetfairData === 'function'
? dependencies.fetchBetfairData
: fetchBetfairDataDefault;

const { url, sofaEventId } = query;

if (!url) {
    return {
        httpStatus: 400,
        contentType: null,
        jsonBody: {
            error: 'Missing Betfair URL'
        },
        serializedBody: null
    };
}

const ladderUrls = getLadderUrls(query);

const options = {
    ladderUrls,
    mode: query.mode || 'persistent',
    profileDir: query.profileDir || '',
    cdpUrl: query.cdpUrl || '',
    networkCapture: query.networkCapture === 'true'
};

try {
    const data = await fetchBetfairData(
        url,
        sofaEventId,
        options
    );

    return {
        httpStatus: 200,
        contentType: 'application/json',
        jsonBody: null,
        serializedBody: serializePayload(data)
    };
} catch (error) {
    console.error('Betfair Route Error:', error);

    return {
        httpStatus: 500,
        contentType: 'application/json',
        jsonBody: {
            error: 'Failed to fetch Betfair data',
            details: error?.message || String(error)
        },
        serializedBody: null
    };
}

}
