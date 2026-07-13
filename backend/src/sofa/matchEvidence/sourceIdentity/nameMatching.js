import {
    getNameProfile,
    getSortedTokenSignature
} from './nameProfile.js';
import {
    matchesAllowedCompactCompoundSurname,
    surnamesMatch
} from './surnameMatching.js';
import {
    COMPACT_APOSTROPHE_MANUAL_CONFIRMATION_REASON,
    matchesAllowedCompactApostropheForm,
    requiresManualConfirmationForCompactApostropheForm
} from './apostropheMatching.js';
import { givenNamesMatch } from './givenNameMatching.js';
import { runnerMatchesSofaPlayerWith } from './runnerNameMatching.js';

export {
    COMPACT_APOSTROPHE_MANUAL_CONFIRMATION_REASON,
    getNameProfile,
    requiresManualConfirmationForCompactApostropheForm
};

function matchesSurnameOnlyForm(leftProfile, rightProfile) {
    const leftIsSurnameOnly =
        leftProfile.givenTokens.length === 0 &&
        leftProfile.surnameTokens.length > 0;

    const rightIsSurnameOnly =
        rightProfile.givenTokens.length === 0 &&
        rightProfile.surnameTokens.length > 0;

    return leftIsSurnameOnly || rightIsSurnameOnly;
}

export function namesMatch(left, right) {
    const leftProfile = getNameProfile(left);
    const rightProfile = getNameProfile(right);

    if (leftProfile.tokens.length === 0 || rightProfile.tokens.length === 0) {
        return false;
    }

    if (
        getSortedTokenSignature(leftProfile.tokens) ===
        getSortedTokenSignature(rightProfile.tokens)
    ) {
        return true;
    }

    if (
        matchesAllowedCompactApostropheForm(leftProfile, rightProfile) ||
        matchesAllowedCompactCompoundSurname(leftProfile, rightProfile)
    ) {
        return true;
    }

    if (!surnamesMatch(leftProfile, rightProfile)) {
        return false;
    }

    return givenNamesMatch(leftProfile, rightProfile) ||
        matchesSurnameOnlyForm(leftProfile, rightProfile);
}

export function runnerMatchesSofaPlayer(sofaPlayer, betfairRunner) {
    return runnerMatchesSofaPlayerWith(sofaPlayer, betfairRunner, namesMatch);
}
