export function buildLayTheWinnerContext(snapshot) {
    const homeName = snapshot.players.home.name;
    const awayName = snapshot.players.away.name;

    let winner1stSet = null;
    let winner1stSetAvailable = false;
    if (snapshot.score.sets && snapshot.score.sets.length > 0) {
        const set1 = snapshot.score.sets[0];
        if (set1.home > set1.away && set1.home >= 6) {
            winner1stSet = homeName;
            winner1stSetAvailable = true;
        } else if (set1.away > set1.home && set1.away >= 6) {
            winner1stSet = awayName;
            winner1stSetAvailable = true;
        }
    }

    let breakOpportunities = "â€”";
    let breakOpportunitiesAvailable = false;
    const set2Stats = snapshot.stats?.set2 || [];
    const matchStats = snapshot.stats?.match || [];

    const bpConvertedStat = set2Stats.find(s => s.key === 'breakPointsScored' || s.name === 'Break points converted') ||
        matchStats.find(s => s.key === 'breakPointsScored' || s.name === 'Break points converted');

    if (bpConvertedStat) {
        breakOpportunities = `${homeName}: ${bpConvertedStat.home} | ${awayName}: ${bpConvertedStat.away}`;
        breakOpportunitiesAvailable = true;
    }

    let servingName = null;
    if (snapshot.serving === 'home') servingName = homeName;
    else if (snapshot.serving === 'away') servingName = awayName;

    let gameScore = null;
    if (snapshot.score.games) {
        gameScore = `${snapshot.score.games.home}-${snapshot.score.games.away}`;
    }

    let currentSet = null;
    if (snapshot.score.sets && snapshot.score.sets.length > 0) {
        currentSet = snapshot.score.sets.length;
    }

    return {
        homeName,
        awayName,
        winner1stSet,
        winner1stSetAvailable,
        breakOpportunities,
        breakOpportunitiesAvailable,
        servingName,
        gameScore,
        currentSet
    };
}
