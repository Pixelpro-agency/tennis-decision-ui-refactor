const MATCH_UNAVAILABLE_MESSAGE = 'Le statistiche punti totali non sono disponibili.';

const RECENT_UNAVAILABLE_MESSAGES = {
    point_by_point_unavailable: 'Point-by-point non disponibile.',
    insufficient_verified_completed_games:
        'Non ci sono ancora tre game completati verificabili.',
    unsupported_or_ambiguous_score_transition:
        'Il punteggio point-by-point non è decodificabile con affidabilità.'
};

const isFiniteNumber = value =>
    typeof value === 'number' && Number.isFinite(value);

const isPercentage = value =>
    isFiniteNumber(value) && value >= 0 && value <= 100;

const approximatelyEqual = (left, right, tolerance = 0.2) =>
    Math.abs(left - right) <= tolerance;

function hasSupportedContract(localContext) {
    return localContext?.version === 1 &&
        localContext.source === 'project-calculated' &&
        localContext.purpose === 'descriptive-match-context';
}

function playerNames(players) {
    return {
        homeName: typeof players?.home?.name === 'string' && players.home.name.trim()
            ? players.home.name
            : 'Home',
        awayName: typeof players?.away?.name === 'string' && players.away.name.trim()
            ? players.away.name
            : 'Away'
    };
}

function validPointShare(pointShare) {
    if (!(pointShare?.available === true &&
        isFiniteNumber(pointShare.homePoints) &&
        pointShare.homePoints >= 0 &&
        isFiniteNumber(pointShare.awayPoints) &&
        pointShare.awayPoints >= 0 &&
        isFiniteNumber(pointShare.totalPoints) &&
        pointShare.totalPoints > 0 &&
        isPercentage(pointShare.homePct) &&
        isPercentage(pointShare.awayPct))) {
        return false;
    }

    const pointsTotal = pointShare.homePoints + pointShare.awayPoints;
    const expectedHomePct = (pointShare.homePoints / pointsTotal) * 100;
    const expectedAwayPct = 100 - expectedHomePct;

    return approximatelyEqual(pointsTotal, pointShare.totalPoints, 0.000001) &&
        approximatelyEqual(pointShare.homePct + pointShare.awayPct, 100) &&
        approximatelyEqual(pointShare.homePct, expectedHomePct) &&
        approximatelyEqual(pointShare.awayPct, expectedAwayPct);
}

const oneDecimal = value => value.toFixed(1).replace('.', ',');
const percentage = value => `${oneDecimal(value)}%`;
const points = value => `${value} punti`;
const delta = value => `${value > 0 ? '+' : ''}${oneDecimal(value)} punti percentuali`;

function shareView(pointShare, names) {
    return {
        available: true,
        homeName: names.homeName,
        awayName: names.awayName,
        homePctLabel: percentage(pointShare.homePct),
        awayPctLabel: percentage(pointShare.awayPct),
        homePointsLabel: points(pointShare.homePoints),
        awayPointsLabel: points(pointShare.awayPoints),
        homePct: pointShare.homePct,
        awayPct: pointShare.awayPct
    };
}

function recentSubtitle(window) {
    const games = Number.isInteger(window?.includedGames)
        ? `${window.includedGames} game completati`
        : 'Game completati';
    const current = window?.excludedCurrentGame === true
        ? 'game corrente escluso'
        : 'game corrente non verificato';

    return `${games} · ${current}`;
}

export function getRecentUnavailableMessage(reason) {
    return RECENT_UNAVAILABLE_MESSAGES[reason] ||
        'Dati recenti non disponibili.';
}

export function buildMatchContextViewModel(localContext, players) {
    const names = playerNames(players);
    const supportedContext = hasSupportedContract(localContext)
        ? localContext
        : null;
    const matchPointShare = supportedContext?.match?.pointShare;
    const recent = supportedContext?.recent;
    const recentPointShare = recent?.pointShare;
    const comparison = supportedContext?.comparison;

    const match = validPointShare(matchPointShare)
        ? { title: 'Punti nel match', ...shareView(matchPointShare, names)}
        : {
            available: false,
            title: 'Punti nel match non disponibili',
            message: MATCH_UNAVAILABLE_MESSAGE
        };

    const hasVerifiedRecentWindow = (
        recent?.window?.kind === 'completed-games' &&
        recent.window.requestedGames === 3 &&
        recent?.window?.includedGames === 3 &&
        recent.window.excludedCurrentGame === true &&
        Array.isArray(recent.window.games) &&
        recent.window.games.length === 3
    );

    const recentView = (
        recent?.available === true &&
        hasVerifiedRecentWindow &&
        validPointShare(recentPointShare)
    )
        ? {
            title: 'Ultimi 3 game completati',
            subtitle: recentSubtitle(recent.window),
            ...shareView(recentPointShare, names)}
        : {
            available: false,
            title: 'Ultimi game non disponibili',
            message: getRecentUnavailableMessage(recent?.reason)
        };

    const expectedHomeDelta = recentPointShare?.homePct - matchPointShare?.homePct;
    const expectedAwayDelta = recentPointShare?.awayPct - matchPointShare?.awayPct;
    const comparisonIsCoherent = match.available === true &&
        recentView.available === true &&
        comparison?.available === true &&
        isFiniteNumber(comparison.homeDeltaPctPoints) &&
        isFiniteNumber(comparison.awayDeltaPctPoints) &&
        approximatelyEqual(
            comparison.homeDeltaPctPoints,
            expectedHomeDelta
        ) &&
        approximatelyEqual(
            comparison.awayDeltaPctPoints,
            expectedAwayDelta
        ) &&
        approximatelyEqual(
            comparison.homeDeltaPctPoints + comparison.awayDeltaPctPoints,
            0
        );

    const comparisonView = comparisonIsCoherent
        ? {
            available: true,
            title: 'Differenza osservata rispetto al match',
            homeName: names.homeName,
            awayName: names.awayName,
            homeDeltaLabel: delta(comparison.homeDeltaPctPoints),
            awayDeltaLabel: delta(comparison.awayDeltaPctPoints),
            observedDifferenceText: comparison.observedShift === true
                ? 'La distribuzione punti recente differisce da quella dell’intero match.'
                : null
        }
        : { available: false };

    return { match, recent: recentView, comparison: comparisonView };
}
