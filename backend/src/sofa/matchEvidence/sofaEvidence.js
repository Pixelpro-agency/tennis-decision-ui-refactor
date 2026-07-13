import { buildSofaEventEvidence } from '../sofaEventMarkers.js';

export function buildSofaEvidence(sofaTick, recentSofaTicks, now) {
    if (!sofaTick) {
        return {
            score: null,
            server: null,
            gamePhase: null,
            setPhase: null,
            pointState: null,
            pressure: null,
            performanceDrop: null,
            recoveryRun: null,
            servicePressure: null,
            returnPressure: null,
            eventMarkers: [],
            pressureWindow: {
                active: false, type: null, playerUnderPressure: null,
                startedAt: null, durationSec: 0, severity: 'low',
                confidence: 'low', evidence: []
            }
        };
    }
    const d = sofaTick.data || {};
    const eventEvidence = buildSofaEventEvidence({
        latestTick: sofaTick,
        recentTicks: Array.isArray(recentSofaTicks) ? recentSofaTicks : [],
        now
    });
    return {
        score: d.score || null,
        server: d.serving || null,
        gamePhase: eventEvidence.gamePhase,
        setPhase: eventEvidence.setPhase,
        pointState: eventEvidence.pointState,
        pressure: eventEvidence.pressure,
        performanceDrop: eventEvidence.performanceDrop,
        recoveryRun: eventEvidence.recoveryRun,
        servicePressure: eventEvidence.servicePressure,
        returnPressure: eventEvidence.returnPressure,
        eventMarkers: eventEvidence.eventMarkers,
        pressureWindow: eventEvidence.pressureWindow
    };
}

