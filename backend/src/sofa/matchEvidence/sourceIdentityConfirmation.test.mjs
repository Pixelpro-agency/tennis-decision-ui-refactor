import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
    CONFIRMATION_PHRASE,
    MANUAL_CONFIRMATION_APPLIED_REASON,
    applyManualConfirmation,
    buildConfirmationContext,
    buildConfirmationFingerprint,
    validateManualConfirmation
} from './sourceIdentityConfirmation.js';
import {
    findApplicableSourceIdentityConfirmation,
    readSourceIdentityConfirmationStore,
    revokeSourceIdentityConfirmation,
    upsertSourceIdentityConfirmation
} from './sourceIdentityConfirmationStore.js';

let passed = 0;

function assert(condition, message) {
    if (!condition) throw new Error(message);
    passed += 1;
}

function clone(value) {
    return JSON.parse(JSON.stringify(value));
}

function makeBetfairTick({
    marketId = '1.200',
    selectionIds = [11, 22],
    runners = ['OConnell', 'Smith']
} = {}) {
    return {
        timestamp: '2026-06-23T12:00:00.000Z',
        data: {
            source: 'betfair',
            market: { marketId },
            runners: runners.map((name, index) => ({
                name,
                selectionId: selectionIds[index]
            }))
        }
    };
}

const pendingIdentity = {
    status: 'pending',
    sofaPlayers: ['O Connell', 'Alice Smith'],
    betfairRunners: ['OConnell', 'Smith'],
    normalizedSofaPlayers: ['o connell', 'alice smith'],
    normalizedBetfairRunners: ['oconnell', 'smith'],
    normalizedPairs: [],
    reasons: ['Compact apostrophe-style name requires manual confirmation']
};

function makeContext({
    eventId = 'manual-confirmation-event',
    epochSignature = 'marketId:1.200|selectionIds:11,22',
    marketId = '1.200',
    selectionIds = [11, 22],
    runners = ['OConnell', 'Smith']
} = {}) {
    const sourceIdentity = {
        ...pendingIdentity,
        betfairRunners: runners.slice(),
        normalizedBetfairRunners: runners.map(name => name.toLowerCase())
    };

    return buildConfirmationContext({
        eventId,
        activeBetfairEpoch: {
            signature: epochSignature,
            lastTick: makeBetfairTick({ marketId, selectionIds, runners })
        },
        sourceIdentity
    });
}

const context = makeContext();
const selectedPairs = [
    { sofaPlayer: 'O Connell', betfairRunner: 'OConnell' },
    { sofaPlayer: 'Alice Smith', betfairRunner: 'Smith' }
];

const valid = validateManualConfirmation({
    confirmationText: CONFIRMATION_PHRASE,
    sourceIdentity: pendingIdentity,
    context,
    selectedPairs
});

assert(valid.ok === true, 'exact confirmation phrase is valid');
assert(
    validateManualConfirmation({
        confirmationText: `${CONFIRMATION_PHRASE} `,
        sourceIdentity: pendingIdentity,
        context,
        selectedPairs
    }).ok === false,
    'different confirmation phrase is rejected'
);
assert(valid.record.selectedPairs.length === 2, 'pending identity with two players and runners is confirmable');
assert(
    validateManualConfirmation({
        confirmationText: CONFIRMATION_PHRASE,
        sourceIdentity: pendingIdentity,
        context,
        selectedPairs: [selectedPairs[0]]
    }).ok === false,
    'incomplete selected pairs are rejected'
);
assert(
    validateManualConfirmation({
        confirmationText: CONFIRMATION_PHRASE,
        sourceIdentity: pendingIdentity,
        context,
        selectedPairs: [
            selectedPairs[0],
            { sofaPlayer: 'O Connell', betfairRunner: 'Smith' }
        ]
    }).ok === false,
    'duplicate selected pairs are rejected'
);
assert(
    validateManualConfirmation({
        confirmationText: CONFIRMATION_PHRASE,
        sourceIdentity: pendingIdentity,
        context,
        selectedPairs: [
            { sofaPlayer: 'Unknown Player', betfairRunner: 'OConnell' },
            selectedPairs[1]
        ]
    }).ok === false,
    'pair names outside the context are rejected'
);
assert(
    validateManualConfirmation({
        confirmationText: CONFIRMATION_PHRASE,
        sourceIdentity: { ...pendingIdentity, status: 'mismatch' },
        context,
        selectedPairs
    }).ok === false,
    'mismatch cannot be confirmed'
);
assert(
    validateManualConfirmation({
        confirmationText: CONFIRMATION_PHRASE,
        sourceIdentity: { ...pendingIdentity, status: 'aligned' },
        context,
        selectedPairs
    }).ok === false,
    'automatic aligned identity cannot be confirmed'
);

const baselineFingerprint = buildConfirmationFingerprint({ context, selectedPairs });

assert(
    baselineFingerprint !== buildConfirmationFingerprint({
        context: makeContext({ epochSignature: 'marketId:1.200|selectionIds:99,100' }),
        selectedPairs
    }),
    'fingerprint changes with epoch signature'
);
assert(
    baselineFingerprint !== buildConfirmationFingerprint({
        context: makeContext({ marketId: '1.201' }),
        selectedPairs
    }),
    'fingerprint changes with market id'
);
assert(
    baselineFingerprint !== buildConfirmationFingerprint({
        context: makeContext({ selectionIds: [33, 44] }),
        selectedPairs
    }),
    'fingerprint changes with selection ids'
);
assert(
    baselineFingerprint !== buildConfirmationFingerprint({
        context: makeContext({ runners: ['OConnell', 'Jones'] }),
        selectedPairs: [
            selectedPairs[0],
            { sofaPlayer: 'Alice Smith', betfairRunner: 'Jones' }
        ]
    }),
    'fingerprint changes with runner'
);
assert(
    baselineFingerprint !== buildConfirmationFingerprint({
        context,
        selectedPairs: [
            { sofaPlayer: 'O Connell', betfairRunner: 'Smith' },
            { sofaPlayer: 'Alice Smith', betfairRunner: 'OConnell' }
        ]
    }),
    'fingerprint changes with mapping'
);

const identityBefore = clone(pendingIdentity);
const contextBefore = clone(context);
const recordBefore = clone(valid.record);
const applied = applyManualConfirmation({
    sourceIdentity: pendingIdentity,
    context,
    confirmation: valid.record
});

assert(applied.status === 'aligned', 'valid record applies pending to aligned');
assert(
    applied.reasons.includes(MANUAL_CONFIRMATION_APPLIED_REASON),
    'effective identity includes the applied confirmation reason'
);
assert(
    applied.normalizedPairs.some(pair =>
        pair.sofaPlayer === 'O Connell' &&
        pair.betfairRunner === 'OConnell' &&
        pair.match === true
    ),
    'effective identity exposes the selected mapping'
);
assert(
    applyManualConfirmation({
        sourceIdentity: pendingIdentity,
        context,
        confirmation: { ...valid.record, fingerprint: 'invalid' }
    }).status === 'pending',
    'nonmatching record is not applied'
);
assert(
    JSON.stringify(pendingIdentity) === JSON.stringify(identityBefore) &&
    JSON.stringify(context) === JSON.stringify(contextBefore) &&
    JSON.stringify(valid.record) === JSON.stringify(recordBefore),
    'confirmation helpers do not mutate inputs'
);

const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'identity-confirmation-'));
const storePath = path.join(temporaryDirectory, 'store.json');

try {
    const absent = readSourceIdentityConfirmationStore({ filePath: storePath });
    assert(absent.ok === true && absent.archive.confirmations.length === 0, 'missing store is empty');

    const firstUpsert = upsertSourceIdentityConfirmation(valid.record, { filePath: storePath });
    assert(firstUpsert.ok === true && firstUpsert.created === true, 'store upsert persists a record');

    const repeatUpsert = upsertSourceIdentityConfirmation(valid.record, { filePath: storePath });
    assert(repeatUpsert.ok === true && repeatUpsert.created === false, 'store upsert is idempotent');

    const found = findApplicableSourceIdentityConfirmation(context, { filePath: storePath });
    assert(
        found.ok === true && found.confirmation?.fingerprint === valid.record.fingerprint,
        'store returns the applicable record'
    );

    const revoked = revokeSourceIdentityConfirmation(valid.record.fingerprint, { filePath: storePath });
    assert(revoked.ok === true && revoked.revoked === true, 'store revokes by fingerprint');

    const revokedAgain = revokeSourceIdentityConfirmation(valid.record.fingerprint, { filePath: storePath });
    assert(revokedAgain.ok === true && revokedAgain.revoked === false, 'store revoke is idempotent');

    fs.writeFileSync(storePath, '{invalid json', 'utf8');
    const corrupt = readSourceIdentityConfirmationStore({ filePath: storePath });
    assert(corrupt.ok === false && corrupt.archive.confirmations.length === 0, 'corrupt JSON fails closed');
} finally {
    fs.rmSync(temporaryDirectory, { recursive: true, force: true });
}

console.log(`sourceIdentityConfirmation: ${passed} assertions passed`);