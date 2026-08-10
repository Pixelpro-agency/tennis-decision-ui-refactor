import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
    findApplicableSourceIdentityConfirmation,
    readSourceIdentityConfirmationStore
} from './sourceIdentityConfirmationStore.js';

const root = mkdtempSync(path.join(tmpdir(), 'confirmation-store-'));
try {
    const missing = path.join(root, 'missing.json');
    assert.deepEqual(
        readSourceIdentityConfirmationStore({ filePath: missing }),
        { ok: true, reason: 'not_found', archive: { version: 1, confirmations: [] } }
    );

    const invalidJson = path.join(root, 'invalid-json.json');
    writeFileSync(invalidJson, '{', 'utf8');
    assert.equal(
        readSourceIdentityConfirmationStore({ filePath: invalidJson }).reason,
        'invalid_json'
    );

    const invalidShape = path.join(root, 'invalid-shape.json');
    writeFileSync(invalidShape, '{"version":2,"confirmations":[]}', 'utf8');
    assert.equal(
        readSourceIdentityConfirmationStore({ filePath: invalidShape }).reason,
        'invalid_shape'
    );
    assert.equal(
        findApplicableSourceIdentityConfirmation({}, { filePath: invalidShape }).reason,
        'invalid_shape'
    );

    const directoryAsFile = path.join(root, 'directory');
    mkdirSync(directoryAsFile);
    const readFailure = readSourceIdentityConfirmationStore({ filePath: directoryAsFile });
    assert.equal(readFailure.reason, 'read_failed');

    console.log('sourceIdentityConfirmationStore diagnostics passed');
} finally {
    rmSync(root, { recursive: true, force: true });
}
