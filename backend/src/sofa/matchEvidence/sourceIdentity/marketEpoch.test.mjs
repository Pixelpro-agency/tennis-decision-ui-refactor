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
    const sofaTick = makeSofaTick('Lorenzo Sonego', 'Miomir Kecmanović');
    const timeline = [
        makeBetfairTick({
            timestamp: '2026-06-21T11:59:00.000Z',
            seq: 1,
            marketId: 'A',
            marketKey: 'market-a',
            runners: [
                { name: 'Jan-Lennard Struff', selectionId: 1 },
                { name: 'Nuno Borges', selectionId: 2 }
            ]
        }),
        makeBetfairTick({
            timestamp: '2026-06-21T11:59:30.000Z',
            seq: 2,
            marketId: 'B',
            marketKey: 'market-b',
            runners: [
                { name: 'Sonego', selectionId: 1 },
                { name: 'Kecmanovic', selectionId: 2 }
            ]
        }),
        makeBetfairTick({
            timestamp: '2026-06-21T12:00:00.000Z',
            seq: 3,
            marketId: 'B',
            marketKey: 'market-b',
            runners: [
                { name: 'Sonego', selectionId: 1 },
                { name: 'Kecmanovic', selectionId: 2 }
            ]
        })
    ];

    const before = JSON.stringify({ sofaTick, timeline });
    const epoch = selectActiveBetfairMarketEpoch(timeline);
    const identity = buildSourceIdentity({
        sofaTick,
        betfairTick: epoch.lastTick,
        epochReasons: epoch.reasons
    });

    assert(buildBetfairIdentitySignature(timeline[0]) !== buildBetfairIdentitySignature(timeline[1]), 'market change changes signature');
    assert(epoch.ticks.length === 2, 'only contiguous final epoch is selected');
    assert(epoch.ticks.every(tick => tick.data.market.marketId === 'B'), 'historical market is excluded');
    assert(
        epoch.reasons.includes('Historical Betfair market epoch excluded after market identity changed'),
        'epoch exclusion reason is present'
    );
    assert(identity.status === 'aligned', 'active epoch is aligned with SofaScore');
    assert(JSON.stringify({ sofaTick, timeline }) === before, 'source identity helpers do not mutate inputs');
}

{
    const fallbackTick = makeBetfairTick({
        marketId: '',
        marketKey: 'fallback-market',
        runners: [
            { name: 'Sonego', selectionId: 81 },
            { name: 'Kecmanovic', selectionId: 82 }
        ]
    });

    const unsignedTick = makeUnsignedBetfairTick({
        timestamp: '2026-06-21T12:00:00.000Z',
        runners: [
            { name: 'Sonego' },
            { name: 'Kecmanovic' }
        ]
    });

    const fallbackSignature = buildBetfairIdentitySignature(fallbackTick);
    const unsignedSignature = buildBetfairIdentitySignature(unsignedTick);

    assert(
        fallbackSignature === 'marketKey:fallback-market|runners:kecmanovic|sonego',
        'marketKey and normalized runners are the deterministic fallback signature'
    );
    assert(unsignedSignature === null, 'missing market identity produces no signature');
}

{
    const historicalTick = makeBetfairTick({
        timestamp: '2026-06-21T11:59:00.000Z',
        marketId: 'A',
        marketKey: 'market-a',
        runners: [
            { name: 'Jan-Lennard Struff', selectionId: 1 },
            { name: 'Nuno Borges', selectionId: 2 }
        ]
    });
    const unsignedTick = makeUnsignedBetfairTick({
        timestamp: '2026-06-21T11:59:30.000Z',
        runners: [
            { name: 'Unknown One' },
            { name: 'Unknown Two' }
        ]
    });
    const activeTick = makeBetfairTick({
        timestamp: '2026-06-21T12:00:00.000Z',
        marketId: 'B',
        marketKey: 'market-b',
        runners: [
            { name: 'Sonego', selectionId: 1 },
            { name: 'Kecmanovic', selectionId: 2 }
        ]
    });

    const epoch = selectActiveBetfairMarketEpoch([historicalTick, unsignedTick, activeTick]);

    assert(epoch.ticks.length === 1 && epoch.ticks[0] === activeTick, 'unsigned tick interrupts the final epoch');
    assert(
        epoch.reasons.includes('Historical Betfair ticks excluded because market identity is unavailable'),
        'unsigned boundary has the identity-unavailable diagnostic'
    );
}

{
    const signedTick = makeBetfairTick({
        timestamp: '2026-06-21T11:59:30.000Z',
        marketId: 'B',
        marketKey: 'market-b',
        runners: [
            { name: 'Sonego', selectionId: 1 },
            { name: 'Kecmanovic', selectionId: 2 }
        ]
    });
    const unsignedLastTick = makeUnsignedBetfairTick({
        timestamp: '2026-06-21T12:00:00.000Z',
        runners: [
            { name: 'Sonego' },
            { name: 'Kecmanovic' }
        ]
    });
    const oneTickEpoch = selectActiveBetfairMarketEpoch([signedTick]);
    const unsignedLastEpoch = selectActiveBetfairMarketEpoch([signedTick, unsignedLastTick]);

    assert(oneTickEpoch.ticks.length === 1 && oneTickEpoch.signature !== null, 'one signed tick remains a valid epoch');
    assert(oneTickEpoch.reasons.length === 0, 'single signed epoch has no exclusion diagnostic');
    assert(unsignedLastEpoch.ticks.length === 0, 'unsigned final tick has no active epoch');
    assert(unsignedLastEpoch.lastTick === unsignedLastTick, 'unsigned final tick is retained for pending diagnostics');
    assert(
        unsignedLastEpoch.reasons.includes('Active Betfair market identity is unavailable'),
        'unsigned final tick produces pending identity diagnostic'
    );
}

finish('sourceIdentity/epoch');
