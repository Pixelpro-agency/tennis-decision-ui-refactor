const DEGRADED_STATUSES = new Set([
    'partial_persistence',
    'recovery_failed',
    'degraded'
]);

export function buildPersistenceViewState({
    sessionActive = false,
    dashboardReady = false,
    sofaIntegrity = null,
    betfairIntegrity = null,
    evidenceIntegrity = null,
    evidencePersistenceComplete = null,
    sofaError = null,
    betfairError = null,
    evidenceError = null
} = {}) {
    if (!sessionActive) {
        return { status: 'inactive', label: 'Sessione non attiva' };
    }

    const integrity = [sofaIntegrity, betfairIntegrity, evidenceIntegrity].filter(Boolean);
    const degraded = integrity.find(item => DEGRADED_STATUSES.has(item?.status));

    if (degraded || evidencePersistenceComplete === false) {
        return {
            status: 'degraded',
            label: 'Dati persistiti parziali',
            integrity
        };
    }

    if (sofaError || betfairError || evidenceError) {
        return { status: 'error', label: 'Dati live non disponibili', integrity };
    }

    if (!dashboardReady) {
        return { status: 'waiting', label: 'Attesa dati della sessione corrente', integrity };
    }

    return { status: 'current', label: 'Dati della sessione corrente', integrity };
}
