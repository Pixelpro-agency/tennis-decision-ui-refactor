import assert from 'node:assert/strict';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import {
    createMatchHistoryWriterAuthority,
    probeProcessIdentity
} from './matchHistoryWriterAuthority.js';

let passed = 0;
let failed = 0;

async function test(name, callback) {
    try {
        await callback();
        passed += 1;
        console.log(`  PASS [${name}]`);
    } catch (error) {
        failed += 1;
        console.error(`  FAIL [${name}]`);
        console.error(error);
    }
}

function uuid(number) {
    return `00000000-0000-4000-8000-${String(number).padStart(12, '0')}`;
}

function normalizeIdentityPath(value) {
    const normalized = path.normalize(value);
    return process.platform === 'win32'
        ? normalized.toLowerCase()
        : normalized;
}

async function pathIdentity(value) {
    const canonical = await fsp.realpath(value);
    return `sha256:${createHash('sha256')
        .update(normalizeIdentityPath(canonical))
        .digest('hex')}`;
}

async function createFixture(label) {
    const root = await fsp.mkdtemp(
        path.join(os.tmpdir(), `td-ui-writer-authority-${label}-`)
    );
    return {
        root,
        repositoryRoot: root,
        storageDir: path.join(root, 'backend', 'match_history'),
        authorityDir: path.join(
            root,
            'backend',
            'match_history',
            '.writer_authority'
        )
    };
}

async function removeFixture(fixture) {
    await fsp.rm(fixture.root, { recursive: true, force: true });
}

async function withFixture(label, callback) {
    const fixture = await createFixture(label);
    try {
        return await callback(fixture);
    } finally {
        await removeFixture(fixture);
    }
}

function createProbe(states) {
    return async (pid) => {
        const value = states.get(pid);
        return value || {
            state: 'unknown',
            reason: 'test_pid_unconfigured',
            startFingerprint: null
        };
    };
}

function alive(startFingerprint) {
    return {
        state: 'alive',
        reason: 'identity_verified',
        startFingerprint
    };
}

function dead() {
    return {
        state: 'dead',
        reason: 'pid_not_found',
        startFingerprint: null
    };
}

function unknown() {
    return {
        state: 'unknown',
        reason: 'process_identity_unavailable',
        startFingerprint: null
    };
}

function createDeferred() {
    let resolve;
    let reject;
    const promise = new Promise((resolvePromise, rejectPromise) => {
        resolve = resolvePromise;
        reject = rejectPromise;
    });
    return { promise, resolve, reject };
}

async function prepareAuthorityDir(fixture) {
    await fsp.mkdir(fixture.authorityDir, { recursive: true });
}

async function createRecord(fixture, overrides = {}) {
    await prepareAuthorityDir(fixture);
    const backendInstanceId = overrides.backendInstanceId || uuid(900);
    const record = {
        schema: 1,
        project: 'tennis-decision-ui',
        backendInstanceId,
        pid: 900,
        processStartFingerprint: 'fingerprint-900',
        createdAt: '2026-08-04T10:00:00.000Z',
        repositoryIdentity: await pathIdentity(fixture.repositoryRoot),
        storageIdentity: await pathIdentity(fixture.storageDir),
        ...overrides
    };
    const filename = overrides.filename ||
        `${record.backendInstanceId}.json`;
    const recordPath = path.join(fixture.authorityDir, filename);
    await fsp.writeFile(
        recordPath,
        `${JSON.stringify(record, null, 2)}\n`,
        'utf8'
    );
    return { record, recordPath };
}

function authorityOptions(
    fixture,
    {
        processId,
        processProbe,
        backendInstanceId,
        storageDir = fixture.storageDir,
        repositoryRoot = fixture.repositoryRoot,
        extra = {}
    }
) {
    return {
        repositoryRoot,
        storageDir,
        processId,
        processProbe,
        now: () => '2026-08-04T10:00:00.000Z',
        randomUUIDFn: () => backendInstanceId,
        ...extra
    };
}

console.log('\n=== matchHistoryWriterAuthority.test.mjs ===\n');

await test('T01-import-and-factory-have-no-storage-side-effects', async () => {
    await withFixture('factory', async fixture => {
        assert.equal(fs.existsSync(fixture.storageDir), false);
        const authority = createMatchHistoryWriterAuthority(
            authorityOptions(fixture, {
                processId: 101,
                processProbe: createProbe(new Map([
                    [101, alive('fingerprint-101')]
                ])),
                backendInstanceId: uuid(101)
            })
        );
        assert.equal(typeof authority.acquire, 'function');
        assert.equal(typeof authority.release, 'function');
        assert.equal(fs.existsSync(fixture.storageDir), false);
        assert.equal(fs.existsSync(fixture.authorityDir), false);
    });
});

await test('T02-empty-directory-acquires-authority', async () => {
    await withFixture('empty', async fixture => {
        const authority = createMatchHistoryWriterAuthority(
            authorityOptions(fixture, {
                processId: 102,
                processProbe: createProbe(new Map([
                    [102, alive('fingerprint-102')]
                ])),
                backendInstanceId: uuid(102)
            })
        );
        const result = await authority.acquire();
        assert.deepEqual(result, {
            ok: true,
            acquired: true,
            state: 'acquired',
            reason: null,
            backendInstanceId: uuid(102)
        });
    });
});

await test('T03-record-has-required-schema-and-identities', async () => {
    await withFixture('record', async fixture => {
        const authority = createMatchHistoryWriterAuthority(
            authorityOptions(fixture, {
                processId: 103,
                processProbe: createProbe(new Map([
                    [103, alive('fingerprint-103')]
                ])),
                backendInstanceId: uuid(103)
            })
        );
        await authority.acquire();
        const recordPath = path.join(
            fixture.authorityDir,
            `${uuid(103)}.json`
        );
        const record = JSON.parse(await fsp.readFile(recordPath, 'utf8'));
        assert.equal(record.schema, 1);
        assert.equal(record.project, 'tennis-decision-ui');
        assert.equal(record.backendInstanceId, uuid(103));
        assert.equal(record.pid, 103);
        assert.equal(
            record.processStartFingerprint,
            'fingerprint-103'
        );
        assert.equal(record.createdAt, '2026-08-04T10:00:00.000Z');
        assert.match(record.repositoryIdentity, /^sha256:[0-9a-f]{64}$/);
        assert.match(record.storageIdentity, /^sha256:[0-9a-f]{64}$/);
        assert.equal(JSON.stringify(record).includes(fixture.root), false);
        assert.equal('port' in record, false);
        assert.equal('url' in record, false);
    });
});

await test('T04-second-live-writer-is-blocked', async () => {
    await withFixture('live-writer', async fixture => {
        const states = new Map([
            [104, alive('fingerprint-104')],
            [204, alive('fingerprint-204')]
        ]);
        const first = createMatchHistoryWriterAuthority(
            authorityOptions(fixture, {
                processId: 104,
                processProbe: createProbe(states),
                backendInstanceId: uuid(104)
            })
        );
        const second = createMatchHistoryWriterAuthority(
            authorityOptions(fixture, {
                processId: 204,
                processProbe: createProbe(states),
                backendInstanceId: uuid(204)
            })
        );
        assert.equal((await first.acquire()).acquired, true);
        const blocked = await second.acquire();
        assert.equal(blocked.ok, false);
        assert.equal(blocked.acquired, false);
        assert.equal(blocked.state, 'active');
        assert.equal(
            fs.existsSync(path.join(
                fixture.authorityDir,
                `${uuid(104)}.json`
            )),
            true
        );
        assert.equal(
            fs.existsSync(path.join(
                fixture.authorityDir,
                `${uuid(204)}.json`
            )),
            false
        );
    });
});

await test('T05-positively-dead-owner-is-reclaimed', async () => {
    await withFixture('dead-owner', async fixture => {
        const stale = await createRecord(fixture, {
            backendInstanceId: uuid(105),
            pid: 105,
            processStartFingerprint: 'fingerprint-old-105'
        });
        const states = new Map([
            [105, dead()],
            [205, alive('fingerprint-205')]
        ]);
        const authority = createMatchHistoryWriterAuthority(
            authorityOptions(fixture, {
                processId: 205,
                processProbe: createProbe(states),
                backendInstanceId: uuid(205)
            })
        );
        const result = await authority.acquire();
        assert.equal(result.ok, true);
        assert.equal(result.state, 'reclaimed');
        assert.equal(result.reason, 'stale_records_reclaimed');
        assert.equal(fs.existsSync(stale.recordPath), false);
    });
});

await test('T06-recycled-pid-owner-is-reclaimed', async () => {
    await withFixture('recycled', async fixture => {
        const stale = await createRecord(fixture, {
            backendInstanceId: uuid(106),
            pid: 106,
            processStartFingerprint: 'fingerprint-old-106'
        });
        const states = new Map([
            [106, alive('fingerprint-new-106')],
            [206, alive('fingerprint-206')]
        ]);
        const authority = createMatchHistoryWriterAuthority(
            authorityOptions(fixture, {
                processId: 206,
                processProbe: createProbe(states),
                backendInstanceId: uuid(206)
            })
        );
        const result = await authority.acquire();
        assert.equal(result.ok, true);
        assert.equal(result.state, 'reclaimed');
        assert.equal(fs.existsSync(stale.recordPath), false);
    });
});

await test('T07-unknown-probe-blocks-and-preserves-record', async () => {
    await withFixture('unknown-probe', async fixture => {
        const existing = await createRecord(fixture, {
            backendInstanceId: uuid(107),
            pid: 107,
            processStartFingerprint: 'fingerprint-107'
        });
        const states = new Map([
            [107, unknown()],
            [207, alive('fingerprint-207')]
        ]);
        const authority = createMatchHistoryWriterAuthority(
            authorityOptions(fixture, {
                processId: 207,
                processProbe: createProbe(states),
                backendInstanceId: uuid(207)
            })
        );
        const result = await authority.acquire();
        assert.equal(result.ok, false);
        assert.equal(result.state, 'unknown');
        assert.equal(fs.existsSync(existing.recordPath), true);
    });
});

await test('T08-malformed-json-blocks-and-is-not-deleted', async () => {
    await withFixture('malformed', async fixture => {
        await prepareAuthorityDir(fixture);
        const malformedPath = path.join(
            fixture.authorityDir,
            `${uuid(108)}.json`
        );
        await fsp.writeFile(malformedPath, '{"schema":', 'utf8');
        const authority = createMatchHistoryWriterAuthority(
            authorityOptions(fixture, {
                processId: 208,
                processProbe: createProbe(new Map([
                    [208, alive('fingerprint-208')]
                ])),
                backendInstanceId: uuid(208)
            })
        );
        const result = await authority.acquire();
        assert.equal(result.ok, false);
        assert.equal(result.state, 'unknown');
        assert.equal(await fsp.readFile(malformedPath, 'utf8'), '{"schema":');
    });
});

await test('T09-invalid-schema-or-project-is-blocking', async () => {
    for (const [label, overrides] of [
        ['schema', { schema: 2 }],
        ['project', { project: 'other-project' }]
    ]) {
        await withFixture(`invalid-${label}`, async fixture => {
            const existing = await createRecord(fixture, {
                backendInstanceId: label === 'schema'
                    ? uuid(109)
                    : uuid(110),
                pid: 109,
                processStartFingerprint: 'fingerprint-109',
                ...overrides
            });
            const authority = createMatchHistoryWriterAuthority(
                authorityOptions(fixture, {
                    processId: 209,
                    processProbe: createProbe(new Map([
                        [209, alive('fingerprint-209')]
                    ])),
                    backendInstanceId: uuid(209)
                })
            );
            const result = await authority.acquire();
            assert.equal(result.ok, false);
            assert.equal(result.state, 'unknown');
            assert.equal(fs.existsSync(existing.recordPath), true);
        });
    }
});

await test('T10-repository-identity-mismatch-is-blocking', async () => {
    await withFixture('repo-mismatch', async fixture => {
        const existing = await createRecord(fixture, {
            backendInstanceId: uuid(111),
            repositoryIdentity: `sha256:${'0'.repeat(64)}`
        });
        const authority = createMatchHistoryWriterAuthority(
            authorityOptions(fixture, {
                processId: 211,
                processProbe: createProbe(new Map([
                    [211, alive('fingerprint-211')]
                ])),
                backendInstanceId: uuid(211)
            })
        );
        const result = await authority.acquire();
        assert.equal(result.state, 'unknown');
        assert.equal(result.reason, 'repository_identity_mismatch');
        assert.equal(fs.existsSync(existing.recordPath), true);
    });
});

await test('T11-storage-identity-mismatch-is-blocking', async () => {
    await withFixture('storage-mismatch', async fixture => {
        const existing = await createRecord(fixture, {
            backendInstanceId: uuid(112),
            storageIdentity: `sha256:${'f'.repeat(64)}`
        });
        const authority = createMatchHistoryWriterAuthority(
            authorityOptions(fixture, {
                processId: 212,
                processProbe: createProbe(new Map([
                    [212, alive('fingerprint-212')]
                ])),
                backendInstanceId: uuid(212)
            })
        );
        const result = await authority.acquire();
        assert.equal(result.state, 'unknown');
        assert.equal(result.reason, 'storage_identity_mismatch');
        assert.equal(fs.existsSync(existing.recordPath), true);
    });
});

await test('T12-release-removes-only-own-record', async () => {
    await withFixture('release', async fixture => {
        const authority = createMatchHistoryWriterAuthority(
            authorityOptions(fixture, {
                processId: 113,
                processProbe: createProbe(new Map([
                    [113, alive('fingerprint-113')]
                ])),
                backendInstanceId: uuid(113)
            })
        );
        await authority.acquire();
        const ownPath = path.join(
            fixture.authorityDir,
            `${uuid(113)}.json`
        );
        const result = await authority.release();
        assert.deepEqual(result, {
            ok: true,
            released: true,
            state: 'released',
            reason: null
        });
        assert.equal(fs.existsSync(ownPath), false);
        assert.equal(fs.existsSync(fixture.authorityDir), true);
    });
});

await test('T13-repeated-release-is-idempotent', async () => {
    await withFixture('release-repeat', async fixture => {
        const authority = createMatchHistoryWriterAuthority(
            authorityOptions(fixture, {
                processId: 114,
                processProbe: createProbe(new Map([
                    [114, alive('fingerprint-114')]
                ])),
                backendInstanceId: uuid(114)
            })
        );
        await authority.acquire();
        assert.equal((await authority.release()).state, 'released');
        assert.deepEqual(await authority.release(), {
            ok: true,
            released: true,
            state: 'absent',
            reason: null
        });
    });
});

await test('T14-release-non-owner-preserves-record', async () => {
    await withFixture('release-non-owner', async fixture => {
        const instanceId = uuid(115);
        const existing = await createRecord(fixture, {
            backendInstanceId: instanceId,
            pid: 999,
            processStartFingerprint: 'fingerprint-999'
        });
        const authority = createMatchHistoryWriterAuthority(
            authorityOptions(fixture, {
                processId: 115,
                processProbe: createProbe(new Map([
                    [115, alive('fingerprint-115')]
                ])),
                backendInstanceId: instanceId
            })
        );
        const result = await authority.release();
        assert.equal(result.ok, false);
        assert.equal(result.released, false);
        assert.equal(result.state, 'not_owner');
        assert.equal(fs.existsSync(existing.recordPath), true);
    });
});

await test('T15-old-authority-cannot-delete-new-authority-record', async () => {
    await withFixture('old-new', async fixture => {
        const states = new Map([
            [116, alive('fingerprint-116')],
            [216, alive('fingerprint-216')]
        ]);
        const oldAuthority = createMatchHistoryWriterAuthority(
            authorityOptions(fixture, {
                processId: 116,
                processProbe: createProbe(states),
                backendInstanceId: uuid(116)
            })
        );
        await oldAuthority.acquire();
        await oldAuthority.release();

        const newAuthority = createMatchHistoryWriterAuthority(
            authorityOptions(fixture, {
                processId: 216,
                processProbe: createProbe(states),
                backendInstanceId: uuid(216)
            })
        );
        await newAuthority.acquire();
        const newPath = path.join(
            fixture.authorityDir,
            `${uuid(216)}.json`
        );

        const oldRelease = await oldAuthority.release();
        assert.equal(oldRelease.state, 'absent');
        assert.equal(fs.existsSync(newPath), true);
    });
});

await test('T16-unverifiable-current-process-creates-no-record', async () => {
    await withFixture('current-unknown', async fixture => {
        const authority = createMatchHistoryWriterAuthority(
            authorityOptions(fixture, {
                processId: 117,
                processProbe: createProbe(new Map([
                    [117, unknown()]
                ])),
                backendInstanceId: uuid(117)
            })
        );
        const result = await authority.acquire();
        assert.equal(result.ok, false);
        assert.equal(result.state, 'unknown');
        assert.equal(fs.existsSync(fixture.storageDir), false);
        assert.equal(fs.existsSync(fixture.authorityDir), false);
    });
});

await test('T17-public-results-do-not-expose-local-paths', async () => {
    await withFixture('bounded-results', async fixture => {
        const states = new Map([
            [118, alive('fingerprint-118')],
            [218, alive('fingerprint-218')]
        ]);
        const first = createMatchHistoryWriterAuthority(
            authorityOptions(fixture, {
                processId: 118,
                processProbe: createProbe(states),
                backendInstanceId: uuid(118)
            })
        );
        const second = createMatchHistoryWriterAuthority(
            authorityOptions(fixture, {
                processId: 218,
                processProbe: createProbe(states),
                backendInstanceId: uuid(218)
            })
        );
        const results = [
            await first.acquire(),
            await second.acquire(),
            await first.release()
        ];
        const serialized = JSON.stringify(results);
        assert.equal(serialized.includes(fixture.root), false);
        assert.equal(serialized.includes('.writer_authority'), false);
        assert.equal(serialized.includes('match_history'), false);
    });
});

await test('T18-path-resolution-is-independent-from-process-cwd', async () => {
    await withFixture('cwd-repository', async fixture => {
        const unrelated = await fsp.mkdtemp(
            path.join(os.tmpdir(), 'td-ui-unrelated-cwd-')
        );
        const originalCwd = process.cwd();
        try {
            process.chdir(unrelated);
            const authority = createMatchHistoryWriterAuthority({
                repositoryRoot: fixture.repositoryRoot,
                processId: 119,
                processProbe: createProbe(new Map([
                    [119, alive('fingerprint-119')]
                ])),
                now: () => '2026-08-04T10:00:00.000Z',
                randomUUIDFn: () => uuid(119)
            });
            const result = await authority.acquire();
            assert.equal(result.ok, true);
            assert.equal(
                fs.existsSync(path.join(
                    fixture.repositoryRoot,
                    'backend',
                    'match_history',
                    '.writer_authority',
                    `${uuid(119)}.json`
                )),
                true
            );
            assert.equal(
                fs.existsSync(path.join(
                    unrelated,
                    'backend',
                    'match_history'
                )),
                false
            );
        } finally {
            process.chdir(originalCwd);
            await fsp.rm(unrelated, { recursive: true, force: true });
        }
    });
});

await test('T19-port-option-does-not-affect-authority', async () => {
    await withFixture('port-independent', async fixture => {
        const states = new Map([
            [120, alive('fingerprint-120')],
            [220, alive('fingerprint-220')]
        ]);
        const first = createMatchHistoryWriterAuthority(
            authorityOptions(fixture, {
                processId: 120,
                processProbe: createProbe(states),
                backendInstanceId: uuid(120),
                extra: { port: 3001 }
            })
        );
        const second = createMatchHistoryWriterAuthority(
            authorityOptions(fixture, {
                processId: 220,
                processProbe: createProbe(states),
                backendInstanceId: uuid(220),
                extra: { port: 3999 }
            })
        );
        assert.equal((await first.acquire()).ok, true);
        const blocked = await second.acquire();
        assert.equal(blocked.ok, false);
        assert.equal(blocked.state, 'active');
        const firstRecord = JSON.parse(await fsp.readFile(
            path.join(fixture.authorityDir, `${uuid(120)}.json`),
            'utf8'
        ));
        assert.equal('port' in firstRecord, false);
    });
});

await test('T20-contention-never-produces-two-acquired-authorities', async () => {
    await withFixture('contention', async fixture => {
        const states = new Map([
            [121, alive('fingerprint-121')],
            [221, alive('fingerprint-221')]
        ]);
        const delayedProbe = async pid => {
            await new Promise(resolve => setTimeout(resolve, 0));
            return states.get(pid) || unknown();
        };
        const first = createMatchHistoryWriterAuthority(
            authorityOptions(fixture, {
                processId: 121,
                processProbe: delayedProbe,
                backendInstanceId: uuid(121)
            })
        );
        const second = createMatchHistoryWriterAuthority(
            authorityOptions(fixture, {
                processId: 221,
                processProbe: delayedProbe,
                backendInstanceId: uuid(221)
            })
        );
        const [left, right] = await Promise.all([
            first.acquire(),
            second.acquire()
        ]);
        const acquiredCount = [left, right]
            .filter(result => result.acquired === true)
            .length;
        assert.ok(
            acquiredCount === 0 || acquiredCount === 1,
            `unexpected acquired count: ${acquiredCount}`
        );
        assert.notEqual(acquiredCount, 2);
    });
});

await test('T21-repeated-acquire-by-owner-is-already-owned', async () => {
    await withFixture('already-owned', async fixture => {
        const authority = createMatchHistoryWriterAuthority(
            authorityOptions(fixture, {
                processId: 122,
                processProbe: createProbe(new Map([
                    [122, alive('fingerprint-122')]
                ])),
                backendInstanceId: uuid(122)
            })
        );
        assert.equal((await authority.acquire()).state, 'acquired');
        const repeated = await authority.acquire();
        assert.equal(repeated.ok, true);
        assert.equal(repeated.state, 'already_owned');
    });
});

await test('T22-native-current-process-probe-is-verifiable', async () => {
    const result = await probeProcessIdentity(process.pid);
    if (process.platform === 'win32' ||
        process.platform.startsWith('linux')) {
        assert.equal(result.state, 'alive');
        assert.equal(typeof result.startFingerprint, 'string');
        assert.ok(result.startFingerprint.length > 0);
    } else {
        assert.ok(
            result.state === 'unknown' || result.state === 'dead'
        );
    }
});

await test('T23-release-waits-for-in-flight-acquire-and-removes-record', async () => {
    await withFixture('release-during-acquire', async fixture => {
        const acquireEntered = createDeferred();
        const allowAcquire = createDeferred();
        let firstProbe = true;
        const processProbe = async () => {
            if (firstProbe) {
                firstProbe = false;
                acquireEntered.resolve();
                await allowAcquire.promise;
            }
            return alive('fingerprint-123');
        };
        const authority = createMatchHistoryWriterAuthority(
            authorityOptions(fixture, {
                processId: 123,
                processProbe,
                backendInstanceId: uuid(123)
            })
        );

        const acquirePromise = authority.acquire();
        await acquireEntered.promise;
        const releasePromise = authority.release();
        allowAcquire.resolve();

        const [acquireResult, releaseResult] = await Promise.all([
            acquirePromise,
            releasePromise
        ]);
        assert.equal(acquireResult.ok, true);
        assert.equal(acquireResult.acquired, true);
        assert.deepEqual(releaseResult, {
            ok: true,
            released: true,
            state: 'released',
            reason: null
        });
        assert.equal(
            fs.existsSync(path.join(
                fixture.authorityDir,
                `${uuid(123)}.json`
            )),
            false
        );
    });
});

await test('T24-acquire-waits-for-in-flight-release-and-reacquires', async () => {
    await withFixture('acquire-during-release', async fixture => {
        const releaseEntered = createDeferred();
        const allowRelease = createDeferred();
        let blockNextProbe = false;
        const processProbe = async () => {
            if (blockNextProbe) {
                blockNextProbe = false;
                releaseEntered.resolve();
                await allowRelease.promise;
            }
            return alive('fingerprint-124');
        };
        const authority = createMatchHistoryWriterAuthority(
            authorityOptions(fixture, {
                processId: 124,
                processProbe,
                backendInstanceId: uuid(124)
            })
        );

        assert.equal((await authority.acquire()).state, 'acquired');
        blockNextProbe = true;
        const releasePromise = authority.release();
        await releaseEntered.promise;
        const acquirePromise = authority.acquire();
        allowRelease.resolve();

        const [releaseResult, acquireResult] = await Promise.all([
            releasePromise,
            acquirePromise
        ]);
        assert.equal(releaseResult.state, 'released');
        assert.equal(acquireResult.ok, true);
        assert.equal(acquireResult.acquired, true);
        assert.equal(acquireResult.state, 'acquired');

        const recordPath = path.join(
            fixture.authorityDir,
            `${uuid(124)}.json`
        );
        assert.equal(fs.existsSync(recordPath), true);
        const record = JSON.parse(await fsp.readFile(recordPath, 'utf8'));
        assert.equal(record.backendInstanceId, uuid(124));
        assert.equal(record.pid, 124);
    });
});

await test('T25-concurrent-duplicate-acquire-shares-one-operation', async () => {
    await withFixture('duplicate-acquire', async fixture => {
        const acquireEntered = createDeferred();
        const allowAcquire = createDeferred();
        let firstProbe = true;
        const processProbe = async () => {
            if (firstProbe) {
                firstProbe = false;
                acquireEntered.resolve();
                await allowAcquire.promise;
            }
            return alive('fingerprint-125');
        };
        const authority = createMatchHistoryWriterAuthority(
            authorityOptions(fixture, {
                processId: 125,
                processProbe,
                backendInstanceId: uuid(125)
            })
        );

        const first = authority.acquire();
        await acquireEntered.promise;
        const second = authority.acquire();
        assert.strictEqual(first, second);
        allowAcquire.resolve();

        const result = await first;
        assert.equal(result.ok, true);
        assert.equal(result.acquired, true);
        const ownerRecords = (await fsp.readdir(fixture.authorityDir))
            .filter(name => name.endsWith('.json'));
        assert.deepEqual(ownerRecords, [`${uuid(125)}.json`]);
    });
});

await test('T26-concurrent-duplicate-release-shares-one-operation', async () => {
    await withFixture('duplicate-release', async fixture => {
        const releaseEntered = createDeferred();
        const allowRelease = createDeferred();
        let blockNextProbe = false;
        const processProbe = async () => {
            if (blockNextProbe) {
                blockNextProbe = false;
                releaseEntered.resolve();
                await allowRelease.promise;
            }
            return alive('fingerprint-126');
        };
        const authority = createMatchHistoryWriterAuthority(
            authorityOptions(fixture, {
                processId: 126,
                processProbe,
                backendInstanceId: uuid(126)
            })
        );

        assert.equal((await authority.acquire()).state, 'acquired');
        blockNextProbe = true;
        const first = authority.release();
        await releaseEntered.promise;
        const second = authority.release();
        assert.strictEqual(first, second);
        allowRelease.resolve();

        const result = await first;
        assert.equal(result.state, 'released');
        assert.equal(
            fs.existsSync(path.join(
                fixture.authorityDir,
                `${uuid(126)}.json`
            )),
            false
        );
    });
});

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);

if (failed > 0) {
    throw new Error(
        `${failed} matchHistoryWriterAuthority assertions failed`
    );
}
