export const PERSISTENCE_INCOMPLETE_REASON =
    'Persistence incomplete: canonical cross-source evidence unavailable';

export function isPersistenceConflict(integrity) {
    return integrity?.status === 'partial_persistence' ||
        integrity?.status === 'recovery_failed';
}
