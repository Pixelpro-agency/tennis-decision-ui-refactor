const activeGates = new Map();

export function setGateSession(eventId, session) {
    activeGates.set(eventId, session);
}

export function getGateSession(eventId) {
    return activeGates.get(eventId) || null;
}

export function deleteGateSession(eventId) {
    activeGates.delete(eventId);
}

export function listGateEventIds() {
    return Array.from(activeGates.keys());
}
