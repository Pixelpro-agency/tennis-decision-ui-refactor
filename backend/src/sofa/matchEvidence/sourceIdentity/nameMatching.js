import { asString } from './shared.js';
import { normalizeName } from './normalize.js';

const COMPOUND_SURNAME_PARTICLES = [
'de la',
'de',
'del',
'da',
'di',
'dos',
'das',
'van',
'von',
'der',
'den',
'ten',
'ter',
'la',
'le',
'st',
'saint',
'al',
'bin'
].map(particle => particle.split(' '));

const APOSTROPHE_NAME_PREFIXES = new Set(['o', 'd', 'l']);
const ORIGINAL_APOSTROPHE_PATTERN = /['\u2018\u2019\u02BC\uFF07]/u;

export const COMPACT_APOSTROPHE_MANUAL_CONFIRMATION_REASON =
'Compact apostrophe-style name requires manual confirmation';

function getNameTokens(value) {
const normalized = normalizeName(value);
return normalized ? normalized.split(' ') : [];
}

function getRawTokens(value) {
return asString(value).match(/[\p{L}\p{N}]+/gu) || [];
}

function getSortedTokenSignature(tokens) {
return tokens.slice().sort().join(' ');
}

function getCompoundSurnameStart(tokens) {
let start = tokens.length - 1;

while (start > 0) {
    const particle = COMPOUND_SURNAME_PARTICLES
        .filter(parts => parts.length <= start)
        .sort((left, right) => right.length - left.length)
        .find(parts => (
            tokens.slice(start - parts.length, start).join(' ') === parts.join(' ')
        ));

    if (!particle) break;

    start -= particle.length;
}

return start;

}

function createNameProfile({
raw,
tokens,
surnameTokens,
givenTokens,
givenRawTokens
}) {
return {
raw,
tokens,
surnameTokens,
surnameBase: surnameTokens[surnameTokens.length - 1] || '',
givenTokens,
givenRawTokens
};
}

export function getNameProfile(value) {
const raw = asString(value).trim();
const tokens = getNameTokens(raw);

if (tokens.length === 0) {
    return createNameProfile({
        raw,
        tokens: [],
        surnameTokens: [],
        givenTokens: [],
        givenRawTokens: []
    });
}

const commaIndex = raw.search(/[,\uFF0C]/u);

if (commaIndex >= 0) {
    const rawSurname = raw.slice(0, commaIndex);
    const rawGiven = raw.slice(commaIndex + 1);
    const surnameTokens = getNameTokens(rawSurname);

    if (surnameTokens.length > 0) {
        return createNameProfile({
            raw,
            tokens,
            surnameTokens,
            givenTokens: getNameTokens(rawGiven),
            givenRawTokens: getRawTokens(rawGiven)
        });
    }
}

const surnameStart = getCompoundSurnameStart(tokens);

return createNameProfile({
    raw,
    tokens,
    surnameTokens: tokens.slice(surnameStart),
    givenTokens: tokens.slice(0, surnameStart),
    givenRawTokens: getRawTokens(raw).slice(0, surnameStart)
});

}

function getSurnameCandidates(profile) {
const candidates = [
profile.surnameTokens.join(' '),
profile.surnameBase
].filter(Boolean);

return Array.from(new Set(candidates));

}

function isCompoundSurname(profile) {
return profile.surnameTokens.length > 1 &&
COMPOUND_SURNAME_PARTICLES.some(parts => (
parts.length < profile.surnameTokens.length &&
profile.surnameTokens.slice(0, parts.length).join(' ') === parts.join(' ')
));
}

function surnamesMatch(leftProfile, rightProfile) {
const leftSurname = leftProfile.surnameTokens.join(' ');
const rightSurname = rightProfile.surnameTokens.join(' ');

if (isCompoundSurname(leftProfile) && isCompoundSurname(rightProfile)) {
    return leftSurname === rightSurname;
}

const leftCandidates = getSurnameCandidates(leftProfile);
const rightCandidates = new Set(getSurnameCandidates(rightProfile));

return leftCandidates.some(candidate => rightCandidates.has(candidate));

}

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

function matchesAllowedCompactApostropheForm(leftProfile, rightProfile) {
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

function matchesAllowedCompactCompoundSurname(leftProfile, rightProfile) {
const leftCompact = leftProfile.surnameTokens.join('');
const rightCompact = rightProfile.surnameTokens.join('');

return Boolean(leftCompact) &&
    leftCompact === rightCompact &&
    (isCompoundSurname(leftProfile) || isCompoundSurname(rightProfile));

}

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

function givenNamesMatch(leftProfile, rightProfile) {
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
const sofaProfile = getNameProfile(sofaPlayer);
const runnerProfile = getNameProfile(betfairRunner);
const normalizedRunner = normalizeName(betfairRunner);

if (
    !normalizedRunner ||
    sofaProfile.tokens.length < 2 ||
    runnerProfile.tokens.length === 0
) {
    return false;
}

if (getSurnameCandidates(sofaProfile).includes(normalizedRunner)) {
    return true;
}

if (
    sofaProfile.surnameTokens.length > 1 &&
    isCompoundSurname(sofaProfile) &&
    sofaProfile.surnameTokens.join('') === normalizedRunner
) {
    return true;
}

if (matchesAllowedCompactApostropheForm(sofaProfile, runnerProfile)) {
    return true;
}

if (runnerProfile.tokens.length === 1) {
    return false;
}

return namesMatch(sofaPlayer, betfairRunner);

}
