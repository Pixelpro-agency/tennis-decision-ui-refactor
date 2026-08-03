import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { main } from './run.mjs';
import { loadManifest, validateManifest } from './support/manifest.mjs';
import { prepareSpawnInvocation } from './support/process-runner.mjs';

let passed = 0;
let failed = 0;

async function test(name, callback) {
  try {
    await callback();
    passed += 1;
    console.log(`PASS ${name}`);
  } catch (error) {
    failed += 1;
    console.error(`FAIL ${name}`);
    console.error(error?.stack || error);
  }
}

function makeTempRepo() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'tdui-validation-'));
}

function cleanup(root) {
  fs.rmSync(root, { recursive: true, force: true });
}

function write(root, relativePath, content) {
  const target = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content, 'utf8');
  return target;
}

function baseProfiles() {
  return {
    fast: { enabled: true, status: 'implemented', description: 'fast' },
    backend: { enabled: true, status: 'implemented', description: 'backend' },
    frontend: { enabled: true, status: 'implemented', description: 'frontend' },
    python: { enabled: true, status: 'implemented', description: 'python' },
    'full-offline': { enabled: true, status: 'implemented', description: 'full' },
    persistence: { enabled: false, status: 'planned', description: 'persistence', reason: 'not implemented' },
    benchmark: { enabled: false, status: 'planned', description: 'benchmark', reason: 'not implemented' },
    live: { enabled: false, status: 'planned', description: 'live', reason: 'not implemented', liveRequired: true },
  };
}

function entry(overrides = {}) {
  return {
    id: 'sample-test',
    label: 'Sample test',
    area: 'validation',
    owner: 'sample',
    requirementIds: [],
    command: ['${NODE}', 'sample.mjs'],
    cwd: '.',
    type: 'node-test',
    profiles: ['fast'],
    timeoutSec: 5,
    serialGroup: null,
    fixtures: [],
    mutatesFilesystem: false,
    liveRequired: false,
    enabled: true,
    pathChecks: ['sample.mjs'],
    requires: [],
    ...overrides,
  };
}

function manifest(entries, profiles = baseProfiles()) {
  return { schemaVersion: '1.0.0', profiles, entries };
}

function writeManifest(root, value) {
  write(root, 'manifest.json', `${JSON.stringify(value, null, 2)}\n`);
}

async function withQuietConsole(callback) {
  const originalLog = console.log;
  const originalError = console.error;
  const lines = [];
  console.log = (...args) => lines.push(args.join(' '));
  console.error = (...args) => lines.push(args.join(' '));
  try {
    const value = await callback();
    return { value, lines };
  } finally {
    console.log = originalLog;
    console.error = originalError;
  }
}


await test('Windows command wrappers are launched through ComSpec without shell mode', () => {
  const invocation = prepareSpawnInvocation(
    ['npm.cmd', '--prefix', 'frontend', 'run', 'build'],
    { platform: 'win32', comSpec: 'C:\\Windows\\System32\\cmd.exe' },
  );
  assert.deepEqual(invocation, {
    command: 'C:\\Windows\\System32\\cmd.exe',
    args: ['/d', '/s', '/c', 'npm.cmd', '--prefix', 'frontend', 'run', 'build'],
  });
});

await test('non-Windows executables remain direct child processes', () => {
  const invocation = prepareSpawnInvocation(
    ['npm', '--prefix', 'frontend', 'run', 'build'],
    { platform: 'linux', comSpec: 'ignored' },
  );
  assert.deepEqual(invocation, {
    command: 'npm',
    args: ['--prefix', 'frontend', 'run', 'build'],
  });
});

await test('default manifest is structurally valid before filesystem preflight', () => {
  const manifestPath = new URL('./test-manifest.json', import.meta.url);
  const value = loadManifest(manifestPath);
  const summary = validateManifest(value);
  assert.ok(summary.profileNames.includes('fast'));
  assert.ok(summary.entryIds.includes('validation-runner-self-test'));
});

await test('TEST-064 Python unittest discovery is explicit in the default manifest', () => {
  const manifestPath = new URL('./test-manifest.json', import.meta.url);
  const value = loadManifest(manifestPath);
  const commands = value.entries
    .filter((item) => item.type === 'python-unittest' && item.enabled)
    .map((item) => item.command.join(' '));
  for (const moduleName of [
    'launcher.tests.test_launcher',
    'scrapers.betfair.graph_url_test',
    'scrapers.betfair.diagnostic_redaction_test',
    'scrapers.betfair.cdp_url_test',
  ]) {
    assert.ok(commands.some((command) => command.includes(moduleName)), `missing Python module ${moduleName}`);
  }
  assert.ok(value.entries.some((item) => item.id === 'python-compileall' && item.enabled));
});

await test('TEST-060 rejects duplicate entry IDs', () => {
  const root = makeTempRepo();
  try {
    write(root, 'sample.mjs', 'process.exitCode = 0;\n');
    assert.throws(
      () => validateManifest(manifest([entry(), entry({ label: 'Second' })]), { repoRoot: root }),
      /duplicate entry id/,
    );
  } finally {
    cleanup(root);
  }
});

await test('TEST-060 rejects duplicate commands', () => {
  const root = makeTempRepo();
  try {
    write(root, 'sample.mjs', 'process.exitCode = 0;\n');
    assert.throws(
      () => validateManifest(manifest([entry(), entry({ id: 'second-test' })]), { repoRoot: root }),
      /duplicate command entry/,
    );
  } finally {
    cleanup(root);
  }
});

await test('TEST-061 missing path fails before child execution', async () => {
  const root = makeTempRepo();
  try {
    const marker = path.join(root, 'marker.txt');
    write(root, 'would-run.mjs', `import fs from 'node:fs'; fs.writeFileSync(${JSON.stringify(marker)}, 'ran');\n`);
    writeManifest(root, manifest([
      entry({ command: ['${NODE}', 'would-run.mjs'], pathChecks: ['missing.mjs'] }),
    ]));
    const { value: exitCode } = await withQuietConsole(() => main([
      'fast', '--repo-root', root, '--manifest', 'manifest.json', '--no-write',
    ]));
    assert.equal(exitCode, 2);
    assert.equal(fs.existsSync(marker), false);
  } finally {
    cleanup(root);
  }
});

await test('TEST-061 rejects cwd escaping repository root', () => {
  const root = makeTempRepo();
  try {
    write(root, 'sample.mjs', 'process.exitCode = 0;\n');
    assert.throws(
      () => validateManifest(manifest([entry({ cwd: '..' })]), { repoRoot: root }),
      /escapes repository root/,
    );
  } finally {
    cleanup(root);
  }
});

await test('allow-list rejects shell commands', () => {
  const root = makeTempRepo();
  try {
    write(root, 'sample.mjs', 'process.exitCode = 0;\n');
    assert.throws(
      () => validateManifest(manifest([entry({ command: ['bash', '-lc', 'echo unsafe'] })]), { repoRoot: root }),
      /not allow-listed/,
    );
  } finally {
    cleanup(root);
  }
});

await test('TEST-062 each entry runs in a separate child process', async () => {
  const root = makeTempRepo();
  try {
    write(root, 'pid-a.mjs', "console.log(`PID:${process.pid}`);\n");
    write(root, 'pid-b.mjs', "console.log(`PID:${process.pid}`);\n");
    writeManifest(root, manifest([
      entry({ id: 'pid-a', label: 'PID A', command: ['${NODE}', 'pid-a.mjs'], pathChecks: ['pid-a.mjs'] }),
      entry({ id: 'pid-b', label: 'PID B', command: ['${NODE}', 'pid-b.mjs'], pathChecks: ['pid-b.mjs'] }),
    ]));
    const { value: exitCode } = await withQuietConsole(() => main([
      'fast', '--repo-root', root, '--manifest', 'manifest.json', '--output', 'test-results/result.json',
    ]));
    assert.equal(exitCode, 0);
    const result = JSON.parse(fs.readFileSync(path.join(root, 'test-results/result.json'), 'utf8'));
    assert.equal(result.perTestResults.length, 2);
    const pids = result.perTestResults.map((item) => item.stdout.match(/PID:(\d+)/)?.[1]);
    assert.ok(pids.every(Boolean));
    assert.notEqual(pids[0], pids[1]);
  } finally {
    cleanup(root);
  }
});

await test('TEST-062 normalizes a non-zero child exit code', async () => {
  const root = makeTempRepo();
  try {
    write(root, 'fail.mjs', "console.error('expected failure'); process.exitCode = 7;\n");
    writeManifest(root, manifest([
      entry({ command: ['${NODE}', 'fail.mjs'], pathChecks: ['fail.mjs'] }),
    ]));
    const { value: exitCode } = await withQuietConsole(() => main([
      'fast', '--repo-root', root, '--manifest', 'manifest.json', '--output', 'test-results/result.json',
    ]));
    assert.equal(exitCode, 1);
    const result = JSON.parse(fs.readFileSync(path.join(root, 'test-results/result.json'), 'utf8'));
    assert.equal(result.perTestResults[0].status, 'failed');
    assert.equal(result.perTestResults[0].exitCode, 7);
  } finally {
    cleanup(root);
  }
});

await test('TEST-063 timeout terminates the child and reports timeout', async () => {
  const root = makeTempRepo();
  try {
    write(root, 'slow.mjs', "console.log('started'); setTimeout(() => {}, 10000);\n");
    writeManifest(root, manifest([
      entry({ command: ['${NODE}', 'slow.mjs'], pathChecks: ['slow.mjs'], timeoutSec: 1 }),
    ]));
    const started = Date.now();
    const { value: exitCode } = await withQuietConsole(() => main([
      'fast', '--repo-root', root, '--manifest', 'manifest.json', '--output', 'test-results/result.json',
    ]));
    const elapsed = Date.now() - started;
    assert.equal(exitCode, 1);
    assert.ok(elapsed < 5000, `timeout was not bounded: ${elapsed} ms`);
    const result = JSON.parse(fs.readFileSync(path.join(root, 'test-results/result.json'), 'utf8'));
    assert.equal(result.perTestResults[0].status, 'timeout');
    assert.equal(result.perTestResults[0].timedOut, true);
  } finally {
    cleanup(root);
  }
});

await test('bounded output is truncated and sensitive markers are redacted', async () => {
  const root = makeTempRepo();
  try {
    const script = [
      `console.log(${JSON.stringify(root)});`,
      "console.log('https://example.invalid/private?token=abc');",
      "console.log('Authorization: Bearer secret-value');",
      "console.log('X'.repeat(5000));",
    ].join('\n');
    write(root, 'output.mjs', `${script}\n`);
    writeManifest(root, manifest([
      entry({ command: ['${NODE}', 'output.mjs'], pathChecks: ['output.mjs'] }),
    ]));
    const { value: exitCode } = await withQuietConsole(() => main([
      'fast', '--repo-root', root, '--manifest', 'manifest.json', '--output', 'test-results/result.json', '--max-output-bytes', '1024',
    ]));
    assert.equal(exitCode, 0);
    const result = JSON.parse(fs.readFileSync(path.join(root, 'test-results/result.json'), 'utf8'));
    const output = result.perTestResults[0].stdout;
    assert.equal(output.includes(root), false);
    assert.equal(output.includes('example.invalid'), false);
    assert.equal(output.includes('secret-value'), false);
    assert.equal(result.perTestResults[0].stdoutTruncated, true);
    assert.ok(Buffer.byteLength(output, 'utf8') <= 1024);
  } finally {
    cleanup(root);
  }
});

await test('TEST-068 rejects duplicate requirement ownership', () => {
  const root = makeTempRepo();
  try {
    write(root, 'a.mjs', 'process.exitCode = 0;\n');
    write(root, 'b.mjs', 'process.exitCode = 0;\n');
    assert.throws(
      () => validateManifest(manifest([
        entry({ id: 'a', command: ['${NODE}', 'a.mjs'], pathChecks: ['a.mjs'], requirementIds: ['TEST-068'] }),
        entry({ id: 'b', command: ['${NODE}', 'b.mjs'], pathChecks: ['b.mjs'], requirementIds: ['TEST-068'] }),
      ]), { repoRoot: root }),
      /assigned to both/,
    );
  } finally {
    cleanup(root);
  }
});

await test('TEST-068 rejects malformed requirement IDs', () => {
  const root = makeTempRepo();
  try {
    write(root, 'sample.mjs', 'process.exitCode = 0;\n');
    assert.throws(
      () => validateManifest(manifest([entry({ requirementIds: ['TEST-68'] })]), { repoRoot: root }),
      /invalid requirement ID/,
    );
  } finally {
    cleanup(root);
  }
});

await test('TEST-073 fast rejects browser, network, credentials or tracking capabilities', () => {
  const root = makeTempRepo();
  try {
    write(root, 'sample.mjs', 'process.exitCode = 0;\n');
    assert.throws(
      () => validateManifest(manifest([entry({ requires: ['external-network'] })]), {
        repoRoot: root,
        selectedProfile: 'fast',
      }),
      /forbidden in fast profile/,
    );
  } finally {
    cleanup(root);
  }
});

await test('planned profiles are blocked instead of reported as skipped or passed', async () => {
  const root = makeTempRepo();
  try {
    write(root, 'sample.mjs', 'process.exitCode = 0;\n');
    writeManifest(root, manifest([entry()]));
    const { value: exitCode, lines } = await withQuietConsole(() => main([
      'persistence', '--repo-root', root, '--manifest', 'manifest.json', '--no-write',
    ]));
    assert.equal(exitCode, 2);
    assert.ok(lines.some((line) => line.includes('planned')));
    assert.equal(fs.existsSync(path.join(root, 'test-results')), false);
  } finally {
    cleanup(root);
  }
});

await test('invalid result output path is rejected before execution', async () => {
  const root = makeTempRepo();
  try {
    const marker = path.join(root, 'marker.txt');
    write(root, 'would-run.mjs', `import fs from 'node:fs'; fs.writeFileSync(${JSON.stringify(marker)}, 'ran');\n`);
    writeManifest(root, manifest([
      entry({ command: ['${NODE}', 'would-run.mjs'], pathChecks: ['would-run.mjs'] }),
    ]));
    const { value: exitCode } = await withQuietConsole(() => main([
      'fast', '--repo-root', root, '--manifest', 'manifest.json', '--output', '../outside.json',
    ]));
    assert.equal(exitCode, 2);
    assert.equal(fs.existsSync(marker), false);
  } finally {
    cleanup(root);
  }
});

await test('result artifact contains normalized counts and context', async () => {
  const root = makeTempRepo();
  try {
    write(root, 'pass.mjs', "console.log('ok');\n");
    writeManifest(root, manifest([
      entry({ command: ['${NODE}', 'pass.mjs'], pathChecks: ['pass.mjs'] }),
    ]));
    const { value: exitCode } = await withQuietConsole(() => main([
      'fast', '--repo-root', root, '--manifest', 'manifest.json', '--output', 'test-results/result.json',
    ]));
    assert.equal(exitCode, 0);
    const result = JSON.parse(fs.readFileSync(path.join(root, 'test-results/result.json'), 'utf8'));
    assert.equal(result.schemaVersion, '1.0.0');
    assert.equal(result.profile, 'fast');
    assert.equal(result.counts.total, 1);
    assert.equal(result.counts.passed, 1);
    assert.equal(result.counts.failed, 0);
    assert.equal(result.status, 'passed');
    assert.ok(['clean', 'dirty', 'unavailable'].includes(result.workingTreeStatus));
    assert.equal(result.perTestResults[0].id, 'sample-test');
  } finally {
    cleanup(root);
  }
});

console.log(`\nvalidation runner tests: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exitCode = 1;
