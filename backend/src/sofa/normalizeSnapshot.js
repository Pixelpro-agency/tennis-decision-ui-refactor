import fs from 'fs';
import { normalizePointByPoint } from './pointByPoint.js';

export function normalizeSnapshot(rawData) {
    if (!rawData || rawData.error) {
        let msg = rawData?.error?.message || "Dati non ricevuti da SofaScore";
        const code = rawData?.error?.code || 500;

        if (code === 403 || msg.toLowerCase().includes("forbidden")) {
            msg = "SofaScore ha bloccato la richiesta (403 Forbidden). SofaScore utilizza sistemi anti-bot (Cloudflare/WAF) che possono bloccare i server. Prova a ricaricare la pagina tra qualche minuto o controlla se il tuo IP è temporaneamente limitato.";
        }

        throw new Error(`SofaScore API Error (${code}): ${msg}`);
    }

    const { event, statistics } = rawData;

    if (!event) {
        throw new Error("SofaScore API Error: Risposta non contiene l'oggetto 'event'");
    }

    if (process.env.SOFA_DEBUG_DUMP === '1') {
        try {
            fs.writeFileSync('debug_snapshot_dump.json', JSON.stringify(rawData, null, 2));
        } catch (e) {
            console.error("Debug write failed", e);
        }
    }

    const players = {
        home: { name: event.homeTeam?.name || "Home" },
        away: { name: event.awayTeam?.name || "Away" }
    };

    const status = {
        type: event.status.type,
        description: event.status.description
    };

    const surface = event.groundType || (event.tournament && event.tournament.groundType) || "Hard";

    const sets = [];
    let currentSetNum = 0;
    for (let i = 1; i <= 5; i++) {
        const hS = event.homeScore[`period${i}`];
        const aS = event.awayScore[`period${i}`];
        if (hS !== undefined && aS !== undefined) {
            sets.push({ home: hS, away: aS });
            currentSetNum = i;
        }
    }

    const score = {
        sets: sets,
        totalSetsHome: event.homeScore.display || 0,
        totalSetsAway: event.awayScore.display || 0,
        games: currentSetNum > 0 ? {
            home: event.homeScore[`period${currentSetNum}`] || 0,
            away: event.awayScore[`period${currentSetNum}`] || 0
        } : { home: 0, away: 0 },
        point: event.homeScore.point || event.awayScore.point ? `${event.homeScore.point || 0}-${event.awayScore.point || 0}` : "0-0"
    };

    let serving = null;
    const pbp = rawData.pbp || [];

    if (event.homeScore?.serving || event.homeScore?.isServing) serving = 'home';
    else if (event.awayScore?.serving || event.awayScore?.isServing) serving = 'away';

    if (!serving && event.serving) {
        if (event.serving == 1) serving = 'home';
        if (event.serving == 2) serving = 'away';
    }

    if (!serving && pbp.length > 0) {
        let activeSet = pbp[0];
        pbp.forEach(s => { if (s.set > activeSet.set) activeSet = s; });

        if (activeSet && activeSet.games && activeSet.games.length > 0) {
            let lastGame = activeSet.games[0];
            activeSet.games.forEach(g => { if (g.game > lastGame.game) lastGame = g; });

            if (lastGame && lastGame.score) {
                const sIdx = lastGame.score.serving;

                const hPoint = event.homeScore?.point || '0';
                const aPoint = event.awayScore?.point || '0';
                const isBetweenGames = (hPoint === '0' && aPoint === '0');

                if (isBetweenGames) {
                    serving = (sIdx == 1) ? 'away' : 'home';
                } else {
                    serving = (sIdx == 1) ? 'home' : 'away';
                }
            }
        }
    }

    if (!serving && event.firstToServe) {
        let totalTotalGames = 0;
        for (let i = 1; i < currentSetNum; i++) {
            totalTotalGames += (parseInt(event.homeScore[`period${i}`] || 0)) + (parseInt(event.awayScore[`period${i}`] || 0));
        }
        totalTotalGames += (parseInt(event.homeScore[`period${currentSetNum}`] || 0)) + (parseInt(event.awayScore[`period${currentSetNum}`] || 0));

        if (totalTotalGames % 2 === 0) {
            serving = (event.firstToServe == 1) ? 'home' : 'away';
        } else {
            serving = (event.firstToServe == 1) ? 'away' : 'home';
        }
    }


    const stats = { match: [] };
    if (statistics) {
        statistics.forEach(periodStats => {
            const statsList = [];
            if (periodStats.groups) {
                periodStats.groups.forEach(group => {
                    group.statisticsItems.forEach(item => {
                        statsList.push({
                            period: periodStats.period,
                            key: item.key ?? item.name,
                            label: item.name,
                            home: item.home,
                            away: item.away,
                            homeValue: item.homeValue,
                            awayValue: item.awayValue,
                            homeTotal: item.homeTotal ?? null,
                            awayTotal: item.awayTotal ?? null,
                            group: group.groupName
                        });
                    });
                });
            }
            if (periodStats.period === 'ALL') {
                stats.match = statsList;
            } else {
                const periodMap = {
                    '1ST': 'set1',
                    '2ND': 'set2',
                    '3RD': 'set3',
                    '4TH': 'set4',
                    '5TH': 'set5'
                };
                const key = periodMap[periodStats.period];
                if (key) {
                    stats[key] = statsList;
                }
            }
        });
    }

    if (serving) {
        players.home.isServing = (serving === 'home');
        players.away.isServing = (serving === 'away');
    }

    return {
        eventId: event.id,
        fetchedAt: Date.now(),
        players,
        status,
        surface,
        score,
        serving,
        stats,
        pointByPoint: normalizePointByPoint(rawData.pbp)
    };
}
