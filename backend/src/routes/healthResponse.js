const PUBLIC_ROLES = ['sofa_tracking', 'betfair_tracking', 'betfair_login'];
const TOKEN_PATTERN = /^[a-z0-9_:-]{1,80}$/i;

function publicEntry(value) {
    if (!value || typeof value !== 'object' || !PUBLIC_ROLES.includes(value.role)) return null;
    if (typeof value.executionId !== 'string' || !TOKEN_PATTERN.test(value.executionId)) return null;
    if (typeof value.status !== 'string' || !TOKEN_PATTERN.test(value.status)) return null;
    const pid = value.pid === null || value.pid === undefined
        ? null
        : (Number.isInteger(value.pid) && value.pid > 0 ? value.pid : null);
    const startedAt = typeof value.startedAt === 'string' ? value.startedAt : null;
    return { executionId: value.executionId, role: value.role, pid, status: value.status, startedAt };
}

export function buildPublicPythonProcessSnapshot(snapshot) {
    const entries = Array.isArray(snapshot?.entries)
        ? snapshot.entries.map(publicEntry).filter(Boolean)
        : [];
    const byRole = Object.fromEntries(PUBLIC_ROLES.map(role => [role, 0]));
    let stopping = 0;
    for (const entry of entries) {
        byRole[entry.role] += 1;
        if (entry.status === 'stopping' || entry.status === 'force_stopping') stopping += 1;
    }
    return { active: entries.length, stopping, byRole, entries };
}

export function buildHealthResponse({ instanceId, pid, startedAt, timestamp, pythonSnapshot, repositoryIdentity, storageIdentity }) {
    return {
        ok: true,
        service: 'backend',
        project: 'tennis-decision-ui',
        instanceId,
        pid,
        startedAt,
        timestamp,
        repositoryIdentity,
        storageIdentity,
        pythonProcesses: buildPublicPythonProcessSnapshot(pythonSnapshot)
    };
}
