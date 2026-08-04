import fsp from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash, randomUUID } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const MODULE_DIR = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_REPOSITORY_ROOT = path.resolve(MODULE_DIR, '../../..');
const PROJECT = 'tennis-decision-ui';
const SCHEMA = 1;
const AUTHORITY_DIR_NAME = '.writer_authority';
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const IDENTITY_PATTERN = /^sha256:[0-9a-f]{64}$/;
const RECORD_NAME_PATTERN = /^([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})\.json$/i;

function isPositivePid(value) {
    return Number.isInteger(value) && value > 0;
}

function isNonEmptyString(value) {
    return typeof value === 'string' && value.trim().length > 0;
}

function normalizeProbeResult(value) {
    if (!value || typeof value !== 'object') {
        return {
            state: 'unknown',
            reason: 'process_probe_invalid',
            startFingerprint: null
        };
    }

    const state = value.state === 'alive' ||
        value.state === 'dead' ||
        value.state === 'unknown'
        ? value.state
        : 'unknown';
    const nestedFingerprint = value.identity &&
        typeof value.identity === 'object'
        ? value.identity.startFingerprint
        : null;
    const startFingerprint = isNonEmptyString(value.startFingerprint)
        ? value.startFingerprint
        : (isNonEmptyString(nestedFingerprint) ? nestedFingerprint : null);

    if (state === 'alive' && !startFingerprint) {
        return {
            state: 'unknown',
            reason: 'process_identity_unavailable',
            startFingerprint: null
        };
    }

    return {
        state,
        reason: state === 'alive'
            ? 'identity_verified'
            : state === 'dead'
                ? 'pid_not_found'
                : 'process_identity_unavailable',
        startFingerprint
    };
}

function signalProcessState(pid, signalProcess) {
    try {
        signalProcess(pid, 0);
        return { state: 'present', reason: null };
    } catch (error) {
        if (error?.code === 'ESRCH') {
            return { state: 'dead', reason: 'pid_not_found' };
        }
        if (error?.code === 'EPERM') {
            return { state: 'present', reason: 'permission_denied' };
        }
        return { state: 'unknown', reason: 'process_probe_failed' };
    }
}

async function probeLinuxProcess(pid, options) {
    const signalProcess = options.signalProcess || process.kill.bind(process);
    const readFile = options.readFile || fsp.readFile;
    const existence = signalProcessState(pid, signalProcess);

    if (existence.state === 'dead') {
        return {
            state: 'dead',
            reason: existence.reason,
            startFingerprint: null
        };
    }
    if (existence.state === 'unknown') {
        return {
            state: 'unknown',
            reason: existence.reason,
            startFingerprint: null
        };
    }

    try {
        const statText = await readFile(`/proc/${pid}/stat`, 'utf8');
        const closingParen = statText.lastIndexOf(')');
        if (closingParen < 0) {
            throw new Error('malformed_proc_stat');
        }
        const fieldsAfterName = statText.slice(closingParen + 2).trim().split(/\s+/);
        const startTicks = fieldsAfterName[19];
        if (!isNonEmptyString(startTicks) || !/^\d+$/.test(startTicks)) {
            throw new Error('invalid_start_ticks');
        }
        return {
            state: 'alive',
            reason: 'identity_verified',
            startFingerprint: `linux-startticks:${startTicks}`
        };
    } catch (_error) {
        const recheck = signalProcessState(pid, signalProcess);
        if (recheck.state === 'dead') {
            return {
                state: 'dead',
                reason: recheck.reason,
                startFingerprint: null
            };
        }
        return {
            state: 'unknown',
            reason: 'process_identity_unavailable',
            startFingerprint: null
        };
    }
}

async function probeWindowsProcess(pid, options) {
    const signalProcess = options.signalProcess || process.kill.bind(process);
    const runExecFile = options.execFileFn || execFileAsync;
    const existence = signalProcessState(pid, signalProcess);

    if (existence.state === 'dead') {
        return {
            state: 'dead',
            reason: existence.reason,
            startFingerprint: null
        };
    }
    if (existence.state === 'unknown') {
        return {
            state: 'unknown',
            reason: existence.reason,
            startFingerprint: null
        };
    }

    const command = [
        '$ErrorActionPreference = "Stop"',
        `$p = Get-Process -Id ${pid} -ErrorAction Stop`,
        '$ticks = $p.StartTime.ToUniversalTime().Ticks.ToString()',
        '[Console]::Out.Write(([pscustomobject]@{ pid = $p.Id; startTicks = $ticks } | ConvertTo-Json -Compress))'
    ].join('; ');

    try {
        const result = await runExecFile(
            'powershell.exe',
            ['-NoProfile', '-NonInteractive', '-Command', command],
            {
                windowsHide: true,
                timeout: 3000,
                maxBuffer: 16 * 1024,
                encoding: 'utf8'
            }
        );
        const stdout = typeof result === 'string' ? result : result?.stdout;
        const parsed = JSON.parse(String(stdout || '').trim());
        const startTicks = String(parsed?.startTicks || '').trim();
        if (Number(parsed?.pid) !== pid || !/^\d+$/.test(startTicks)) {
            throw new Error('invalid_windows_identity');
        }
        return {
            state: 'alive',
            reason: 'identity_verified',
            startFingerprint: `windows-startticks:${startTicks}`
        };
    } catch (_error) {
        const recheck = signalProcessState(pid, signalProcess);
        if (recheck.state === 'dead') {
            return {
                state: 'dead',
                reason: recheck.reason,
                startFingerprint: null
            };
        }
        return {
            state: 'unknown',
            reason: 'process_identity_unavailable',
            startFingerprint: null
        };
    }
}

async function probeUnsupportedProcess(pid, options) {
    const signalProcess = options.signalProcess || process.kill.bind(process);
    const existence = signalProcessState(pid, signalProcess);

    if (existence.state === 'dead') {
        return {
            state: 'dead',
            reason: existence.reason,
            startFingerprint: null
        };
    }

    return {
        state: 'unknown',
        reason: 'process_identity_unavailable',
        startFingerprint: null
    };
}

export async function probeProcessIdentity(pid, options = {}) {
    if (!isPositivePid(pid)) {
        return {
            state: 'unknown',
            reason: 'invalid_pid',
            startFingerprint: null
        };
    }

    const platform = options.platform || process.platform;
    if (platform === 'win32') {
        return probeWindowsProcess(pid, options);
    }
    if (platform === 'linux' || platform.startsWith('linux')) {
        return probeLinuxProcess(pid, options);
    }
    return probeUnsupportedProcess(pid, options);
}

function normalizePathForIdentity(value, platform = process.platform) {
    const normalized = path.normalize(value);
    return platform === 'win32' ? normalized.toLowerCase() : normalized;
}

function createPathIdentity(canonicalPath) {
    return `sha256:${createHash('sha256')
        .update(normalizePathForIdentity(canonicalPath))
        .digest('hex')}`;
}

async function resolveCanonicalPath(targetPath) {
    return fsp.realpath(path.resolve(targetPath));
}

function validateRecord(record, expectedFilename) {
    if (!record || typeof record !== 'object' || Array.isArray(record)) {
        return { ok: false, reason: 'record_not_object' };
    }
    if (record.schema !== SCHEMA) {
        return { ok: false, reason: 'invalid_schema' };
    }
    if (record.project !== PROJECT) {
        return { ok: false, reason: 'invalid_project' };
    }
    if (!isNonEmptyString(record.backendInstanceId) ||
        !UUID_PATTERN.test(record.backendInstanceId)) {
        return { ok: false, reason: 'invalid_backend_instance_id' };
    }
    if (expectedFilename !== `${record.backendInstanceId}.json`) {
        return { ok: false, reason: 'record_filename_mismatch' };
    }
    if (!isPositivePid(record.pid)) {
        return { ok: false, reason: 'invalid_pid' };
    }
    if (!isNonEmptyString(record.processStartFingerprint)) {
        return { ok: false, reason: 'invalid_process_fingerprint' };
    }
    if (!isNonEmptyString(record.createdAt) ||
        !Number.isFinite(Date.parse(record.createdAt))) {
        return { ok: false, reason: 'invalid_created_at' };
    }
    if (!IDENTITY_PATTERN.test(record.repositoryIdentity || '')) {
        return { ok: false, reason: 'invalid_repository_identity' };
    }
    if (!IDENTITY_PATTERN.test(record.storageIdentity || '')) {
        return { ok: false, reason: 'invalid_storage_identity' };
    }
    return { ok: true, reason: null };
}

function acquireSuccess(state, backendInstanceId, reason = null) {
    return {
        ok: true,
        acquired: true,
        state,
        reason,
        backendInstanceId
    };
}

function acquireFailure(state, reason) {
    return {
        ok: false,
        acquired: false,
        state,
        reason
    };
}

function releaseSuccess(state) {
    return {
        ok: true,
        released: true,
        state,
        reason: null
    };
}

function releaseFailure(state, reason) {
    return {
        ok: false,
        released: false,
        state,
        reason
    };
}

function createTimestamp(nowFn) {
    const raw = nowFn();
    const date = raw instanceof Date ? raw : new Date(raw);
    if (!Number.isFinite(date.getTime())) {
        throw new Error('invalid_clock');
    }
    return date.toISOString();
}

export function createMatchHistoryWriterAuthority(options = {}) {
    const repositoryRoot = path.resolve(
        options.repositoryRoot || DEFAULT_REPOSITORY_ROOT
    );
    const storageDir = path.resolve(
        options.storageDir ||
        path.join(repositoryRoot, 'backend', 'match_history')
    );
    const authorityDir = path.join(storageDir, AUTHORITY_DIR_NAME);
    const processId = options.processId === undefined
        ? process.pid
        : options.processId;
    const processProbe = options.processProbe ||
        ((pid) => probeProcessIdentity(pid));
    const now = options.now || (() => new Date());
    const randomUUIDFn = options.randomUUIDFn || randomUUID;
    const backendInstanceId = randomUUIDFn();

    if (!isPositivePid(processId)) {
        throw new TypeError('processId must be a positive integer');
    }
    if (!isNonEmptyString(backendInstanceId) ||
        !UUID_PATTERN.test(backendInstanceId)) {
        throw new TypeError('randomUUIDFn must return a UUID');
    }
    if (typeof processProbe !== 'function' ||
        typeof now !== 'function') {
        throw new TypeError('invalid authority dependencies');
    }

    const ownRecordPath = path.join(
        authorityDir,
        `${backendInstanceId}.json`
    );
    let acquirePromise = null;
    let releasePromise = null;

    async function resolvePotentialCanonicalPath(targetPath) {
        const resolved = path.resolve(targetPath);
        const missingParts = [];
        let cursor = resolved;

        while (true) {
            try {
                const canonicalParent = await fsp.realpath(cursor);
                return path.join(
                    canonicalParent,
                    ...missingParts
                );
            } catch (error) {
                if (error?.code !== 'ENOENT') {
                    throw error;
                }
                const parent = path.dirname(cursor);
                if (parent === cursor) {
                    throw error;
                }
                missingParts.unshift(path.basename(cursor));
                cursor = parent;
            }
        }
    }

    async function getContext({ allowMissingStorage }) {
        const canonicalRepositoryRoot = await resolveCanonicalPath(
            repositoryRoot
        );
        const canonicalStorageDir = allowMissingStorage
            ? await resolvePotentialCanonicalPath(storageDir)
            : await resolveCanonicalPath(storageDir);
        return {
            repositoryIdentity: createPathIdentity(canonicalRepositoryRoot),
            storageIdentity: createPathIdentity(canonicalStorageDir)
        };
    }

    async function safeProbe(pid) {
        try {
            return normalizeProbeResult(await processProbe(pid));
        } catch (_error) {
            return {
                state: 'unknown',
                reason: 'process_probe_failed',
                startFingerprint: null
            };
        }
    }

    async function classifyEntry(entry, context) {
        if (!entry.isFile() || !RECORD_NAME_PATTERN.test(entry.name)) {
            return {
                state: 'unknown',
                reason: 'unexpected_authority_entry',
                name: entry.name,
                record: null,
                raw: null
            };
        }

        const recordPath = path.join(authorityDir, entry.name);
        let raw;
        try {
            raw = await fsp.readFile(recordPath, 'utf8');
        } catch (_error) {
            return {
                state: 'unknown',
                reason: 'record_read_failed',
                name: entry.name,
                record: null,
                raw: null
            };
        }

        let record;
        try {
            record = JSON.parse(raw);
        } catch (_error) {
            return {
                state: 'unknown',
                reason: 'malformed_json',
                name: entry.name,
                record: null,
                raw
            };
        }

        const validation = validateRecord(record, entry.name);
        if (!validation.ok) {
            return {
                state: 'unknown',
                reason: validation.reason,
                name: entry.name,
                record,
                raw
            };
        }
        if (record.repositoryIdentity !== context.repositoryIdentity) {
            return {
                state: 'unknown',
                reason: 'repository_identity_mismatch',
                name: entry.name,
                record,
                raw
            };
        }
        if (record.storageIdentity !== context.storageIdentity) {
            return {
                state: 'unknown',
                reason: 'storage_identity_mismatch',
                name: entry.name,
                record,
                raw
            };
        }

        const probe = await safeProbe(record.pid);
        if (probe.state === 'dead') {
            return {
                state: 'stale',
                reason: 'dead_pid',
                name: entry.name,
                record,
                raw
            };
        }
        if (probe.state !== 'alive') {
            return {
                state: 'unknown',
                reason: probe.reason || 'process_identity_unavailable',
                name: entry.name,
                record,
                raw
            };
        }
        if (probe.startFingerprint !== record.processStartFingerprint) {
            return {
                state: 'stale',
                reason: 'pid_recycled',
                name: entry.name,
                record,
                raw
            };
        }

        return {
            state: 'active',
            reason: 'owner_verified',
            name: entry.name,
            record,
            raw
        };
    }

    async function scan(context) {
        let entries;
        try {
            entries = await fsp.readdir(authorityDir, {
                withFileTypes: true
            });
        } catch (_error) {
            return {
                ok: false,
                reason: 'authority_scan_failed',
                records: []
            };
        }

        const records = [];
        for (const entry of entries.sort((left, right) =>
            left.name.localeCompare(right.name))) {
            records.push(await classifyEntry(entry, context));
        }
        return { ok: true, reason: null, records };
    }

    async function removeStaleRecord(classification) {
        const recordPath = path.join(authorityDir, classification.name);
        try {
            const currentRaw = await fsp.readFile(recordPath, 'utf8');
            if (currentRaw !== classification.raw) {
                return false;
            }
            await fsp.unlink(recordPath);
            return true;
        } catch (error) {
            return error?.code === 'ENOENT';
        }
    }

    async function reclaimStale(classifications) {
        let reclaimed = 0;
        for (const classification of classifications) {
            if (classification.state !== 'stale') {
                continue;
            }
            if (!await removeStaleRecord(classification)) {
                return {
                    ok: false,
                    reason: 'stale_record_cleanup_failed',
                    reclaimed
                };
            }
            reclaimed += 1;
        }
        return { ok: true, reason: null, reclaimed };
    }

    function blockers(classifications) {
        return {
            unknown: classifications.find(item => item.state === 'unknown') ||
                null,
            otherActive: classifications.find(item =>
                item.state === 'active' &&
                item.record?.backendInstanceId !== backendInstanceId
            ) || null,
            ownActive: classifications.find(item =>
                item.state === 'active' &&
                item.record?.backendInstanceId === backendInstanceId
            ) || null
        };
    }

    async function removeOwnVerified(expected) {
        let raw;
        try {
            raw = await fsp.readFile(ownRecordPath, 'utf8');
        } catch (error) {
            return error?.code === 'ENOENT';
        }

        let record;
        try {
            record = JSON.parse(raw);
        } catch (_error) {
            return false;
        }

        if (record.schema !== SCHEMA ||
            record.project !== PROJECT ||
            record.backendInstanceId !== backendInstanceId ||
            record.pid !== processId ||
            record.processStartFingerprint !== expected.processStartFingerprint ||
            record.repositoryIdentity !== expected.repositoryIdentity ||
            record.storageIdentity !== expected.storageIdentity) {
            return false;
        }

        try {
            const secondRead = await fsp.readFile(ownRecordPath, 'utf8');
            if (secondRead !== raw) {
                return false;
            }
            await fsp.unlink(ownRecordPath);
            return true;
        } catch (error) {
            return error?.code === 'ENOENT';
        }
    }

    async function removeOwnAfterWriteFailure() {
        try {
            await fsp.unlink(ownRecordPath);
            return true;
        } catch (error) {
            return error?.code === 'ENOENT';
        }
    }

    async function acquireInternal() {
        let anticipatedContext;
        try {
            anticipatedContext = await getContext({
                allowMissingStorage: true
            });
        } catch (_error) {
            return acquireFailure('failed', 'authority_identity_unavailable');
        }

        const currentProbe = await safeProbe(processId);
        if (currentProbe.state !== 'alive') {
            return acquireFailure(
                'unknown',
                'current_process_unverifiable'
            );
        }

        let context;
        try {
            await fsp.mkdir(authorityDir, { recursive: true });
            context = await getContext({
                allowMissingStorage: false
            });
        } catch (_error) {
            return acquireFailure('failed', 'authority_prepare_failed');
        }

        if (anticipatedContext.repositoryIdentity !==
                context.repositoryIdentity ||
            anticipatedContext.storageIdentity !==
                context.storageIdentity) {
            return acquireFailure('unknown', 'authority_identity_changed');
        }

        let reclaimedCount = 0;
        let firstScan = await scan(context);
        if (!firstScan.ok) {
            return acquireFailure('failed', firstScan.reason);
        }

        const firstReclaim = await reclaimStale(firstScan.records);
        if (!firstReclaim.ok) {
            return acquireFailure('failed', firstReclaim.reason);
        }
        reclaimedCount += firstReclaim.reclaimed;

        let preCreateScan = await scan(context);
        if (!preCreateScan.ok) {
            return acquireFailure('failed', preCreateScan.reason);
        }
        let preBlockers = blockers(preCreateScan.records);
        if (preBlockers.unknown) {
            return acquireFailure('unknown', preBlockers.unknown.reason);
        }
        if (preBlockers.otherActive) {
            return acquireFailure('active', 'writer_active');
        }
        if (preBlockers.ownActive) {
            return acquireSuccess(
                'already_owned',
                backendInstanceId,
                reclaimedCount > 0 ? 'stale_records_reclaimed' : null
            );
        }

        let createdAt;
        try {
            createdAt = createTimestamp(now);
        } catch (_error) {
            return acquireFailure('failed', 'invalid_clock');
        }

        const record = {
            schema: SCHEMA,
            project: PROJECT,
            backendInstanceId,
            pid: processId,
            processStartFingerprint: currentProbe.startFingerprint,
            createdAt,
            repositoryIdentity: context.repositoryIdentity,
            storageIdentity: context.storageIdentity
        };
        const payload = `${JSON.stringify(record, null, 2)}\n`;

        try {
            await fsp.writeFile(ownRecordPath, payload, {
                encoding: 'utf8',
                flag: 'wx',
                mode: 0o600
            });
        } catch (error) {
            if (error?.code === 'EEXIST') {
                const existingScan = await scan(context);
                if (!existingScan.ok) {
                    return acquireFailure('failed', existingScan.reason);
                }
                const existingBlockers = blockers(existingScan.records);
                if (existingBlockers.unknown) {
                    return acquireFailure(
                        'unknown',
                        existingBlockers.unknown.reason
                    );
                }
                if (existingBlockers.otherActive) {
                    return acquireFailure('contended', 'writer_contended');
                }
                if (existingBlockers.ownActive) {
                    return acquireSuccess(
                        'already_owned',
                        backendInstanceId,
                        reclaimedCount > 0
                            ? 'stale_records_reclaimed'
                            : null
                    );
                }
                return acquireFailure('contended', 'writer_contended');
            }
            await removeOwnAfterWriteFailure();
            return acquireFailure('failed', 'record_create_failed');
        }

        let postCreateScan = await scan(context);
        if (!postCreateScan.ok) {
            await removeOwnVerified(record);
            return acquireFailure('failed', postCreateScan.reason);
        }

        const postReclaim = await reclaimStale(
            postCreateScan.records.filter(item =>
                item.record?.backendInstanceId !== backendInstanceId
            )
        );
        if (!postReclaim.ok) {
            await removeOwnVerified(record);
            return acquireFailure('failed', postReclaim.reason);
        }
        reclaimedCount += postReclaim.reclaimed;

        postCreateScan = await scan(context);
        if (!postCreateScan.ok) {
            await removeOwnVerified(record);
            return acquireFailure('failed', postCreateScan.reason);
        }

        const postBlockers = blockers(postCreateScan.records);
        const ownActiveCount = postCreateScan.records.filter(item =>
            item.state === 'active' &&
            item.record?.backendInstanceId === backendInstanceId
        ).length;

        if (postBlockers.unknown) {
            await removeOwnVerified(record);
            return acquireFailure('unknown', postBlockers.unknown.reason);
        }
        if (postBlockers.otherActive || ownActiveCount !== 1) {
            await removeOwnVerified(record);
            return acquireFailure('contended', 'writer_contended');
        }

        return acquireSuccess(
            reclaimedCount > 0 ? 'reclaimed' : 'acquired',
            backendInstanceId,
            reclaimedCount > 0 ? 'stale_records_reclaimed' : null
        );
    }

    async function releaseInternal() {
        let raw;
        try {
            raw = await fsp.readFile(ownRecordPath, 'utf8');
        } catch (error) {
            if (error?.code === 'ENOENT') {
                return releaseSuccess('absent');
            }
            return releaseFailure('failed', 'record_read_failed');
        }

        let record;
        try {
            record = JSON.parse(raw);
        } catch (_error) {
            return releaseFailure('unknown', 'malformed_own_record');
        }

        const validation = validateRecord(
            record,
            `${backendInstanceId}.json`
        );
        if (!validation.ok) {
            return releaseFailure('unknown', validation.reason);
        }

        if (record.backendInstanceId !== backendInstanceId ||
            record.pid !== processId) {
            return releaseFailure('not_owner', 'owner_identity_mismatch');
        }

        const currentProbe = await safeProbe(processId);
        if (currentProbe.state !== 'alive') {
            return releaseFailure(
                'unknown',
                'current_process_unverifiable'
            );
        }
        if (record.processStartFingerprint !==
            currentProbe.startFingerprint) {
            return releaseFailure('not_owner', 'owner_identity_mismatch');
        }

        let context;
        try {
            context = await getContext({
                allowMissingStorage: false
            });
        } catch (_error) {
            return releaseFailure('unknown', 'authority_identity_unavailable');
        }

        if (record.repositoryIdentity !== context.repositoryIdentity ||
            record.storageIdentity !== context.storageIdentity) {
            return releaseFailure('not_owner', 'owner_identity_mismatch');
        }

        try {
            const secondRead = await fsp.readFile(ownRecordPath, 'utf8');
            if (secondRead !== raw) {
                return releaseFailure('not_owner', 'owner_record_changed');
            }
            await fsp.unlink(ownRecordPath);
            return releaseSuccess('released');
        } catch (error) {
            if (error?.code === 'ENOENT') {
                return releaseSuccess('absent');
            }
            return releaseFailure('failed', 'record_release_failed');
        }
    }

    return Object.freeze({
        backendInstanceId,
        acquire() {
            if (!acquirePromise) {
                acquirePromise = acquireInternal()
                    .finally(() => {
                        acquirePromise = null;
                    });
            }
            return acquirePromise;
        },
        release() {
            if (!releasePromise) {
                releasePromise = releaseInternal()
                    .finally(() => {
                        releasePromise = null;
                    });
            }
            return releasePromise;
        }
    });
}
