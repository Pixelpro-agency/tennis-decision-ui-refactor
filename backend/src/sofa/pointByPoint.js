const REGULAR_TOKENS = new Set(['0', '15', '30', '40']);
const SUPPORTED_TOKENS = new Set([...REGULAR_TOKENS, 'A']);
const NEXT_TOKEN = {
    '0': '15',
    '15': '30',
    '30': '40'
};

function createUnavailablePointByPoint() {
    return {
        available: false,
        reason: 'point_by_point_unavailable',
        semantics: null,
        sets: []
    };
}

function createUnavailableGame() {
    return {
        available: false,
        reason: 'unsupported_or_ambiguous_score_transition',
        homePoints: null,
        awayPoints: null,
        totalPoints: null,
        winners: []
    };
}

function createUnavailableWindow() {
    return {
        available: false,
        reason: 'insufficient_verified_completed_games',
        kind: 'completed-games',
        requestedGames: 3,
        includedGames: 0,
        excludedCurrentGame: true,
        games: [],
        homePoints: null,
        awayPoints: null,
        totalPoints: null,
        homePct: null,
        awayPct: null,
        leadingSide: null
    };
}

function isFiniteNumber(value) {
    return typeof value === 'number' && Number.isFinite(value);
}

function normalizeToken(value) {
    if (typeof value !== 'string') return null;

    const token = value.trim().toUpperCase();

    return SUPPORTED_TOKENS.has(token) ? token : null;
}

function sameState(left, right) {
    return left[0] === right[0] && left[1] === right[1];
}

function nextOutcomes(state) {
    const [home, away] = state;

    if (home === 'A') {
        return [
            { winner: 'home', state: null },
            { winner: 'away', state: ['40', '40'] }
        ];
    }

    if (away === 'A') {
        return [
            { winner: 'home', state: ['40', '40'] },
            { winner: 'away', state: null }
        ];
    }

    if (home === '40' && away === '40') {
        return [
            { winner: 'home', state: ['A', '40'] },
            { winner: 'away', state: ['40', 'A'] }
        ];
    }

    if (home === '40' && REGULAR_TOKENS.has(away) && away !== '40') {
        return [
            { winner: 'home', state: null },
            { winner: 'away', state: ['40', NEXT_TOKEN[away]] }
        ];
    }

    if (away === '40' && REGULAR_TOKENS.has(home) && home !== '40') {
        return [
            { winner: 'home', state: [NEXT_TOKEN[home], '40'] },
            { winner: 'away', state: null }
        ];
    }

    if (
        Object.hasOwn(NEXT_TOKEN, home) &&
        ['0', '15', '30'].includes(away)
    ) {
        return [
            { winner: 'home', state: [NEXT_TOKEN[home], away] },
            { winner: 'away', state: [home, NEXT_TOKEN[away]] }
        ];
    }

    return [];
}

function toPointState(point) {
    if (!point || typeof point !== 'object') return null;

    const home = normalizeToken(point.homePoint);
    const away = normalizeToken(point.awayPoint);

    if (!home || !away || (home === 'A' && away === 'A')) {
        return null;
    }

    return [home, away];
}

function roundToOneDecimal(value) {
    return Math.round(value * 10) / 10;
}

export function normalizePointByPoint(rawPointByPoint) {
    if (!Array.isArray(rawPointByPoint) || rawPointByPoint.length === 0) {
        return createUnavailablePointByPoint();
    }

    const sets = [];

    for (const rawSet of rawPointByPoint) {
        if (
            !rawSet ||
            !isFiniteNumber(rawSet.set) ||
            !Array.isArray(rawSet.games)
        ) {
            return createUnavailablePointByPoint();
        }

        const games = [];

        for (const rawGame of rawSet.games) {
            if (
                !rawGame ||
                !isFiniteNumber(rawGame.game) ||
                !Array.isArray(rawGame.points) ||
                rawGame.points.length === 0
            ) {
                return createUnavailablePointByPoint();
            }

            const points = [];

            for (const rawPoint of rawGame.points) {
                if (
                    !rawPoint ||
                    typeof rawPoint.homePoint !== 'string' ||
                    typeof rawPoint.awayPoint !== 'string'
                ) {
                    return createUnavailablePointByPoint();
                }

                points.push({
                    homePoint: rawPoint.homePoint,
                    awayPoint: rawPoint.awayPoint
                });
            }

            games.push({
                game: rawGame.game,
                points
            });
        }

        sets.push({
            set: rawSet.set,
            games
        });
    }

    return {
        available: true,
        reason: null,
        semantics: {
            source: 'home-away-point-transitions',
            representation: 'after-point'
        },
        sets
    };
}

export function decodeCompletedGame(game) {
    if (!game || !Array.isArray(game.points) || game.points.length === 0) {
        return createUnavailableGame();
    }

    let currentState = ['0', '0'];
    const winners = [];

    for (const point of game.points) {
        const observedState = toPointState(point);

        if (!observedState) {
            return createUnavailableGame();
        }

        const matches = nextOutcomes(currentState).filter(outcome =>
            outcome.state && sameState(outcome.state, observedState)
        );

        if (matches.length !== 1) {
            return createUnavailableGame();
        }

        winners.push(matches[0].winner);
        currentState = observedState;
    }

    const closingOutcomes = nextOutcomes(currentState)
        .filter(outcome => outcome.state === null);

    if (closingOutcomes.length !== 1) {
        return createUnavailableGame();
    }

    winners.push(closingOutcomes[0].winner);

    const homePoints = winners.filter(winner => winner === 'home').length;
    const awayPoints = winners.filter(winner => winner === 'away').length;

    return {
        available: true,
        reason: null,
        homePoints,
        awayPoints,
        totalPoints: winners.length,
        winners
    };
}

export function buildRecentCompletedGamesWindow(pointByPoint) {
    if (!pointByPoint?.available || !Array.isArray(pointByPoint.sets)) {
        return createUnavailableWindow();
    }

    const games = pointByPoint.sets
        .flatMap(set => (
            Array.isArray(set.games)
                ? set.games.map(game => ({
                    set: set.set,
                    game: game.game,
                    points: game.points
                }))
                : []
        ))
        .sort((left, right) => (
            left.set - right.set || left.game - right.game
        ));

    if (games.length < 4) {
        return createUnavailableWindow();
    }

    const candidateGames = games.slice(-4, -1);
    const decodedGames = candidateGames.map(decodeCompletedGame);

    if (decodedGames.some(game => !game.available)) {
        return createUnavailableWindow();
    }

    const homePoints = decodedGames.reduce(
        (total, game) => total + game.homePoints,
        0
    );
    const awayPoints = decodedGames.reduce(
        (total, game) => total + game.awayPoints,
        0
    );
    const totalPoints = homePoints + awayPoints;

    if (!(totalPoints > 0)) {
        return createUnavailableWindow();
    }

    const homePct = roundToOneDecimal((homePoints / totalPoints) * 100);
    const awayPct = Number((100 - homePct).toFixed(1));

    return {
        available: true,
        reason: null,
        kind: 'completed-games',
        requestedGames: 3,
        includedGames: 3,
        excludedCurrentGame: true,
        games: candidateGames.map(game => ({
            set: game.set,
            game: game.game
        })),
        homePoints,
        awayPoints,
        totalPoints,
        homePct,
        awayPct,
        leadingSide: homePoints > awayPoints
            ? 'home'
            : awayPoints > homePoints
                ? 'away'
                : 'level'
    };
}
