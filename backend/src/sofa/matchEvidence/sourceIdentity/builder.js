import {
asString,
getTickData,
uniqueStrings
} from './shared.js';
import { normalizeName } from './normalize.js';
import {
COMPACT_APOSTROPHE_MANUAL_CONFIRMATION_REASON,
getNameProfile,
requiresManualConfirmationForCompactApostropheForm,
runnerMatchesSofaPlayer
} from './nameMatching.js';

function getPersonName(person) {
if (typeof person === 'string') return person;

if (!person || typeof person !== 'object') {
    return '';
}

return person.name ?? person.fullName ?? '';

}

function getSofaPlayerNames(sofaTick) {
const players = getTickData(sofaTick).players;

const candidates = Array.isArray(players)
    ? players
    : [players?.home, players?.away];

return candidates
    .map(getPersonName)
    .map(asString)
    .map(name => name.trim())
    .filter(Boolean);

}

function getBetfairRunnerNames(betfairTick) {
const runners = getTickData(betfairTick).runners;

return (Array.isArray(runners) ? runners : [])
    .map(runner => asString(runner?.name).trim())
    .filter(Boolean);

}

function createSourceIdentity({
status,
sofaPlayers = [],
betfairRunners = [],
normalizedSofaPlayers = [],
normalizedBetfairRunners = [],
normalizedPairs = [],
reasons = []
}) {
return {
status,
sofaPlayers: sofaPlayers.slice(),
betfairRunners: betfairRunners.slice(),
normalizedSofaPlayers: normalizedSofaPlayers.slice(),
normalizedBetfairRunners: normalizedBetfairRunners.slice(),
normalizedPairs: normalizedPairs.map(pair => ({
sofaPlayer: pair.sofaPlayer,
betfairRunner: pair.betfairRunner,
normalizedSofaPlayer: pair.normalizedSofaPlayer,
normalizedBetfairRunner: pair.normalizedBetfairRunner,
match: pair.match === true
})),
reasons: uniqueStrings(reasons)
};
}

export function createPendingSourceIdentity(reasons = []) {
return createSourceIdentity({
status: 'pending',
reasons
});
}

const NON_IDENTITY_NAME_TOKENS = new Set([
    "de", "del", "da", "di", "dos", "das", "van", "von",
    "der", "den", "ten", "ter", "la", "le", "st", "saint", "al", "bin"
]);

function hasSharedIdentityToken(sofaPlayer, betfairRunner) {
    const sofaTokens = new Set(
        getNameProfile(sofaPlayer).tokens.filter(token => (
            token.length > 1 && !NON_IDENTITY_NAME_TOKENS.has(token)
        ))
    );

    return getNameProfile(betfairRunner).tokens.some(token => (
        token.length > 1 &&
        !NON_IDENTITY_NAME_TOKENS.has(token) &&
        sofaTokens.has(token)
    ));
}

export function buildSourceIdentity({
sofaTick = null,
betfairTick = null,
epochReasons = []
} = {}) {
const sofaPlayers = getSofaPlayerNames(sofaTick);
const betfairRunners = getBetfairRunnerNames(betfairTick);

const normalizedSofaPlayers = sofaPlayers.map(normalizeName);
const normalizedBetfairRunners = betfairRunners.map(normalizeName);

const reasons = uniqueStrings(epochReasons);

const marketIdentityUnavailable = reasons.includes(
    'Active Betfair market identity is unavailable'
);

if (
    sofaPlayers.length !== 2 ||
    sofaPlayers.some(player => getNameProfile(player).tokens.length < 2)
) {
    reasons.push('SofaScore player names unavailable or incomplete');
}

if (betfairRunners.length !== 2) {
    reasons.push('Betfair runner names unavailable or incomplete');
}

if (
    marketIdentityUnavailable ||
    sofaPlayers.length !== 2 ||
    sofaPlayers.some(player => getNameProfile(player).tokens.length < 2) ||
    betfairRunners.length !== 2
) {
    return createSourceIdentity({
        status: 'pending',
        sofaPlayers,
        betfairRunners,
        normalizedSofaPlayers,
        normalizedBetfairRunners,
        reasons
    });
}

const manualCompactApostropheConfirmationRequired = betfairRunners.some(
    betfairRunner => {
        const runnerProfile = getNameProfile(betfairRunner);

        return sofaPlayers.some(sofaPlayer => (
            requiresManualConfirmationForCompactApostropheForm(
                getNameProfile(sofaPlayer),
                runnerProfile
            )
        ));
    }
);

if (manualCompactApostropheConfirmationRequired) {
    reasons.push(COMPACT_APOSTROPHE_MANUAL_CONFIRMATION_REASON);

    return createSourceIdentity({
        status: 'pending',
        sofaPlayers,
        betfairRunners,
        normalizedSofaPlayers,
        normalizedBetfairRunners,
        reasons
    });
}

const candidateSofaIndexesByRunner = betfairRunners.map(
    betfairRunner => sofaPlayers
        .map((sofaPlayer, sofaIndex) => (
            runnerMatchesSofaPlayer(sofaPlayer, betfairRunner)
                ? sofaIndex
                : null
        ))
        .filter(index => index !== null)
);

    if (candidateSofaIndexesByRunner.some(indexes => indexes.length === 0)) {
        const evidenceSofaIndexesByRunner = betfairRunners.map(
            (betfairRunner, runnerIndex) => sofaPlayers
                .map((sofaPlayer, sofaIndex) => {
                    const hasEvidence = (
                        candidateSofaIndexesByRunner[runnerIndex].includes(sofaIndex) ||
                        hasSharedIdentityToken(sofaPlayer, betfairRunner)
                    );

                    return hasEvidence ? sofaIndex : null;
                })
                .filter(index => index !== null)
        );

        const hasOneToOneEvidence = evidenceSofaIndexesByRunner[0].some(
            firstSofaIndex => evidenceSofaIndexesByRunner[1].some(
                secondSofaIndex => firstSofaIndex !== secondSofaIndex
            )
        );

        if (hasOneToOneEvidence) {
            reasons.push(
                'Partial SofaScore/Betfair player-name evidence requires confirmation'
            );

            return createSourceIdentity({
                status: 'pending',
                sofaPlayers,
                betfairRunners,
                normalizedSofaPlayers,
                normalizedBetfairRunners,
                reasons
            });
        }

        reasons.push('SofaScore and Betfair player names do not match');

        return createSourceIdentity({
            status: 'mismatch',
            sofaPlayers,
            betfairRunners,
            normalizedSofaPlayers,
            normalizedBetfairRunners,
            reasons
        });
    }

if (candidateSofaIndexesByRunner.some(indexes => indexes.length > 1)) {
    reasons.push('Betfair runner name is ambiguous across SofaScore players');

    return createSourceIdentity({
        status: 'pending',
        sofaPlayers,
        betfairRunners,
        normalizedSofaPlayers,
        normalizedBetfairRunners,
        reasons
    });
}

const mappedSofaIndexes = candidateSofaIndexesByRunner.map(
    indexes => indexes[0]
);

if (new Set(mappedSofaIndexes).size !== 2) {
    reasons.push('Betfair runner identities are not bijective');

    return createSourceIdentity({
        status: 'pending',
        sofaPlayers,
        betfairRunners,
        normalizedSofaPlayers,
        normalizedBetfairRunners,
        reasons
    });
}

const normalizedPairs = sofaPlayers.map((sofaPlayer, sofaIndex) => {
    const runnerIndex = mappedSofaIndexes.indexOf(sofaIndex);

    return {
        sofaPlayer,
        betfairRunner: betfairRunners[runnerIndex],
        normalizedSofaPlayer: normalizedSofaPlayers[sofaIndex],
        normalizedBetfairRunner: normalizedBetfairRunners[runnerIndex],
        match: true
    };
});

return createSourceIdentity({
    status: 'aligned',
    sofaPlayers,
    betfairRunners,
    normalizedSofaPlayers,
    normalizedBetfairRunners,
    normalizedPairs,
    reasons
});

}
