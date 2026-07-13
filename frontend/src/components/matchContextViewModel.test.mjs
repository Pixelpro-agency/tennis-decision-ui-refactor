import assert from 'node:assert/strict';
import {
    buildMatchContextViewModel,
    getRecentUnavailableMessage
} from './matchContextViewModel.js';

const players = {
    home: { name: 'Player A' },
    away: { name: 'Player B' }
};

function createAvailableContext() {
    return {
        match: {
            pointShare: {
                available: true,
                homePoints: 38,
                awayPoints: 52,
                homePct: 42.2,
                awayPct: 57.8
            }
        },
        recent: {
            available: true,
            reason: null,
            window: {
                includedGames: 3,
                excludedCurrentGame: true
            },
            pointShare: {
                available: true,
                homePoints: 12,
                awayPoints: 9,
                homePct: 57.1,
                awayPct: 42.9
            }
        },
        comparison: {
            available: true,
            homeDeltaPctPoints: 14.9,
            awayDeltaPctPoints: -14.9,
            observedShift: true
        }
    };
}

{
    const context = createAvailableContext();
    const before = structuredClone(context);
    const viewModel = buildMatchContextViewModel(context, players);

    assert.equal(viewModel.match.available, true);
    assert.equal(viewModel.match.homePctLabel, '42,2%');
    assert.equal(viewModel.match.awayPctLabel, '57,8%');
    assert.equal(viewModel.match.homePointsLabel, '38 punti');
    assert.equal(viewModel.match.awayPointsLabel, '52 punti');
    assert.deepEqual(context, before);
}

{
    const viewModel = buildMatchContextViewModel(
        createAvailableContext(),
        players
    );

    assert.equal(viewModel.recent.available, true);
    assert.equal(viewModel.recent.subtitle, '3 game completati · game corrente escluso');
    assert.equal(viewModel.recent.homePctLabel, '57,1%');
    assert.equal(viewModel.recent.awayPctLabel, '42,9%');
    assert.equal(viewModel.recent.homePointsLabel, '12 punti');
    assert.equal(viewModel.recent.awayPointsLabel, '9 punti');
}

for (const [reason, expectedMessage] of [
    ['point_by_point_unavailable', 'Point-by-point non disponibile.'],
    [
        'insufficient_verified_completed_games',
        'Non ci sono ancora tre game completati verificabili.'
    ],
    [
        'unsupported_or_ambiguous_score_transition',
        'Il punteggio point-by-point non è decodificabile con affidabilità.'
    ],
    ['unexpected_reason', 'Dati recenti non disponibili.']
]) {
    const context = createAvailableContext();
    context.recent = {
        available: false,
        reason,
        window: null,
        pointShare: null
    };

    const viewModel = buildMatchContextViewModel(context, players);

    assert.equal(getRecentUnavailableMessage(reason), expectedMessage);
    assert.equal(viewModel.recent.available, false);
    assert.equal(viewModel.recent.message, expectedMessage);
    assert.equal(viewModel.recent.homePctLabel, undefined);
    assert.equal(viewModel.recent.homePointsLabel, undefined);
}


{
    const context = createAvailableContext();
    context.match.pointShare = {
        available: false,
        homePoints: null,
        awayPoints: null,
        homePct: null,
        awayPct: null
    };

    const viewModel = buildMatchContextViewModel(context, players);

    assert.equal(viewModel.match.available, false);
    assert.equal(viewModel.match.title, 'Punti nel match non disponibili');
    assert.equal(
        viewModel.match.message,
        'Le statistiche punti totali non sono disponibili.'
    );
    assert.equal(viewModel.match.homePctLabel, undefined);
    assert.equal(viewModel.match.awayPctLabel, undefined);
}

{
    const viewModel = buildMatchContextViewModel(
        createAvailableContext(),
        players
    );

    assert.equal(viewModel.comparison.available, true);
    assert.equal(
        viewModel.comparison.homeDeltaLabel,
        '+14,9 punti percentuali'
    );
    assert.equal(
        viewModel.comparison.awayDeltaLabel,
        '-14,9 punti percentuali'
    );
    assert.equal(
        viewModel.comparison.observedDifferenceText,
        'La distribuzione punti recente differisce da quella dell’intero match.'
    );
}

{
    const viewModel = buildMatchContextViewModel(
        createAvailableContext(),
        null
    );

    assert.equal(viewModel.match.homeName, 'Home');
    assert.equal(viewModel.match.awayName, 'Away');
    assert.equal(viewModel.recent.homeName, 'Home');
    assert.equal(viewModel.recent.awayName, 'Away');
}

{
    const context = createAvailableContext();
    context.recent.window.includedGames = 2;

    const viewModel = buildMatchContextViewModel(context, players);

    assert.equal(viewModel.recent.available, false);
    assert.equal(viewModel.recent.title, "Ultimi game non disponibili");
    assert.equal(viewModel.recent.message, "Dati recenti non disponibili.");
    assert.equal(viewModel.recent.homePctLabel, undefined);
    assert.equal(viewModel.recent.awayPctLabel, undefined);
}
console.log('matchContextViewModel: OK');
