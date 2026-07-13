import {
    buildBetfairIdentitySignature,
    buildSourceIdentity,
    namesMatch,
    normalizeName,
    selectActiveBetfairMarketEpoch
} from '../sourceIdentity.js';
import {
    assert,
    finish,
    makeBetfairTick,
    makeSofaTick,
    makeUnsignedBetfairTick
} from './sourceIdentityTestFixtures.mjs';

{
    const identity = buildSourceIdentity({
        sofaTick: makeSofaTick('Lorenzo Sonego', 'Miomir Kecmanović'),
        betfairTick: makeBetfairTick({
            runners: [
                { name: 'Sonego', selectionId: 11 },
                { name: 'Kecmanovic', selectionId: 12 }
            ]
        })
    });

    assert(identity.status === 'aligned', 'unique surname runners align');
    assert(identity.normalizedPairs.length === 2, 'aligned identity exposes two pairs');
    assert(
        identity.normalizedPairs.some(pair => pair.sofaPlayer === 'Lorenzo Sonego' && pair.betfairRunner === 'Sonego' && pair.match === true),
        'Sonego surname pair is present'
    );
}

{
    const identity = buildSourceIdentity({
        sofaTick: makeSofaTick('Lorenzo Sonego', 'Miomir Kecmanović'),
        betfairTick: makeBetfairTick({
            runners: [
                { name: 'Jan-Lennard Struff', selectionId: 21 },
                { name: 'Nuno Borges', selectionId: 22 }
            ]
        })
    });

    assert(identity.status === 'mismatch', 'complete different runners mismatch');
    assert(
        identity.reasons.includes('SofaScore and Betfair player names do not match'),
        'mismatch reason is explicit'
    );
}

{
    const apostropheIdentity = buildSourceIdentity({
        sofaTick: makeSofaTick("O'Connell", 'Alice Smith'),
        betfairTick: makeBetfairTick({
            runners: [
                { name: 'OConnell', selectionId: 101 },
                { name: 'Smith', selectionId: 102 }
            ]
        })
    });

    const typographicApostropheIdentity = buildSourceIdentity({
        sofaTick: makeSofaTick('D’Angelo', 'Alice Smith'),
        betfairTick: makeBetfairTick({
            runners: [
                { name: 'DAngelo', selectionId: 111 },
                { name: 'Smith', selectionId: 112 }
            ]
        })
    });

    assert(apostropheIdentity.status === 'aligned', "O'Connell and OConnell align with an original apostrophe");
    assert(typographicApostropheIdentity.status === 'aligned', 'D’Angelo and DAngelo align with a typographic apostrophe');
}

finish('sourceIdentity/classification');
