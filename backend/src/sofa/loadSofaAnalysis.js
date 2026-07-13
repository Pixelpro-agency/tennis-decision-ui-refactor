import { batchFetch } from './directFetch.js';

function buildSofaEndpoints(eventId) {
    return {
        event: `https://www.sofascore.com/api/v1/event/${eventId}`,
        statistics: `https://www.sofascore.com/api/v1/event/${eventId}/statistics`,
        pbp: `https://www.sofascore.com/api/v1/event/${eventId}/point-by-point`,
    };
}

export async function loadSofaPayload(eventId) {
    const endpoints = buildSofaEndpoints(eventId);
    const dataMap = await batchFetch(Object.values(endpoints));
    return { endpoints, dataMap };
}