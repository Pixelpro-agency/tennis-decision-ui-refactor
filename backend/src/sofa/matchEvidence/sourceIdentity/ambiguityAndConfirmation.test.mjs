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
        sofaTick: makeSofaTick('Gonzalo Villanueva', 'Thiago Seyboth Wild'),
        betfairTick: makeBetfairTick({
            runners: [
                { name: 'Villanueva', selectionId: 15 },
                { name: 'Th Seyboth Wild', selectionId: 16 }
            ]
        })
    });

    assert(
        identity.status === 'aligned',
        'abbreviated Betfair runner aligns deterministically'
    );
    assert(
        identity.normalizedPairs.some(pair => (
            pair.sofaPlayer === 'Gonzalo Villanueva' &&
            pair.betfairRunner === 'Villanueva' &&
            pair.match === true
        )),
        'Villanueva surname pair is present'
    );
    assert(
        identity.normalizedPairs.some(pair => (
            pair.sofaPlayer === 'Thiago Seyboth Wild' &&
            pair.betfairRunner === 'Th Seyboth Wild' &&
            pair.match === true
        )),
        'abbreviated given-name pair is present'
    );
}

{
    const identity = buildSourceIdentity({
        sofaTick: makeSofaTick('Thomas Seyboth Wild', 'Thiago Seyboth Wild'),
        betfairTick: makeBetfairTick({
            runners: [
                { name: 'Th Seyboth Wild', selectionId: 17 },
                { name: 'Wild', selectionId: 18 }
            ]
        })
    });

    assert(
        identity.status === 'pending',
        'ambiguous abbreviated runner remains pending'
    );
}

{
    const missing = buildSourceIdentity({
        sofaTick: makeSofaTick('Lorenzo Sonego', 'Miomir Kecmanović'),
        betfairTick: makeBetfairTick({
            runners: [{ name: 'Sonego', selectionId: 31 }]
        })
    });

    const ambiguous = buildSourceIdentity({
        sofaTick: makeSofaTick('John Smith', 'Peter Smith'),
        betfairTick: makeBetfairTick({
            runners: [
                { name: 'Smith', selectionId: 41 },
                { name: 'Jordan', selectionId: 42 }
            ]
        })
    });

    assert(missing.status === 'pending', 'missing runner data is pending');
    assert(ambiguous.status === 'mismatch', 'ambiguous surname with unrelated runner is mismatch');
    assert(
        !ambiguous.reasons.includes(
            'Partial SofaScore/Betfair player-name evidence requires confirmation'
        ),
        'ambiguous surname with unrelated runner is not a manual-confirmation case'
    );
}

{
    const incompatibleCompoundIdentity = buildSourceIdentity({
        sofaTick: makeSofaTick('Juan Martín del Potro', 'Alex de Minaur'),
        betfairTick: makeBetfairTick({
            runners: [
                { name: 'van Potro', selectionId: 91 },
                { name: 'Minaur', selectionId: 92 }
            ]
        })
    });

    assert(
        incompatibleCompoundIdentity.status === 'pending',
        'partial compound-name evidence remains pending'
    );
    assert(
        incompatibleCompoundIdentity.status !== 'aligned',
        'incompatible compound Betfair runner never aligns'
    );
}

{
    const firstNameRunner = buildSourceIdentity({
        sofaTick: makeSofaTick('Carlos Alcaraz', 'Miomir Kecmanovi\u{0107}'),
        betfairTick: makeBetfairTick({
            runners: [
                { name: 'Carlos', selectionId: 51 },
                { name: 'Kecmanovic', selectionId: 52 }
            ]
        })
    });

    const compoundSurnameRunner = buildSourceIdentity({
        sofaTick: makeSofaTick('Juan Mart\u00edn del Potro', 'Miomir Kecmanovi\u{0107}'),
        betfairTick: makeBetfairTick({
            runners: [
                { name: 'Del Potro', selectionId: 61 },
                { name: 'Kecmanovic', selectionId: 62 }
            ]
        })
    });

    const surnameBaseRunner = buildSourceIdentity({
        sofaTick: makeSofaTick('Juan Mart\u00edn del Potro', 'Miomir Kecmanovi\u{0107}'),
        betfairTick: makeBetfairTick({
            runners: [
                { name: 'Potro', selectionId: 71 },
                { name: 'Kecmanovic', selectionId: 72 }
            ]
        })
    });

    assert(firstNameRunner.status === 'pending', 'single Betfair given name is partial evidence');
    assert(compoundSurnameRunner.status === 'aligned', 'compound surname runner aligns');
    assert(surnameBaseRunner.status === 'aligned', 'single deterministic surname runner aligns');
}

{
    const expectedReason = 'Compact apostrophe-style name requires manual confirmation';

    const oConnellIdentity = buildSourceIdentity({
        sofaTick: makeSofaTick('O Connell', 'Alice Smith'),
        betfairTick: makeBetfairTick({
            runners: [
                { name: 'OConnell', selectionId: 121 },
                { name: 'Smith', selectionId: 122 }
            ]
        })
    });

    const oSmithIdentity = buildSourceIdentity({
        sofaTick: makeSofaTick('O Smith', 'Alice Jones'),
        betfairTick: makeBetfairTick({
            runners: [
                { name: 'OSmith', selectionId: 131 },
                { name: 'Jones', selectionId: 132 }
            ]
        })
    });

    const dSmithIdentity = buildSourceIdentity({
        sofaTick: makeSofaTick('D Smith', 'Alice Jones'),
        betfairTick: makeBetfairTick({
            runners: [
                { name: 'DSmith', selectionId: 141 },
                { name: 'Jones', selectionId: 142 }
            ]
        })
    });

    const lSmithIdentity = buildSourceIdentity({
        sofaTick: makeSofaTick('L Smith', 'Alice Jones'),
        betfairTick: makeBetfairTick({
            runners: [
                { name: 'LSmith', selectionId: 151 },
                { name: 'Jones', selectionId: 152 }
            ]
        })
    });

    assert(oConnellIdentity.status === 'pending', 'O Connell and OConnell require manual confirmation');
    assert(oConnellIdentity.reasons.includes(expectedReason), 'O Connell pending reason is explicit');
    assert(oSmithIdentity.status === 'pending', 'O Smith and OSmith require manual confirmation');
    assert(oSmithIdentity.reasons.includes(expectedReason), 'O Smith pending reason is explicit');
    assert(dSmithIdentity.status === 'pending', 'D Smith and DSmith require manual confirmation');
    assert(dSmithIdentity.reasons.includes(expectedReason), 'D Smith pending reason is explicit');
    assert(lSmithIdentity.status === 'pending', 'L Smith and LSmith require manual confirmation');
    assert(lSmithIdentity.reasons.includes(expectedReason), 'L Smith pending reason is explicit');
}

{
    const identity = buildSourceIdentity({
        sofaTick: makeSofaTick('Andrew Fenty', 'Anders Fenty'),
        betfairTick: makeBetfairTick({
            runners: [
                { name: 'And Fenty', selectionId: 211 },
                { name: 'Fenty', selectionId: 212 }
            ]
        })
    });

    assert(
        identity.status === 'pending',
        'ambiguous single given-name abbreviation remains pending'
    );
}

{
    const sofaTick = makeSofaTick('Yannick Sinner', 'Taylor Fritz');
    const betfairTicks = [
        makeBetfairTick({
            runners: [
                { name: 'Y. Sinner', selectionId: 301 },
                { name: 'T. Fritz', selectionId: 302 }
            ]
        }),
        makeBetfairTick({
            runners: [
                { name: 'Sinner', selectionId: 311 },
                { name: 'Fritz', selectionId: 312 }
            ]
        }),
        makeBetfairTick({
            runners: [
                { name: 'Y. Sinner', selectionId: 321 },
                { name: 'Fabio Fognini', selectionId: 322 }
            ]
        }),
        makeBetfairTick({
            runners: [
                { name: 'Yannick', selectionId: 331 },
                { name: 'Taylor', selectionId: 332 }
            ]
        }),
        makeBetfairTick({
            runners: [
                { name: 'Daniil Medvedev', selectionId: 341 },
                { name: 'Novak Djokovic', selectionId: 342 }
            ]
        })
    ];

    const before = JSON.stringify({ sofaTick, betfairTicks });
    const identities = betfairTicks.map(betfairTick => buildSourceIdentity({
        sofaTick,
        betfairTick
    }));

    assert(
        identities[0].status === 'aligned',
        'initial and surname runners align automatically'
    );
    assert(
        identities[1].status === 'aligned',
        'unique surname-only runners align automatically'
    );
    assert(
        identities[2].status === 'mismatch',
        'one compatible runner and one unrelated runner mismatch'
    );
    assert(
        identities[2].reasons.includes(
            'SofaScore and Betfair player names do not match'
        ),
        'one-compatible mismatch has the explicit mismatch reason'
    );
    assert(
        !identities[2].reasons.includes(
            'Partial SofaScore/Betfair player-name evidence requires confirmation'
        ),
        'one-compatible mismatch is not a generic manual-confirmation case'
    );
    assert(
        identities[3].status === 'pending',
        'two partial runner identities with a bijective mapping remain pending'
    );
    assert(
        identities[3].reasons.includes(
            'Partial SofaScore/Betfair player-name evidence requires confirmation'
        ),
        'two partial runner identities keep the partial-evidence reason'
    );
    assert(
        identities[4].status === 'mismatch',
        'completely different runners mismatch'
    );
    assert(
        JSON.stringify({ sofaTick, betfairTicks }) === before,
        'partial-evidence source identity cases do not mutate inputs'
    );
}

{
    const sofaTick = makeSofaTick('John Smith', 'Peter Smith');
    const betfairTicks = [
        makeBetfairTick({
            runners: [
                { name: 'Smith', selectionId: 351 },
                { name: 'Fabio Fognini', selectionId: 352 }
            ]
        }),
        makeBetfairTick({
            runners: [
                { name: 'Smith', selectionId: 361 },
                { name: 'Smith', selectionId: 362 }
            ]
        })
    ];

    const before = JSON.stringify({ sofaTick, betfairTicks });
    const [mixedEvidence, ambiguousEvidence] = betfairTicks.map(
        betfairTick => buildSourceIdentity({
            sofaTick,
            betfairTick
        })
    );

    assert(
        mixedEvidence.status === 'mismatch',
        'ambiguous Smith runner with Fabio Fognini mismatches'
    );
    assert(
        !mixedEvidence.reasons.includes(
            'Partial SofaScore/Betfair player-name evidence requires confirmation'
        ),
        'ambiguous Smith plus unrelated runner is not a manual-confirmation case'
    );
    assert(
        ambiguousEvidence.status === 'pending',
        'ambiguous Smith runners remain pending'
    );
    assert(
        ambiguousEvidence.reasons.includes(
            'Betfair runner name is ambiguous across SofaScore players'
        ),
        'two ambiguous Smith runners retain the ambiguity reason'
    );
    assert(
        JSON.stringify({ sofaTick, betfairTicks }) === before,
        'ambiguous runner source identity cases do not mutate inputs'
    );
}

finish('sourceIdentity/ambiguity');
