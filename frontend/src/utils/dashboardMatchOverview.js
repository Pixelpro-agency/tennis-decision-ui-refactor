export function buildDashboardMatchOverview({ players, score }) {
    const sets = score.sets || [];
    const currentSetIndex = sets.length;

    const rawPoint = score.point || "";
    let servingSide = null;

    if (score.service === 'home' || score.service === 'away') {
        servingSide = score.service;
    }
    else if (players.home.serving || players.home.isServing || players.home.is_serving) {
        servingSide = 'home';
    }
    else if (players.away.serving || players.away.isServing || players.away.is_serving) {
        servingSide = 'away';
    }
    else if (rawPoint.includes('*')) {
        const index = rawPoint.indexOf('*');

        if (index < rawPoint.length / 2) {
            servingSide = 'home';
        } else {
            servingSide = 'away';
        }
    }

    const cleanPoint = rawPoint.replace(/\*/g, '');
    let homePoint = '0';
    let awayPoint = '0';

    if (cleanPoint.includes('-')) {
        const parts = cleanPoint.split('-');

        if (parts.length === 2) {
            homePoint = parts[0].trim();
            awayPoint = parts[1].trim();
        }
    } else if (cleanPoint.includes(':')) {
        const parts = cleanPoint.split(':');

        if (parts.length === 2) {
            homePoint = parts[0].trim();
            awayPoint = parts[1].trim();
        }
    }

    return {
        currentSetIndex,
        matchOverviewBar: {
            label: "PANORAMICA MATCH",
            pill: {
                text: currentSetIndex > 0
                    ? `${currentSetIndex}° Set`
                    : "Inizio Match"
            },
            playersInline: {
                homeName: players.home.name,
                isHomeServing: servingSide === 'home',
                separator: "vs",
                awayName: players.away.name,
                isAwayServing: servingSide === 'away'
            },
            scoreInline: {
                home: {
                    set1: sets[0]?.home ?? '-',
                    set2: sets[1]?.home ?? '-',
                    set3: sets[2]?.home ?? '-',
                    totalSets: score.totalSetsHome ?? 0,
                    games: score.games?.home ?? 0,
                    point: homePoint
                },
                away: {
                    set1: sets[0]?.away ?? '-',
                    set2: sets[1]?.away ?? '-',
                    set3: sets[2]?.away ?? '-',
                    totalSets: score.totalSetsAway ?? 0,
                    games: score.games?.away ?? 0,
                    point: awayPoint
                },
                notes: {
                    format: "compact",
                    pointIsHighlighted: true
                }
            }
        }
    };
}