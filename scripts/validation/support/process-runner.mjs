import { spawn, spawnSync } from 'node:child_process';
import { redactText, truncateUtf8 } from './redaction.mjs';

export function prepareSpawnInvocation(commandResolved, {
  platform = process.platform,
  comSpec = process.env.ComSpec || 'cmd.exe',
} = {}) {
  if (!Array.isArray(commandResolved) || commandResolved.length === 0) {
    throw new Error('resolved command must be a non-empty array');
  }

  const [command, ...args] = commandResolved;
  if (platform === 'win32' && /\.(?:cmd|bat)$/i.test(command)) {
    return {
      command: comSpec,
      args: ['/d', '/s', '/c', command, ...args],
    };
  }

  return { command, args };
}

function terminateProcess(child) {
  if (!child || child.killed || child.exitCode !== null) return;
  try {
    child.kill('SIGTERM');
  } catch {
    // Best effort; escalation below remains bounded.
  }
}

function forceTerminateProcess(child) {
  if (!child || child.exitCode !== null) return;
  if (process.platform === 'win32' && child.pid) {
    spawnSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], {
      windowsHide: true,
      stdio: 'ignore',
    });
    return;
  }
  try {
    child.kill('SIGKILL');
  } catch {
    // The process may have exited between checks.
  }
}

export async function runEntry(entry, {
  repoRoot,
  maxOutputBytes = 65536,
  environment = {},
  terminationGraceMs = 750,
} = {}) {
  const startedAt = new Date();
  const startedMonotonic = performance.now();
  let stdout = '';
  let stderr = '';
  let stdoutBytes = 0;
  let stderrBytes = 0;
  let stdoutCaptureTruncated = false;
  let stderrCaptureTruncated = false;
  let timedOut = false;
  let spawnError = null;

  const invocation = prepareSpawnInvocation(entry.commandResolved);
  const child = spawn(invocation.command, invocation.args, {
    cwd: entry.cwdResolved,
    env: {
      ...process.env,
      CI: process.env.CI || '1',
      NO_COLOR: '1',
      TDUI_VALIDATION_RUNNER: '1',
      TDUI_VALIDATION_PROFILE: environment.profile || '',
      ...environment,
    },
    shell: false,
    windowsHide: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  child.stdout?.on('data', (chunk) => {
    stdoutBytes += chunk.length;
    const currentBytes = Buffer.byteLength(stdout, 'utf8');
    if (currentBytes < maxOutputBytes) {
      const remaining = maxOutputBytes - currentBytes;
      stdout += chunk.subarray(0, remaining).toString('utf8');
    }
    if (stdoutBytes > maxOutputBytes) stdoutCaptureTruncated = true;
  });
  child.stderr?.on('data', (chunk) => {
    stderrBytes += chunk.length;
    const currentBytes = Buffer.byteLength(stderr, 'utf8');
    if (currentBytes < maxOutputBytes) {
      const remaining = maxOutputBytes - currentBytes;
      stderr += chunk.subarray(0, remaining).toString('utf8');
    }
    if (stderrBytes > maxOutputBytes) stderrCaptureTruncated = true;
  });
  child.on('error', (error) => {
    spawnError = error;
  });

  const completion = new Promise((resolve) => {
    child.on('close', (exitCode, signal) => resolve({ exitCode, signal }));
  });

  const timeoutHandle = setTimeout(() => {
    timedOut = true;
    terminateProcess(child);
    setTimeout(() => forceTerminateProcess(child), terminationGraceMs).unref();
  }, entry.timeoutSec * 1000);
  timeoutHandle.unref();

  const { exitCode, signal } = await completion;
  clearTimeout(timeoutHandle);

  const completedAt = new Date();
  const durationMs = Math.max(0, Math.round(performance.now() - startedMonotonic));
  const redactedStdout = truncateUtf8(redactText(stdout, { repoRoot }), maxOutputBytes);
  const redactedStderr = truncateUtf8(redactText(stderr, { repoRoot }), maxOutputBytes);
  if (stdoutCaptureTruncated && !redactedStdout.truncated) {
    redactedStdout.text = truncateUtf8(`${redactedStdout.text}\n<output truncated>\n`, maxOutputBytes).text;
    redactedStdout.truncated = true;
  }
  if (stderrCaptureTruncated && !redactedStderr.truncated) {
    redactedStderr.text = truncateUtf8(`${redactedStderr.text}\n<output truncated>\n`, maxOutputBytes).text;
    redactedStderr.truncated = true;
  }
  redactedStdout.originalBytes = stdoutBytes;
  redactedStderr.originalBytes = stderrBytes;

  let status = 'failed';
  if (timedOut) status = 'timeout';
  else if (!spawnError && exitCode === 0) status = 'passed';

  return {
    id: entry.id,
    label: entry.label,
    area: entry.area,
    owner: entry.owner,
    requirementIds: entry.requirementIds,
    type: entry.type,
    serialGroup: entry.serialGroup,
    mutatesFilesystem: entry.mutatesFilesystem,
    liveRequired: entry.liveRequired,
    command: entry.command,
    cwd: entry.cwd,
    status,
    exitCode,
    signal,
    timedOut,
    spawnError: spawnError ? redactText(spawnError.message, { repoRoot }) : null,
    startedAt: startedAt.toISOString(),
    completedAt: completedAt.toISOString(),
    durationMs,
    stdout: redactedStdout.text,
    stderr: redactedStderr.text,
    stdoutTruncated: redactedStdout.truncated,
    stderrTruncated: redactedStderr.truncated,
    stdoutOriginalBytes: redactedStdout.originalBytes,
    stderrOriginalBytes: redactedStderr.originalBytes,
  };
}
