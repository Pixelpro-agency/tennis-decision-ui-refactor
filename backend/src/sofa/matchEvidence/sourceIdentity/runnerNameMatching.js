import { normalizeName } from './normalize.js';
import { getNameProfile } from './nameProfile.js';
import {
    getSurnameCandidates,
    isCompoundSurname
} from './surnameMatching.js';
import { matchesAllowedCompactApostropheForm } from './apostropheMatching.js';

export function runnerMatchesSofaPlayerWith(sofaPlayer, betfairRunner, namesMatch) {
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
