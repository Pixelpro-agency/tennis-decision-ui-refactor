import { randomUUID } from 'node:crypto';

const ALLOWED_SOURCES = new Set(['sofa', 'betfair']);
const COMMIT_ID_REGEX = /^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/;

export function createCanonicalCommitId(source) {
    if (!ALLOWED_SOURCES.has(source)) {
        throw new Error(`Invalid commit source: ${source}`);
    }

    const uuid = randomUUID();
    const commitId = `${source}-${uuid}`;

    if (!COMMIT_ID_REGEX.test(commitId)) {
        throw new Error('Generated commitId does not satisfy filename constraints');
    }

    return commitId;
}
