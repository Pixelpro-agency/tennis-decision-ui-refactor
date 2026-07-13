export function makeTick(seq) {
    return {
        timestamp: `2026-06-24T10:${String(seq).padStart(2, '0')}:00.000Z`,
        data: {
            source: 'betfair',
            seq,
            runners: []
        }
    };
}

export const validTicks = Array.from(
    { length: 22 },
    (_, index) => makeTick(index + 1)
);

export const latestTick = validTicks[validTicks.length - 1];

export const betfairTimeline = {
    updatedAt: '2026-06-24T10:22:00.000Z',
    metadata: {
        eventId: 'stored-event',
        source: 'betfair',
        players: { home: 'Player A', away: 'Player B' },
        tournament: 'Test Open'
    }
};

export const sofaTimeline = { timeline: [] };

export const runtime200 = {
    lastScrapeAttemptAt: '2026-06-24T10:21:00.000Z'
};

export const runtime404 = {
    lastTechnicalErrorAt: '2026-06-24T10:30:00.000Z'
};

export const jsonTimeline = {
    updatedAt: '2026-06-24T10:22:00.000Z',
    metadata: {
        eventId: 'json-event',
        source: 'betfair'
    },
    timeline: [{ seq: 1 }]
};
