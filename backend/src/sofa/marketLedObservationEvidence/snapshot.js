export function resolveServer(tick) {
    const d = tick?.data || {};
    if (d.serving === 'home' || d.serving === 'away') return d.serving;
    const players = d.players || {};
    if (players.home?.isServing === true) return 'home';
    if (players.away?.isServing === true) return 'away';
    return null;
}

export function extractSofaScoreSnapshot(tick) {
    const d = tick?.data || {};
    const score = d.score || {};
    const games = score.games || {};
    return {
        point: score.point ?? null,
        gamesHome: games.home ?? null,
        gamesAway: games.away ?? null,
        totalSetsHome: score.totalSetsHome ?? null,
        totalSetsAway: score.totalSetsAway ?? null,
        server: resolveServer(tick),
        statusType: d.status?.type ?? null,
        statusDescription: d.status?.description ?? null
    };
}

export function diffSofaScoreSnapshots(baseline, current) {
    if (!baseline || !current) {
        return {
            pointChanged: false,
            gameChanged: false,
            setChanged: false,
            statusChanged: false,
            serverChanged: false,
            scoreChanged: false
        };
    }

    const pointChanged = baseline.point !== current.point;
    const gameChanged =
        baseline.gamesHome !== current.gamesHome ||
        baseline.gamesAway !== current.gamesAway;
    const setChanged =
        baseline.totalSetsHome !== current.totalSetsHome ||
        baseline.totalSetsAway !== current.totalSetsAway;
    const statusChanged =
        baseline.statusType !== current.statusType ||
        baseline.statusDescription !== current.statusDescription;
    const serverChanged = baseline.server !== current.server;
    const scoreChanged = pointChanged || gameChanged || setChanged || statusChanged;

    return { pointChanged, gameChanged, setChanged, statusChanged, serverChanged, scoreChanged };
}
