import { asString } from './shared.js';
import { normalizeName } from './normalize.js';

export const COMPOUND_SURNAME_PARTICLES = [
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

function getNameTokens(value) {
    const normalized = normalizeName(value);
    return normalized ? normalized.split(' ') : [];
}

function getRawTokens(value) {
    return asString(value).match(/[\p{L}\p{N}]+/gu) || [];
}

export function getSortedTokenSignature(tokens) {
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
