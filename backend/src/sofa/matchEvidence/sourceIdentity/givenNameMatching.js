import { asString } from './shared.js';
import { getSortedTokenSignature } from './nameProfile.js';

function initialsFor(tokens) {
    return tokens.map(token => token[0]).join('');
}

function areIndividualInitials(tokens) {
    return tokens.length > 0 &&
        tokens.every(token => token.length === 1);
}

function isUppercasePackedInitial(rawToken) {
    const value = asString(rawToken);

    return Array.from(value).length >= 2 &&
        value === value.toUpperCase() &&
        value !== value.toLowerCase();
}

function hasPackedInitials(profile) {
    return profile.givenTokens.length === 1 &&
        profile.givenTokens[0].length >= 2 &&
        profile.givenRawTokens.length === 1 &&
        isUppercasePackedInitial(profile.givenRawTokens[0]);
}

function matchesConservativeAbbreviatedGivenTokens(leftProfile, rightProfile) {
    const leftTokens = leftProfile.givenTokens;
    const rightTokens = rightProfile.givenTokens;

    if (
        leftTokens.length === 0 ||
        rightTokens.length === 0 ||
        leftTokens.length !== rightTokens.length
    ) {
        return false;
    }

    if (leftTokens.length === 1) {
        const leftToken = leftTokens[0];
        const rightToken = rightTokens[0];

        const prefix = leftToken.startsWith(rightToken)
            ? rightToken
            : rightToken.startsWith(leftToken)
                ? leftToken
                : '';

        return prefix.length >= 3;
    }

    let hasExactEvidence = false;

    for (let index = 0; index < leftTokens.length; index += 1) {
        const leftToken = leftTokens[index];
        const rightToken = rightTokens[index];

        if (leftToken === rightToken) {
            if (leftToken.length >= 3) {
                hasExactEvidence = true;
            }
            continue;
        }

        const prefix = leftToken.startsWith(rightToken)
            ? rightToken
            : rightToken.startsWith(leftToken)
                ? leftToken
                : '';

        if (prefix.length < 2) {
            return false;
        }
    }

    return hasExactEvidence;
}

export function givenNamesMatch(leftProfile, rightProfile) {
    const leftTokens = leftProfile.givenTokens;
    const rightTokens = rightProfile.givenTokens;

    if (leftTokens.length === 0 || rightTokens.length === 0) {
        return false;
    }

    if (getSortedTokenSignature(leftTokens) === getSortedTokenSignature(rightTokens)) {
        return true;
    }

    if (
        leftTokens.length === rightTokens.length &&
        areIndividualInitials(leftTokens) &&
        initialsFor(rightTokens) === leftTokens.join('')
    ) {
        return true;
    }

    if (
        rightTokens.length === leftTokens.length &&
        areIndividualInitials(rightTokens) &&
        initialsFor(leftTokens) === rightTokens.join('')
    ) {
        return true;
    }

    if (
        hasPackedInitials(leftProfile) &&
        rightTokens.length >= 2 &&
        initialsFor(rightTokens) === leftTokens[0]
    ) {
        return true;
    }

    if (
        hasPackedInitials(rightProfile) &&
        leftTokens.length >= 2 &&
        initialsFor(leftTokens) === rightTokens[0]
    ) {
        return true;
    }

    return matchesConservativeAbbreviatedGivenTokens(leftProfile, rightProfile);
}
