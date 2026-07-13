import { batchFetch } from './backend/src/sofa/directFetch.js';
import { normalizeSnapshot } from './backend/src/sofa/normalizeSnapshot.js';
import { calculateMomentum } from './backend/src/sofa/calculateMomentum.js';

const eventId = '16323549';
const endpoints = {
  event: `https://www.sofascore.com/api/v1/event/${eventId}`,
  statistics: `https://www.sofascore.com/api/v1/event/${eventId}/statistics`,
  pbp: `https://www.sofascore.com/api/v1/event/${eventId}/point-by-point`,
  momentum: `https://www.sofascore.com/api/v1/event/${eventId}/tennis-power-rankings`
};

const dataMap = await batchFetch(Object.values(endpoints));

const eventData = dataMap[endpoints.event];
const statsData = dataMap[endpoints.statistics];
const pbpData = dataMap[endpoints.pbp];
const momentumRaw = dataMap[endpoints.momentum];

const snapshotRaw = {
  event: eventData.event,
  statistics: statsData && !statsData.error ? statsData.statistics : null,
  pbp: pbpData && !pbpData.error ? pbpData.pointByPoint : null
};

const snapshot = normalizeSnapshot(snapshotRaw);
const momentum = calculateMomentum(momentumRaw, snapshot);

console.log(JSON.stringify({
  eventId: snapshot.eventId,
  players: snapshot.players,
  score: snapshot.score,
  status: snapshot.status,
  statsCount: snapshot.stats?.match?.length || 0,
  momentum,
  momentumRawError: momentumRaw?.error || null,
  momentumRawStatus: momentumRaw?.status || null
}, null, 2));
