import { createHash } from 'node:crypto';
import { normalizeName } from './sourceIdentity.js';

export const CONFIRMATION_PHRASE =
    'Confermo che questo mercato Betfair corrisponde alla partita SofaScore mostrata.';

export const MANUAL_CONFIRMATION_APPLIED_REASON =
    'Manual confirmation applied for current SofaScore/Betfair epoch';

function asString(value) {
    return value === null || value === undefined ? '' : String(value);
}

function copyStringArray(value) {
    return Array.isArray(value)
        ? value.map(item => asString(item).trim())
        : [];
}

function sameStringArrays(left, right) {
    return Array.isArray(left) &&
        Array.isArray(right) &&
        left.length === right.length &&
        left.every((value, index) => value === right[index]);
}

function uniqueStrings(values) {
    return [...new Set(
        (Array.isArray(values) ? values : [])
            .filter(value => typeof value === 'string' && value.length > 0)
    )];
}

function getTickData(tick) {
    return tick?.data && typeof tick.data === 'object'
        ? tick.data
        : tick && typeof tick === 'object'
            ? tick
            : {};
}

function getSelectionIds(tick) {
    const runners = Array.isArray(getTickData(tick).runners)
        ? getTickData(tick).runners
        : [];

    return runners
        .map(runner => asString(runner?.selectionId).trim())
        .filter(Boolean)
        .sort();
}

function hasExactlyTwoDistinctValues(values) {
    return Array.isArray(values) &&
        values.length === 2 &&
        values.every(value => typeof value === 'string' && value.length > 0) &&
        new Set(values).size === 2;
}

function sourceIdentityMatchesContext(sourceIdentity, context) {
    return !!sourceIdentity &&
        sameStringArrays(copyStringArray(sourceIdentity.sofaPlayers), context.sofaPlayers) &&
        sameStringArrays(copyStringArray(sourceIdentity.betfairRunners), context.betfairRunners) &&
        sameStringArrays(
            copyStringArray(sourceIdentity.normalizedSofaPlayers),
            context.normalizedSofaPlayers
        ) &&
        sameStringArrays(
            copyStringArray(sourceIdentity.normalizedBetfairRunners),
            context.normalizedBetfairRunners
        );
}

function sortPairsForContext(context, selectedPairs) {
    return selectedPairs
        .map(pair => ({
            sofaPlayer: asString(pair?.sofaPlayer),
            betfairRunner: asString(pair?.betfairRunner)
        }))
        .sort((left, right) => (
            context.sofaPlayers.indexOf(left.sofaPlayer) -
            context.sofaPlayers.indexOf(right.sofaPlayer)
        ));
}

function validateSelectedPairs(context, selectedPairs) {
    if (!Array.isArray(selectedPairs) || selectedPairs.length !== 2) {
        return { ok: false };
    }

    const pairs = sortPairsForContext(context, selectedPairs);
    const sofaPlayers = pairs.map(pair => pair.sofaPlayer);
    const betfairRunners = pairs.map(pair => pair.betfairRunner);

    if (
        pairs.some(pair => !pair.sofaPlayer || !pair.betfairRunner) ||
        new Set(sofaPlayers).size !== 2 ||
        new Set(betfairRunners).size !== 2 ||
        !context.sofaPlayers.every(player => sofaPlayers.includes(player)) ||
        !context.betfairRunners.every(runner => betfairRunners.includes(runner))
    ) {
        return { ok: false };
    }

    return { ok: true, pairs };
}

function normalizedFingerprintPairs(selectedPairs) {
    return selectedPairs
        .map(pair => ({
            sofaPlayer: normalizeName(pair.sofaPlayer),
            betfairRunner: normalizeName(pair.betfairRunner)
        }))
        .sort((left, right) => {
            const leftKey = `${left.sofaPlayer}\u0000${left.betfairRunner}`;
            const rightKey = `${right.sofaPlayer}\u0000${right.betfairRunner}`;
            return leftKey.localeCompare(rightKey);
        });
}

function cloneSourceIdentity(sourceIdentity) {
    return {
        status: sourceIdentity?.status || 'pending',
        sofaPlayers: copyStringArray(sourceIdentity?.sofaPlayers),
        betfairRunners: copyStringArray(sourceIdentity?.betfairRunners),
        normalizedSofaPlayers: copyStringArray(sourceIdentity?.normalizedSofaPlayers),
        normalizedBetfairRunners: copyStringArray(sourceIdentity?.normalizedBetfairRunners),
        normalizedPairs: Array.isArray(sourceIdentity?.normalizedPairs)
            ? sourceIdentity.normalizedPairs.map(pair => ({
                sofaPlayer: asString(pair?.sofaPlayer),
                betfairRunner: asString(pair?.betfairRunner),
                normalizedSofaPlayer: asString(pair?.normalizedSofaPlayer),
                normalizedBetfairRunner: asString(pair?.normalizedBetfairRunner),
                match: pair?.match === true
            }))
            : [],
        reasons: uniqueStrings(sourceIdentity?.reasons)
    };
}

export function buildConfirmationContext({
    eventId,
    activeBetfairEpoch = null,
    betfairTick = null,
    sourceIdentity = null
} = {}) {
    const activeTick = activeBetfairEpoch?.lastTick || betfairTick;
    const sofaPlayers = copyStringArray(sourceIdentity?.sofaPlayers);
    const betfairRunners = copyStringArray(sourceIdentity?.betfairRunners);

    return {
        eventId: asString(eventId).trim(),
        epochSignature: asString(activeBetfairEpoch?.signature).trim(),
        marketId: asString(getTickData(activeTick).market?.marketId).trim(),
        selectionIds: getSelectionIds(activeTick),
        sofaPlayers,
        betfairRunners,
        normalizedSofaPlayers: sofaPlayers.map(normalizeName),
        normalizedBetfairRunners: betfairRunners.map(normalizeName)
    };
}

export function isConfirmationContextComplete(context) {
    return !!context &&
        !!context.eventId &&
        !!context.epochSignature &&
        !!context.marketId &&
        hasExactlyTwoDistinctValues(context.selectionIds) &&
        hasExactlyTwoDistinctValues(context.sofaPlayers) &&
        hasExactlyTwoDistinctValues(context.betfairRunners) &&
        hasExactlyTwoDistinctValues(context.normalizedSofaPlayers) &&
        hasExactlyTwoDistinctValues(context.normalizedBetfairRunners);
}

export function buildConfirmationFingerprint({ context, selectedPairs } = {}) {
    if (!context || !Array.isArray(selectedPairs)) return null;

    return createHash('sha256')
        .update(JSON.stringify({
            eventId: context.eventId,
            epochSignature: context.epochSignature,
            marketId: context.marketId,
            selectionIds: context.selectionIds.slice().sort(),
            sofaPlayers: context.normalizedSofaPlayers.slice(),
            betfairRunners: context.normalizedBetfairRunners.slice(),
            selectedPairs: normalizedFingerprintPairs(selectedPairs)
        }), 'utf8')
        .digest('hex');
}

export function validateManualConfirmation({
    confirmationText,
    sourceIdentity,
    context,
    selectedPairs
} = {}) {
    if (confirmationText !== CONFIRMATION_PHRASE) {
        return { ok: false, code: 'confirmation_text_invalid' };
    }

    if (sourceIdentity?.status !== 'pending') {
        return { ok: false, code: 'automatic_identity_not_pending' };
    }

    if (!isConfirmationContextComplete(context) || !sourceIdentityMatchesContext(sourceIdentity, context)) {
        return { ok: false, code: 'confirmation_context_incomplete' };
    }

    const pairs = validateSelectedPairs(context, selectedPairs);
    if (!pairs.ok) {
        return { ok: false, code: 'selected_pairs_invalid' };
    }

    return {
        ok: true,
        record: {
            fingerprint: buildConfirmationFingerprint({
                context,
                selectedPairs: pairs.pairs
            }),
            eventId: context.eventId,
            epochSignature: context.epochSignature,
            marketId: context.marketId,
            selectionIds: context.selectionIds.slice(),
            sofaPlayers: context.sofaPlayers.slice(),
            betfairRunners: context.betfairRunners.slice(),
            selectedPairs: pairs.pairs.map(pair => ({ ...pair }))
        }
    };
}

export function isConfirmationRecordApplicable({ context, confirmation } = {}) {
    if (!isConfirmationContextComplete(context) || !confirmation) return false;

    if (
        asString(confirmation.eventId).trim() !== context.eventId ||
        asString(confirmation.epochSignature).trim() !== context.epochSignature ||
        asString(confirmation.marketId).trim() !== context.marketId ||
        !sameStringArrays(copyStringArray(confirmation.selectionIds).sort(), context.selectionIds.slice().sort()) ||
        !sameStringArrays(copyStringArray(confirmation.sofaPlayers), context.sofaPlayers) ||
        !sameStringArrays(copyStringArray(confirmation.betfairRunners), context.betfairRunners)
    ) {
        return false;
    }

    const pairs = validateSelectedPairs(context, confirmation.selectedPairs);
    return pairs.ok &&
        asString(confirmation.fingerprint).trim() === buildConfirmationFingerprint({
            context,
            selectedPairs: pairs.pairs
        });
}

export function applyManualConfirmation({
    sourceIdentity,
    context,
    confirmation
} = {}) {
    const automaticIdentity = cloneSourceIdentity(sourceIdentity);

    if (
        automaticIdentity.status !== 'pending' ||
        !sourceIdentityMatchesContext(automaticIdentity, context) ||
        !isConfirmationRecordApplicable({ context, confirmation })
    ) {
        return automaticIdentity;
    }

    const pairs = validateSelectedPairs(context, confirmation.selectedPairs);
    if (!pairs.ok) return automaticIdentity;

    const selectedRunnerByPlayer = new Map(
        pairs.pairs.map(pair => [pair.sofaPlayer, pair.betfairRunner])
    );

    return {
        ...automaticIdentity,
        status: 'aligned',
        normalizedPairs: context.sofaPlayers.map((sofaPlayer, sofaIndex) => {
            const betfairRunner = selectedRunnerByPlayer.get(sofaPlayer);
            const runnerIndex = context.betfairRunners.indexOf(betfairRunner);

            return {
                sofaPlayer,
                betfairRunner,
                normalizedSofaPlayer: context.normalizedSofaPlayers[sofaIndex],
                normalizedBetfairRunner: context.normalizedBetfairRunners[runnerIndex],
                match: true
            };
        }),
        reasons: uniqueStrings([
            ...automaticIdentity.reasons,
            MANUAL_CONFIRMATION_APPLIED_REASON
        ])
    };
}