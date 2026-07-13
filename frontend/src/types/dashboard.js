import {
    buildKeyStatsRows,
    buildKeyStatsTabs
} from '../utils/dashboardStats.js';
import { buildDashboardMatchOverview } from '../utils/dashboardMatchOverview.js';

export const createMockDashboardViewModel = () => {
    return {
        app: {
            name: "Tennis Decision",
            theme: "dark",
            layout: {
                type: "dashboard",
                sections: ["topBar", "matchOverviewBar", "mainGrid", "totPlaceholder"],
            },
        },
        localContext: null,
        players: {
            home: { name: "Liam Alvarez" },
            away: { name: "Mario Garcia" }
        },
        topBar: {
            left: {
                title: "Tennis Decision",
            },
            statusBadges: [
                {
                    id: "backend",
                    label: "BACKEND: OK",
                    state: "ok",
                },
                {
                    id: "polling",
                    label: "POLLING: ON",
                    state: "on",
                },
            ],
            right: {
                lastUpdate: {
                    label: "Ultimo agg.",
                    value: "2s fa",
                },
                icons: [
                    {
                        id: "clock",
                        type: "time",
                    },
                ],
            },
        },
        matchOverviewBar: {
            label: "PANORAMICA MATCH",
            pill: {
                text: "2° Set",
            },
            playersInline: {
                homeName: "Liam Alvarez",
                isHomeServing: true,
                separator: "vs",
                awayName: "Mario Garcia",
                isAwayServing: false,
            },
            scoreInline: {
                home: {
                    set1: 6,
                    set2: 1,
                    set3: 1,
                    games: 0,
                    point: "15"
                },
                away: {
                    set1: 3,
                    set2: 0,
                    set3: 0,
                    games: 0,
                    point: "40"
                },
                notes: {
                    format: "compact",
                    pointIsHighlighted: true,
                },
            },
        },
        mainGrid: {
            columns: 2,
            leftCard: {
                id: "matchContext",
                title: "Contesto punti"
            },
            rightCard: {
                id: "keyStats",
                title: "STATISTICHE",
                tabs: [
                    {
                        id: "total",
                        label: "TOTALE",
                        active: true,
                    },
                    {
                        id: "set_1",
                        label: "SET 1",
                        active: false,
                    },
                    {
                        id: "set_2",
                        label: "SET 2",
                        active: false,
                    },
                ],
                rows: {
                    total: [
                        { key: "aces", label: "ACES", homeValue: 1, awayValue: 2, bar: { type: "comparison", homeShare: 33, awayShare: 67 } },
                        { key: "firstServePoints", label: "PUNTI PRIMA DI SERVIZIO", homeValue: 1, awayValue: "10/18 (56%)", bar: { type: "comparison", homeShare: 10, awayShare: 90 } },
                        { key: "firstServePoints2", label: "PUNTI PRIMA DI SERVIZIO", homeValue: "14/20 (70%)", awayValue: 3, bar: { type: "comparison", homeShare: 82, awayShare: 18 } },
                        { key: "breakPointsConverted", label: "PALLE BREAK CONVERTITE", homeValue: 3, awayValue: 3, bar: { type: "comparison", homeShare: 50, awayShare: 50 } },
                        { key: "servicePointsWon", label: "PUNTI AL SERVIZIO VINTI", homeValue: "9/10 (90%)", awayValue: "12/13 (62%)", bar: { type: "comparison", homeShare: 59, awayShare: 41, highlight: "away" } },
                        { key: "firstServePct", label: "PRIMA DI SERVIZIO", homeValue: "9/10 (90%)", awayValue: "12/18 (92%)", bar: { type: "comparison", homeShare: 49, awayShare: 51, highlight: "away" } },
                        { key: "serviceGamesPlayed", label: "GAME AL SERVIZIO GIOCATI", homeValue: "5/10 (50%)", awayValue: "2/5 (40%)", bar: { type: "comparison", homeShare: 56, awayShare: 44 } },
                    ],
                    set_1: [
                        { key: "aces", label: "ACES", homeValue: 1, awayValue: 0, bar: { type: "comparison", homeShare: 100, awayShare: 0 } },
                        { key: "firstServePoints", label: "PUNTI PRIMA DI SERVIZIO", homeValue: 1, awayValue: "3/6 (50%)", bar: { type: "comparison", homeShare: 20, awayShare: 80 } },
                        { key: "firstServePoints2", label: "PUNTI PRIMA DI SERVIZIO", homeValue: "8/10 (80%)", awayValue: 1, bar: { type: "comparison", homeShare: 89, awayShare: 11 } },
                        { key: "breakPointsConverted", label: "PALLE BREAK CONVERTITE", homeValue: 1, awayValue: 0, bar: { type: "comparison", homeShare: 100, awayShare: 0 } },
                        { key: "servicePointsWon", label: "PUNTI AL SERVIZIO VINTI", homeValue: "6/6 (100%)", awayValue: "3/4 (75%)", bar: { type: "comparison", homeShare: 58, awayShare: 42, highlight: "home" } },
                        { key: "firstServePct", label: "PRIMA DI SERVIZIO", homeValue: "6/6 (100%)", awayValue: "3/5 (60%)", bar: { type: "comparison", homeShare: 60, awayShare: 40, highlight: "home" } },
                    ],
                    set_2: [
                        { key: "aces", label: "ACES", homeValue: 0, awayValue: 2, bar: { type: "comparison", homeShare: 0, awayShare: 100 } },
                        { key: "firstServePoints", label: "PUNTI PRIMA DI SERVIZIO", homeValue: 0, awayValue: "7/12 (58%)", bar: { type: "comparison", homeShare: 0, awayShare: 100 } },
                        { key: "firstServePoints2", label: "PUNTI PRIMA DI SERVIZIO", homeValue: "6/10 (60%)", awayValue: 2, bar: { type: "comparison", homeShare: 75, awayShare: 25 } },
                        { key: "breakPointsConverted", label: "PALLE BREAK CONVERTITE", homeValue: 2, awayValue: 3, bar: { type: "comparison", homeShare: 40, awayShare: 60 } },
                        { key: "servicePointsWon", label: "PUNTI AL SERVIZIO VINTI", homeValue: "3/4 (75%)", awayValue: "9/9 (100%)", bar: { type: "comparison", homeShare: 45, awayShare: 55, highlight: "away" } },
                    ]
                },
                uiNotes: {
                    rowStyle: "label-centered-with-left-right-values",
                    bars: "thin-progress",
                    highlightColorUsage: "away-side sometimes highlighted",
                },
            },
        },
        totPlaceholder: {
            card: {
                title: "Input Manuale TOT",
                subtitle: "PRESTO DISPONIBILE",
                icon: "calendar",
                state: "disabled",
            },
        },
    };
};

export const mapBackendDataToDashboard = (backendData, statusInfo) => {
    if (!backendData || !backendData.snapshot) return null;

    const { snapshot } = backendData;
    const { players, score, stats } = snapshot;

    const keyStatsRows = buildKeyStatsRows(stats);
    const tabs = buildKeyStatsTabs(keyStatsRows);

    const { matchOverviewBar } = buildDashboardMatchOverview({ players, score });

    return {
        app: {
            name: "Tennis Decision",
            theme: "dark",
            layout: { type: "dashboard", sections: ["topBar", "matchOverviewBar", "mainGrid", "totPlaceholder"] }
        },
        localContext: backendData?.localContext ?? null,
        players: players ?? null,
        betfair: statusInfo?.betfair || null,
        topBar: {
            left: { title: "Tennis Decision" },
            statusBadges: [
                {
                    id: "backend",
                    label: `BACKEND: ${statusInfo?.serverStatus === 'ok' ? 'OK' : 'ERR'}`,
                    state: statusInfo?.serverStatus === 'ok' ? 'ok' : 'error'
                },
                {
                    id: "polling",
                    label: `POLLING: ${statusInfo?.isPolling ? 'ON' : 'OFF'}`,
                    state: statusInfo?.isPolling ? 'on' : 'off'
                }
            ],
            right: {
                lastUpdate: {
                    label: "Ultimo agg.",
                    value: statusInfo?.lastUpdate ? new Date(statusInfo.lastUpdate).toISOString() : "Mai"
                },
                icons: [{ id: "clock", type: "time" }]
            }
        },
        matchOverviewBar,
        mainGrid: {
            columns: 2,
            leftCard: {
                id: "matchContext",
                title: "Contesto punti"
            },
            rightCard: {
                id: "keyStats",
                title: "STATISTICHE",
                tabs: tabs,
                rows: keyStatsRows,
                uiNotes: {}
            }
        },
        totPlaceholder: {
            card: {
                title: "Input Manuale TOT",
                subtitle: "PRESTO DISPONIBILE",
                icon: "calendar",
                state: "disabled"
            }
        }
    };
};