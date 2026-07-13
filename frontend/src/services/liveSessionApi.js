export function buildProfilePath(base) {
  return (base || '').trim();
}

const CDP_UNAVAILABLE_MESSAGE = 'CDP non disponibile. Seleziona Profilo Persistent o attendi Chrome.';

function requireCdpUrl(cdpUrl) {
  const normalized = typeof cdpUrl === 'string' ? cdpUrl.trim() : '';
  if (!normalized) {
    throw new Error(CDP_UNAVAILABLE_MESSAGE);
  }
  return normalized;
}

async function readJson(response) {
  try {
    return await response.json();
  } catch (_) {
    return null;
  }
}

export async function fetchBetfairLogLines() {
  const res = await fetch('/api/betfair/log');
  const data = await res.json();
  return data.lines || [];
}

export async function openBetfairLoginWindow({ url, mode, profileDir, cdpUrl }) {
  const body = { url, mode };

  if (mode === 'persistent') {
    body.profileDir = buildProfilePath(profileDir);
  } else if (mode === 'cdp') {
    body.cdpUrl = requireCdpUrl(cdpUrl);
  }

  await fetch('/api/betfair/login-window', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
}

export async function startMatchTracking({
  sofaUrl,
  betfairUrl,
  betfairGraphUrls,
  betfairMode,
  chromeProfilePath,
  cdpUrl
}) {
  const body = {
    sofaUrl,
    betfairUrl,
    betfairGraphUrls,
    betfairMode
  };

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

  return {
    payload: await readJson(response),
    httpStatus: response.status
  };
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
