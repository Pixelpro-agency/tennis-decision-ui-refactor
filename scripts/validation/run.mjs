#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  defaultManifestPath,
  loadManifest,
  resolveEntry,
  selectEntries,
  validateManifest,
} from './support/manifest.mjs';
import { resolveWithin, safeArtifactPath } from './support/paths.mjs';
import { runEntry } from './support/process-runner.mjs';
import {
  buildRunResult,
  defaultArtifactRelativePath,
  repositoryState,
  writeResultArtifact,
} from './support/result.mjs';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const defaultRepoRoot = path.resolve(scriptDirectory, '..', '..');

function usage() {
  return `Usage:
  node scripts/validation/run.mjs <profile> [options]
  node scripts/validation/run.mjs --list [options]

Options:
  --manifest <path>       Repository-relative manifest path
  --repo-root <path>      Repository root (primarily for isolated tests)
  --output <path>         Artifact path under test-results/
  --no-write              Do not write a result artifact
  --json                  Print the complete result JSON to stdout
  --allow-live            Required before any live profile may run
  --max-output-bytes <n>  Per-stream cap, 1024..1048576 (default 65536)
  --list                  List profiles and entries without executing
  --help                  Show this help
`;
}

function parseArgs(argv) {
  const result = {
    profile: null,
    manifest: null,
    repoRoot: defaultRepoRoot,
    output: null,
    write: true,
    json: false,
    allowLive: false,
    list: false,
    maxOutputBytes: 65536,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === '--help') return { ...result, help: true };
    if (token === '--list') { result.list = true; continue; }
    if (token === '--no-write') { result.write = false; continue; }
    if (token === '--json') { result.json = true; continue; }
    if (token === '--allow-live') { result.allowLive = true; continue; }
    if (token === '--manifest' || token === '--repo-root' || token === '--output' || token === '--max-output-bytes') {
      const value = argv[index + 1];
      if (!value) throw new Error(`${token} requires a value`);
      index += 1;
      if (token === '--manifest') result.manifest = value;
      if (token === '--repo-root') result.repoRoot = path.resolve(value);
      if (token === '--output') result.output = value;
      if (token === '--max-output-bytes') {
        const parsed = Number(value);
        if (!Number.isInteger(parsed) || parsed < 1024 || parsed > 1048576) {
          throw new Error('--max-output-bytes must be an integer between 1024 and 1048576');
        }
        result.maxOutputBytes = parsed;
      }
      continue;
    }
    if (token.startsWith('--')) throw new Error(`unknown option: ${token}`);
    if (result.profile !== null) throw new Error(`unexpected argument: ${token}`);
    result.profile = token;
  }

  return result;
}

function printList(manifest) {
  console.log('Profiles:');
  for (const [name, profile] of Object.entries(manifest.profiles)) {
    const suffix = profile.enabled ? profile.status : `${profile.status}: ${profile.reason}`;
    console.log(`- ${name}: ${suffix}`);
  }
  console.log('\nEntries:');
  for (const entry of manifest.entries) {
    const state = entry.enabled ? 'enabled' : `disabled: ${entry.disabledReason}`;
    console.log(`- ${entry.id} [${entry.profiles.join(', ')}] ${state}`);
  }
}

export async function main(argv = process.argv.slice(2)) {
  let args;
  try {
    args = parseArgs(argv);
  } catch (error) {
    console.error(`validation runner usage error: ${error.message}`);
    console.error(usage());
    return 2;
  }

  if (args.help) {
    console.log(usage());
    return 0;
  }

  try {
    if (!fs.existsSync(args.repoRoot) || !fs.statSync(args.repoRoot).isDirectory()) {
      throw new Error(`repository root does not exist: ${args.repoRoot}`);
    }
    const manifestPath = args.manifest
      ? resolveWithin(args.repoRoot, args.manifest, { mustExist: true, label: 'manifest' })
      : defaultManifestPath(scriptDirectory);
    const manifest = loadManifest(manifestPath);

    if (args.list) {
      validateManifest(manifest, { repoRoot: args.repoRoot });
      printList(manifest);
      return 0;
    }
    if (!args.profile) {
      throw new Error('a profile is required');
    }

    validateManifest(manifest, { repoRoot: args.repoRoot, selectedProfile: args.profile });
    const profileDefinition = manifest.profiles[args.profile];
    if (!profileDefinition.enabled) {
      throw new Error(`profile ${args.profile} is ${profileDefinition.status}: ${profileDefinition.reason}`);
    }
    if ((args.profile === 'live' || profileDefinition.liveRequired) && !args.allowLive) {
      throw new Error('live execution requires --allow-live');
    }

    const selected = selectEntries(manifest, args.profile);
    if (selected.length === 0) {
      throw new Error(`profile ${args.profile} has no enabled entries`);
    }
    if (args.write && args.output) {
      safeArtifactPath(args.repoRoot, args.output);
    }

    const resolvedEntries = selected.map((entry) => resolveEntry(entry, args.repoRoot));
    const startedAt = new Date().toISOString();
    const repoState = repositoryState(args.repoRoot);
    const results = [];

    console.log(`validation profile: ${args.profile}`);
    console.log(`entries: ${resolvedEntries.length}`);
    for (let index = 0; index < resolvedEntries.length; index += 1) {
      const entry = resolvedEntries[index];
      console.log(`[${index + 1}/${resolvedEntries.length}] ${entry.id} — ${entry.label}`);
      const result = await runEntry(entry, {
        repoRoot: args.repoRoot,
        maxOutputBytes: args.maxOutputBytes,
        environment: { profile: args.profile },
      });
      results.push(result);
      console.log(`  ${result.status} (${result.durationMs} ms)`);
    }

    const completedAt = new Date().toISOString();
    let relativeArtifactPath = null;
    if (args.write) {
      relativeArtifactPath = args.output || defaultArtifactRelativePath({
        profile: args.profile,
        repositorySha: repoState.sha,
        startedAt,
      });
    }

    let runResult = buildRunResult({
      profile: args.profile,
      startedAt,
      completedAt,
      entries: results,
      repoState,
      artifactPath: relativeArtifactPath,
      manifestPath: path.relative(args.repoRoot, manifestPath).replaceAll(path.sep, '/'),
      maxOutputBytes: args.maxOutputBytes,
      limits: [
        'entries execute serially in version 1',
        'live, persistence and benchmark profiles are not enabled by this implementation',
      ],
    });

    if (args.write) {
      const artifactPath = writeResultArtifact(args.repoRoot, relativeArtifactPath, runResult);
      runResult = { ...runResult, artifactPath: path.relative(args.repoRoot, artifactPath).replaceAll(path.sep, '/') };
      // Rewrite once so the serialized artifact contains its own final relative path.
      writeResultArtifact(args.repoRoot, relativeArtifactPath, runResult);
      console.log(`artifact: ${runResult.artifactPath}`);
    }

    console.log(`summary: ${runResult.counts.passed} passed, ${runResult.counts.failed} failed, ${runResult.counts.timedOut} timed out`);
    if (args.json) console.log(JSON.stringify(runResult, null, 2));
    return runResult.status === 'passed' ? 0 : 1;
  } catch (error) {
    console.error(`validation runner configuration error: ${error.message}`);
    return 2;
  }
}

if (import.meta.url === `file://${process.argv[1]}` || fileURLToPath(import.meta.url) === path.resolve(process.argv[1] || '')) {
  process.exitCode = await main();
}
