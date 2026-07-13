import assert from 'node:assert/strict';
import { createCanonicalCommitId } from './commitId.js';
import { createCommitJournalStore } from './commitJournal.js';
import path from 'node:path';

let passed = 0;
let failed = 0;

function check(label, condition) {
    try {
        assert.equal(condition, true);
        console.log(`PASS ${label}`);
        passed += 1;
    } catch {
        console.error(`FAIL ${label}`);
        failed += 1;
    }
}

const COMMIT_ID_REGEX = /^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/;

function createFixture() {
    const journalDir = path.join(
        process.cwd(),
        'virtual-commit-id-journal',
        `fixture-${process.pid}-${Date.now()}`
    );

    return {
        store: createCommitJournalStore({ journalDir })
    };
}

{
    const id = createCanonicalCommitId('sofa');
    check('sofa-id-matches-regex', COMMIT_ID_REGEX.test(id));
    check('sofa-id-starts-with-prefix', id.startsWith('sofa-'));
    check('sofa-id-length-is-valid', id.length <= 128);
}

{
    const id = createCanonicalCommitId('betfair');
    check('betfair-id-matches-regex', COMMIT_ID_REGEX.test(id));
    check('betfair-id-starts-with-prefix', id.startsWith('betfair-'));
    check('betfair-id-length-is-valid', id.length <= 128);
}

{
    const ids = new Set();
    for (let i = 0; i < 50; i++) {
        ids.add(createCanonicalCommitId('sofa'));
    }
    check('generated-ids-are-unique', ids.size === 50);
}

{
    const commitId = createCanonicalCommitId('sofa');
    const { store } = createFixture();

    const result = store.createPendingCommit({
        commitId,
        eventId: 'event-sofa-id',
        source: 'sofa',
        documents: {
            history: {
                target: 'history-sofa.json',
                payload: {},
                completed: false
            },
            timeline: {
                target: 'timeline-sofa.json',
                payload: {},
                completed: false
            }
        }
    });

    check('sofa-id-is-accepted-by-journal', result.ok === true);
}

{
    const commitId = createCanonicalCommitId('betfair');
    const { store } = createFixture();

    const result = store.createPendingCommit({
        commitId,
        eventId: 'event-betfair-id',
        source: 'betfair',
        documents: {
            history: {
                target: 'history-betfair.json',
                payload: {},
                completed: false
            },
            timeline: {
                target: 'timeline-betfair.json',
                payload: {},
                completed: false
            }
        }
    });

    check('betfair-id-is-accepted-by-journal', result.ok === true);
}

{
    let thrown = false;
    try {
        createCanonicalCommitId('invalid-source');
    } catch {
        thrown = true;
    }
    check('invalid-source-throws', thrown === true);
}

console.log(`\ncommitId: ${passed} passed, ${failed} failed`);

if (failed > 0) {
    throw new Error(`${failed} commitId assertions failed`);
}
