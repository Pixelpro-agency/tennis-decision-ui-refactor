import { COMPOUND_SURNAME_PARTICLES } from './nameProfile.js';

export function getSurnameCandidates(profile) {
    const candidates = [
        profile.surnameTokens.join(' '),
        profile.surnameBase
    ].filter(Boolean);

    return Array.from(new Set(candidates));
}

export function isCompoundSurname(profile) {
    return profile.surnameTokens.length > 1 &&
        COMPOUND_SURNAME_PARTICLES.some(parts => (
            parts.length < profile.surnameTokens.length &&
            profile.surnameTokens.slice(0, parts.length).join(' ') === parts.join(' ')
        ));
}

export function surnamesMatch(leftProfile, rightProfile) {
    const leftSurname = leftProfile.surnameTokens.join(' ');
    const rightSurname = rightProfile.surnameTokens.join(' ');

    if (isCompoundSurname(leftProfile) && isCompoundSurname(rightProfile)) {
        return leftSurname === rightSurname;
    }

    const leftCandidates = getSurnameCandidates(leftProfile);
    const rightCandidates = new Set(getSurnameCandidates(rightProfile));

    return leftCandidates.some(candidate => rightCandidates.has(candidate));
}

export function matchesAllowedCompactCompoundSurname(leftProfile, rightProfile) {
    const leftCompact = leftProfile.surnameTokens.join('');
    const rightCompact = rightProfile.surnameTokens.join('');

    return Boolean(leftCompact) &&
        leftCompact === rightCompact &&
        (isCompoundSurname(leftProfile) || isCompoundSurname(rightProfile));
}
