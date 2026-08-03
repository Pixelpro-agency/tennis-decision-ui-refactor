import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { safeArtifactPath } from './paths.mjs';

function gitValue(repoRoot, args) {
  const result = spawnSync('git', args, {
    cwd: repoRoot,
    encoding: 'utf8',
    windowsHide: true,
    timeout: 5000,
  });
  if (result.status !== 0) return null;
  return result.stdout.trim();
}

export function repositoryState(repoRoot) {
  const sha = gitValue(repoRoot, ['rev-parse', 'HEAD']) || 'unknown';
  const statusText = gitValue(repoRoot, ['status', '--short']);
  let workingTreeStatus = 'unavailable';
  let changedPathCount = null;
  if (statusText !== null) {
    const lines = statusText === '' ? [] : statusText.split(/\r?\n/).filter(Boolean);
    workingTreeStatus = lines.length === 0 ? 'clean' : 'dirty';
    changedPathCount = lines.length;
  }
  return { sha, workingTreeStatus, changedPathCount };
}

export function buildRunResult({
  profile,
  startedAt,
  completedAt,
  entries,
  repoState,
  artifactPath = null,
  manifestPath,
  maxOutputBytes,
  warnings = [],
  limits = [],
}) {
  const passed = entries.filter((entry) => entry.status === 'passed').length;
  const failed = entries.filter((entry) => entry.status === 'failed').length;
  const timedOut = entries.filter((entry) => entry.status === 'timeout').length;
  const durationMs = Math.max(0, new Date(completedAt).getTime() - new Date(startedAt).getTime());

  return {
    schemaVersion: '1.0.0',
    repositorySha: repoState.sha,
    profile,
    startedAt,
    completedAt,
    durationMs,
    environment: {
      platform: process.platform,
      architecture: process.arch,
      nodeVersion: process.version,
    },
    manifestPath,
    artifactPath,
    counts: {
      total: entries.length,
      passed,
      failed,
      timedOut,
      skipped: 0,
    },
    status: failed === 0 && timedOut === 0 ? 'passed' : 'failed',
    warnings,
    limits: [
      `stdout/stderr capped at ${maxOutputBytes} bytes per stream and command`,
      ...limits,
    ],
    workingTreeStatus: repoState.workingTreeStatus,
    changedPathCount: repoState.changedPathCount,
    perTestResults: entries,
  };
}

function atomicWriteJson(targetPath, value) {
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  const temporaryPath = `${targetPath}.tmp-${process.pid}-${Date.now()}`;
  fs.writeFileSync(temporaryPath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  fs.renameSync(temporaryPath, targetPath);
}

export function defaultArtifactRelativePath({ profile, repositorySha, startedAt }) {
  const timestamp = startedAt.replace(/[:.]/g, '-');
  const shortSha = repositorySha === 'unknown' ? 'unknown' : repositorySha.slice(0, 12);
  return path.posix.join('test-results', `${timestamp}-${shortSha}-${profile}.json`);
}

export function writeResultArtifact(repoRoot, relativePath, result) {
  const targetPath = safeArtifactPath(repoRoot, relativePath);
  atomicWriteJson(targetPath, result);
  return targetPath;
}
