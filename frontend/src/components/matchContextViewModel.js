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
    return pointShare?.available === true &&
        isFiniteNumber(pointShare.homePoints) &&
        pointShare.homePoints >= 0 &&
        isFiniteNumber(pointShare.awayPoints) &&
        pointShare.awayPoints >= 0 &&
        isPercentage(pointShare.homePct) &&
        isPercentage(pointShare.awayPct);
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
    const matchPointShare = localContext?.match?.pointShare;
    const recent = localContext?.recent;
    const recentPointShare = recent?.pointShare;
    const comparison = localContext?.comparison;

    const match = validPointShare(matchPointShare)
        ? { title: 'Punti nel match', ...shareView(matchPointShare, names)}
        : {
            available: false,
            title: 'Punti nel match non disponibili',
            message: MATCH_UNAVAILABLE_MESSAGE
        };

    const hasVerifiedRecentWindow = (
        recent?.window?.includedGames === 3 &&
        recent.window.excludedCurrentGame === true
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

    const comparisonView = comparison?.available === true &&
        isFiniteNumber(comparison.homeDeltaPctPoints) &&
        isFiniteNumber(comparison.awayDeltaPctPoints)
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
