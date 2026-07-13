import {
    extractPlayers,
    extractServer,
    extractPointScore,
    extractGameScore,
    extractSetScore,
    inferGamePhase,
    inferSetPhase
} from './sofaEventMarkers/scoreState.js';
import { detectPointMarkers } from './sofaEventMarkers/markerDetector.js';
import { buildServicePressure, buildReturnPressure, buildPressureBlock, buildPressureWindow } from './sofaEventMarkers/pressure.js';

const PRESSURE_WINDOW_MAX_TICKS = 10;

export {
    extractPlayers,
    extractServer,
    extractPointScore,
    extractGameScore,
    extractSetScore
};

export { buildPressureWindow };

export { detectPointMarkers };

export function buildSofaEventEvidence({ latestTick, recentTicks = [], now = new Date() }) {
    const pointStr = extractPointScore(latestTick);
    const server = extractServer(latestTick);
    const players = extractPlayers(latestTick);
    const serverName = server ? (players?.[server] || null) : null;
    const receiverName = server
        ? (players?.[server === 'home' ? 'away' : 'home'] || null)
        : null;

    const context = {
        pointStr,
        server,
        serverName,
        receiverName,
        timestamp: latestTick?.timestamp || null,
        seq: latestTick?.data?.seq ?? null
    };

    const latestMarkers = latestTick ? detectPointMarkers(context) : [];
    const latestMarkerTypes = latestMarkers.map(m => m.type);

    const gamePhase = inferGamePhase(pointStr, latestMarkerTypes);
    const setPhase = latestTick ? inferSetPhase(latestTick) : 'unknown';
    const pointState = pointStr;

    const evidence = latestMarkers
        .flatMap(m => m.evidence)
        .filter((v, i, a) => a.indexOf(v) === i);

    const servicePressure = buildServicePressure(latestMarkerTypes, serverName, evidence);
    const returnPressure = buildReturnPressure(latestMarkerTypes, receiverName);

    const latestPressureMarker = latestMarkers.find(m =>
        m.type === 'BREAK_POINT' ||
        m.type === 'GAME_POINT' ||
        m.type === 'DEUCE' ||
        m.type === 'THIRTY_ALL' ||
        m.type === 'PRESSURE_POINT'
    );
    const latestPlayerUnderPressure = latestPressureMarker?.playerUnderPressure || null;

    const pressure = buildPressureBlock(
        latestMarkerTypes, latestPlayerUnderPressure,
        serverName, receiverName, evidence
    );

    const allRecentSofaTicks = [...recentTicks];
    if (latestTick && !allRecentSofaTicks.find(t => t === latestTick)) {
        allRecentSofaTicks.push(latestTick);
    }
    const windowTicks = allRecentSofaTicks.slice(-PRESSURE_WINDOW_MAX_TICKS);

    const markedWindowTicks = windowTicks
        .map(tick => {
            const ps = extractPointScore(tick);
            const sv = extractServer(tick);
            const pl = extractPlayers(tick);
            const svName = sv ? (pl?.[sv] || null) : null;
            const rvName = sv ? (pl?.[sv === 'home' ? 'away' : 'home'] || null) : null;
            const ctx = { pointStr: ps, server: sv, serverName: svName, receiverName: rvName,
                timestamp: tick?.timestamp || null, seq: tick?.data?.seq ?? null };
            const marks = detectPointMarkers(ctx);
            if (marks.length === 0) return null;
            const lastWithPressure = marks.find(m =>
                m.type === 'BREAK_POINT' || m.type === 'DEUCE' || m.type === 'THIRTY_ALL'
            );
            return {
                timestamp: tick?.timestamp || null,
                markerTypes: marks.map(m => m.type),
                playerUnderPressure: lastWithPressure?.playerUnderPressure || null,
                server: sv
            };
        })
        .filter(Boolean);

    const pressureWindow = buildPressureWindow(markedWindowTicks, now);

    return {
        gamePhase,
        setPhase,
        pointState,
        pressure,
        servicePressure,
        returnPressure,
        performanceDrop: null,
        recoveryRun: null,
        eventMarkers: latestMarkers,
        pressureWindow
    };
}
