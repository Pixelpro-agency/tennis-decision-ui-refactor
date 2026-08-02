import { normalizeCdpBaseUrl } from '../utils/cdpUrl.js';

export function buildProfilePath(base) {
  return (base || '').trim();
}

const CDP_UNAVAILABLE_MESSAGE = 'CDP non disponibile. Seleziona Profilo Persistent o attendi Chrome.';
const CDP_INVALID_MESSAGE = 'URL CDP non valido.';

function requireCdpUrl(cdpUrl) {
  const normalized = normalizeCdpBaseUrl(cdpUrl);
  if (normalized === '') throw new Error(CDP_UNAVAILABLE_MESSAGE);
  if (normalized === null) throw new Error(CDP_INVALID_MESSAGE);
  return normalized;
}

async function readJson(response) {
  try {
    return await response.json();
  } catch (_) {
    return null;
  }
}

function staticApiError(code) {
  const error = new Error(code || 'login_request_failed');
  error.code = code || 'login_request_failed';
  return error;
}

export async function fetchBetfairLogLines() {
  const res = await fetch('/api/betfair/log');
  const data = await res.json();
  return data.lines || [];
}

export async function openBetfairLoginWindow({
  url = '',
  mode = 'persistent',
  profileDir,
  cdpUrl
}) {
  const body = { url, mode };
  const hasTarget = typeof url === 'string' && url.trim().length > 0;

  if (mode === 'persistent') {
    body.profileDir = buildProfilePath(profileDir);
  } else if (mode === 'cdp') {
    body.cdpUrl = hasTarget ? requireCdpUrl(cdpUrl) : (cdpUrl || '');
  }

  const response = await fetch('/api/betfair/login-window', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const payload = await readJson(response);

  if (!response.ok || payload?.ok !== true) {
    throw staticApiError(payload?.code);
  }
  return payload;
}

export async function startMatchTracking({
  sofaUrl,
  betfairUrl,
  betfairGraphUrls,
  betfairMode,
  chromeProfilePath,
  cdpUrl
}) {
  const body = { sofaUrl, betfairUrl, betfairGraphUrls, betfairMode };
  if (betfairMode === 'persistent') {
    body.chromeProfilePath = buildProfilePath(chromeProfilePath);
  } else if (betfairMode === 'cdp') {
    body.cdpUrl = requireCdpUrl(cdpUrl);
  }
  const response = await fetch('/api/match/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const payload = await readJson(response);
  if (!response.ok || payload?.ok !== true) {
    throw new Error('Unable to start match tracking.');
  }
  return payload;
}

export async function stopMatchTracking(eventId) {
  const res = await fetch('/api/match/stop', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ eventId: eventId || null })
  });
  return res.json();
}

export async function fetchSourceIdentityGateStatus(eventId, { signal } = {}) {
  const response = await fetch(
    `/api/match/${encodeURIComponent(eventId)}/source-identity-status`,
    { signal }
  );
  return { payload: await readJson(response), httpStatus: response.status };
}

export async function confirmSourceIdentityGate(
  eventId,
  { selectedPairs, confirmationText }
) {
  const response = await fetch(
    `/api/evidence/${encodeURIComponent(eventId)}/source-identity/confirm`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ selectedPairs, confirmationText })
    }
  );
  return readJson(response);
}
