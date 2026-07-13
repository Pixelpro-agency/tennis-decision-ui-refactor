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
    assert(
        namesMatch('Kecmanović, Miomir', 'Miomir Kecmanovic'),
        'accent, comma and order normalization'
    );
    assert(namesMatch("O'Connell", 'O Connell'), 'apostrophe normalization');
    assert(namesMatch('J.-J. Wolf', 'JJ Wolf'), 'hyphen and dot normalization');
    assert(
        normalizeName('Kecmanović, Miomir') === 'kecmanovic miomir',
        'normalized name is deterministic'
    );
}

{
    assert(
        namesMatch('Thiago Seyboth Wild', 'Th Seyboth Wild'),
        'multi-token given-name abbreviation matches'
    );
    assert(
        namesMatch('John Andrew Smith', 'Jo Andrew Smith'),
        'two-character given-name prefix with exact evidence matches'
    );
    assert(
        !namesMatch('John Smith', 'Jo Smith'),
        'single given token does not prefix-match'
    );
    assert(
        !namesMatch('Thiago Seyboth Wild', 'T Seyboth Wild'),
        'single-character prefix is rejected'
    );
    assert(
        !namesMatch('Thiago Seyboth Wild', 'Th Seboth Wild'),
        'non-prefix given token is rejected'
    );
    assert(
        !namesMatch('Thiago Seyboth Wild', 'Th Other Wild'),
        'incompatible given token is rejected'
    );
    assert(
        !namesMatch('Thiago Seyboth Wild', 'Th Seyboth Woods'),
        'surname mismatch is rejected'
    );
}

{
    const normalizedSpecialCharacters = '\u0141ukasz \u00c6 \u0152 \u00df \u0110 \u00de \u0131';

    assert(normalizeName(normalizedSpecialCharacters) === 'lukasz ae oe ss d th i', 'explicit special-character normalization');
    assert(namesMatch('\u0141ukasz', 'Lukasz'), 'stroke L matches ASCII L');
    assert(namesMatch('\u00d8', 'O'), 'stroke O matches ASCII O');
    assert(namesMatch('\u00c6', 'Ae'), 'AE ligature matches Ae');
    assert(namesMatch('\u0152', 'Oe'), 'OE ligature matches Oe');
    assert(namesMatch('\u00df', 'ss'), 'sharp S matches ss');
    assert(namesMatch('\u0110', 'D') && namesMatch('\u00d0', 'D'), 'D stroke and eth match D');
    assert(namesMatch('\u00de', 'Th'), 'thorn matches Th');
    assert(namesMatch('\u0131', 'i'), 'dotless i matches i');
    assert(namesMatch("O'Connell", 'OConnell'), 'compact apostrophe form matches');
    assert(!namesMatch('O Connell', 'OConnell'), 'spaced apostrophe-style compact form requires confirmation');
    assert(namesMatch('J.-J. Wolf', 'J J Wolf'), 'separate initials match');
    assert(namesMatch('L. Sonego', 'Lorenzo Sonego'), 'single initial matches given name');
    assert(namesMatch('J L Struff', 'Jan-Lennard Struff'), 'multiple initials match compound given name');
    assert(namesMatch('Juan Mart\u00edn del Potro', 'Del Potro'), 'compound surname-only form matches');
    assert(namesMatch('Juan Mart\u00edn del Potro', 'Potro'), 'surname-base-only form matches');
    assert(!namesMatch('Carlos', 'Carlos Alcaraz'), 'single given name does not match full name');
    assert(!namesMatch('A Li', 'Ali'), 'incompatible initials do not compact-match');
    assert(!namesMatch('K. Sonego', 'Lorenzo Sonego'), 'incompatible initial is rejected');
}

{
    assert(namesMatch('Juan Martín del Potro', 'Del Potro'), 'compound surname form matches');
    assert(namesMatch('Juan Martín del Potro', 'Potro'), 'compound surname base matches');
    assert(namesMatch('Juan Martín del Potro', 'DelPotro'), 'compact compound surname matches');
    assert(namesMatch('Alex de Minaur', 'de Minaur'), 'compound surname with de matches');
    assert(namesMatch('Alex de Minaur', 'Minaur'), 'compound surname base with de matches');
    assert(namesMatch('Alex de Minaur', 'deMinaur'), 'compact compound surname with de matches');
    assert(normalizeName('\u1E9E') === 'ss', 'capital sharp S normalizes to ss');
    assert(namesMatch('\u1E9E', 'ss'), 'capital sharp S matches ss');
    assert(!namesMatch('del Potro', 'van Potro'), 'different compound particles do not match on base surname');
    assert(!namesMatch('de Minaur', 'la Minaur'), 'different compound particles do not match on base surname');
    assert(!namesMatch('St Clair', 'Van Clair'), 'different compound particles do not match on Clair');
    assert(!namesMatch('de la Cruz', 'van Cruz'), 'different compound structures do not match on Cruz');
}

{
    assert(
        namesMatch('Andrew Fenty', 'And Fenty'),
        'three-character single given-name prefix matches'
    );
    assert(
        !namesMatch('Andrew Fenty', 'An Fenty'),
        'two-character single given-name prefix is rejected'
    );

    const identity = buildSourceIdentity({
        sofaTick: makeSofaTick('Andrew Fenty', 'Karl Poling'),
        betfairTick: makeBetfairTick({
            runners: [
                { name: 'And Fenty', selectionId: 201 },
                { name: 'K Poling', selectionId: 202 }
            ]
        })
    });

    assert(
        identity.status === 'aligned',
        'unique single given-name abbreviation aligns'
    );
    assert(
        identity.normalizedPairs.some(pair => (
            pair.sofaPlayer === 'Andrew Fenty' &&
            pair.betfairRunner === 'And Fenty' &&
            pair.match === true
        )),
        'Andrew Fenty is paired with And Fenty'
    );
}

finish('sourceIdentity/names');
