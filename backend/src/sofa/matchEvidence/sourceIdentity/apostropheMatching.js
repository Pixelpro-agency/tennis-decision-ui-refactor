const APOSTROPHE_NAME_PREFIXES = new Set(['o', 'd', 'l']);
const ORIGINAL_APOSTROPHE_PATTERN = /['\u2018\u2019\u02BC\uFF07]/u;

export const COMPACT_APOSTROPHE_MANUAL_CONFIRMATION_REASON =
    'Compact apostrophe-style name requires manual confirmation';

function getApostropheCompactSignature(profile) {
    if (
        profile.tokens.length === 2 &&
        APOSTROPHE_NAME_PREFIXES.has(profile.tokens[0])
    ) {
        return profile.tokens.join('');
    }

    return profile.tokens.length === 1
        ? profile.tokens[0]
        : '';
}

function hasOriginalApostrophe(profile) {
    return ORIGINAL_APOSTROPHE_PATTERN.test(profile.raw);
}

function matchesCompactApostropheStyleForm(leftProfile, rightProfile) {
    const leftCompact = getApostropheCompactSignature(leftProfile);
    const rightCompact = getApostropheCompactSignature(rightProfile);

    const hasSeparatedAndCompactForms =
        (leftProfile.tokens.length === 2 && rightProfile.tokens.length === 1) ||
        (leftProfile.tokens.length === 1 && rightProfile.tokens.length === 2);

    return Boolean(leftCompact) &&
        leftCompact === rightCompact &&
        hasSeparatedAndCompactForms;
}

export function matchesAllowedCompactApostropheForm(leftProfile, rightProfile) {
    return matchesCompactApostropheStyleForm(leftProfile, rightProfile) &&
        (hasOriginalApostrophe(leftProfile) || hasOriginalApostrophe(rightProfile));
}

export function requiresManualConfirmationForCompactApostropheForm(
    leftProfile,
    rightProfile
) {
    return matchesCompactApostropheStyleForm(leftProfile, rightProfile) &&
        !hasOriginalApostrophe(leftProfile) &&
        !hasOriginalApostrophe(rightProfile);
}
