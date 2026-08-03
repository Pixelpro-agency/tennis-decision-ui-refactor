import fs from 'node:fs';
import path from 'node:path';
import { resolveWithin } from './paths.mjs';

const ENTRY_FIELDS = [
  'id',
  'label',
  'area',
  'owner',
  'requirementIds',
  'command',
  'cwd',
  'type',
  'profiles',
  'timeoutSec',
  'serialGroup',
  'fixtures',
  'mutatesFilesystem',
  'liveRequired',
  'enabled',
];

const VALID_TYPES = new Set([
  'node-test',
  'python-unittest',
  'compile-check',
  'build',
  'documentation-check',
  'runner-self-test',
]);

const ALLOWED_COMMANDS = new Set([
  '${NODE}',
  '${PYTHON}',
  '${NPM}',
  'node',
  'python',
  'python3',
  'py',
  'npm',
  'npm.cmd',
]);

const FORBIDDEN_FAST_REQUIREMENTS = new Set([
  'browser',
  'credentials',
  'external-network',
  'tracking',
]);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim() !== '';
}

export function expandCommand(command, platform = process.platform) {
  const replacements = {
    '${NODE}': process.execPath,
    '${PYTHON}': process.env.VALIDATION_PYTHON || (platform === 'win32' ? 'python' : 'python3'),
    '${NPM}': platform === 'win32' ? 'npm.cmd' : 'npm',
  };
  return command.map((token) => replacements[token] ?? token);
}

export function loadManifest(manifestPath) {
  let parsed;
  try {
    parsed = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  } catch (error) {
    throw new Error(`cannot read manifest: ${error.message}`);
  }
  return parsed;
}

export function validateManifest(manifest, { repoRoot, selectedProfile = null } = {}) {
  assert(manifest && typeof manifest === 'object' && !Array.isArray(manifest), 'manifest must be an object');
  assert(isNonEmptyString(manifest.schemaVersion), 'manifest.schemaVersion is required');
  assert(manifest.profiles && typeof manifest.profiles === 'object' && !Array.isArray(manifest.profiles), 'manifest.profiles must be an object');
  assert(Array.isArray(manifest.entries), 'manifest.entries must be an array');

  const profileNames = new Set(Object.keys(manifest.profiles));
  assert(profileNames.size > 0, 'at least one profile is required');
  for (const [profileName, profile] of Object.entries(manifest.profiles)) {
    assert(isNonEmptyString(profileName), 'profile name cannot be empty');
    assert(profile && typeof profile === 'object' && !Array.isArray(profile), `profile ${profileName} must be an object`);
    assert(typeof profile.enabled === 'boolean', `profile ${profileName}.enabled must be boolean`);
    assert(isNonEmptyString(profile.status), `profile ${profileName}.status is required`);
    if (!profile.enabled) {
      assert(isNonEmptyString(profile.reason), `disabled profile ${profileName} requires a reason`);
    }
  }

  if (selectedProfile !== null) {
    assert(profileNames.has(selectedProfile), `unknown profile: ${selectedProfile}`);
  }

  const ids = new Set();
  const commands = new Set();
  const requirementOwners = new Map();
  const errors = [];

  for (let index = 0; index < manifest.entries.length; index += 1) {
    const entry = manifest.entries[index];
    const prefix = `entry[${index}]`;
    try {
      assert(entry && typeof entry === 'object' && !Array.isArray(entry), `${prefix} must be an object`);
      for (const field of ENTRY_FIELDS) {
        assert(Object.hasOwn(entry, field), `${prefix}.${field} is required`);
      }
      assert(isNonEmptyString(entry.id), `${prefix}.id must be a non-empty string`);
      assert(!ids.has(entry.id), `duplicate entry id: ${entry.id}`);
      ids.add(entry.id);
      assert(/^[a-z0-9][a-z0-9-]*$/.test(entry.id), `invalid entry id: ${entry.id}`);
      assert(isNonEmptyString(entry.label), `${entry.id}.label is required`);
      assert(isNonEmptyString(entry.area), `${entry.id}.area is required`);
      assert(isNonEmptyString(entry.owner), `${entry.id}.owner is required`);
      assert(Array.isArray(entry.requirementIds), `${entry.id}.requirementIds must be an array`);
      const localRequirements = new Set();
      for (const requirementId of entry.requirementIds) {
        assert(/^TEST-\d{3}$/.test(requirementId), `${entry.id} has invalid requirement ID: ${requirementId}`);
        assert(!localRequirements.has(requirementId), `${entry.id} repeats requirement ID: ${requirementId}`);
        localRequirements.add(requirementId);
        if (requirementOwners.has(requirementId)) {
          throw new Error(`requirement ID ${requirementId} is assigned to both ${requirementOwners.get(requirementId)} and ${entry.id}`);
        }
        requirementOwners.set(requirementId, entry.id);
      }
      assert(Array.isArray(entry.command) && entry.command.length > 0, `${entry.id}.command must be a non-empty array`);
      assert(entry.command.every(isNonEmptyString), `${entry.id}.command tokens must be non-empty strings`);
      assert(ALLOWED_COMMANDS.has(entry.command[0]), `${entry.id} command is not allow-listed: ${entry.command[0]}`);
      const commandSignature = JSON.stringify([entry.cwd, entry.command]);
      assert(!commands.has(commandSignature), `duplicate command entry: ${entry.id}`);
      commands.add(commandSignature);
      assert(isNonEmptyString(entry.cwd), `${entry.id}.cwd is required`);
      assert(VALID_TYPES.has(entry.type), `${entry.id}.type is invalid: ${entry.type}`);
      assert(Array.isArray(entry.profiles) && entry.profiles.length > 0, `${entry.id}.profiles must be a non-empty array`);
      for (const profile of entry.profiles) {
        assert(profileNames.has(profile), `${entry.id} references unknown profile: ${profile}`);
      }
      assert(Number.isInteger(entry.timeoutSec) && entry.timeoutSec > 0 && entry.timeoutSec <= 3600, `${entry.id}.timeoutSec must be an integer between 1 and 3600`);
      assert(entry.serialGroup === null || isNonEmptyString(entry.serialGroup), `${entry.id}.serialGroup must be null or a non-empty string`);
      assert(Array.isArray(entry.fixtures), `${entry.id}.fixtures must be an array`);
      assert(typeof entry.mutatesFilesystem === 'boolean', `${entry.id}.mutatesFilesystem must be boolean`);
      assert(typeof entry.liveRequired === 'boolean', `${entry.id}.liveRequired must be boolean`);
      assert(typeof entry.enabled === 'boolean', `${entry.id}.enabled must be boolean`);
      assert(Array.isArray(entry.pathChecks ?? []), `${entry.id}.pathChecks must be an array when present`);
      assert(Array.isArray(entry.requires ?? []), `${entry.id}.requires must be an array when present`);
      if (!entry.enabled) {
        assert(isNonEmptyString(entry.disabledReason), `${entry.id} is disabled but has no disabledReason`);
      }
      if (entry.liveRequired) {
        assert(entry.profiles.includes('live'), `${entry.id} is liveRequired but is not assigned to live`);
      }

      if (repoRoot) {
        resolveWithin(repoRoot, entry.cwd, { mustExist: true, label: `${entry.id}.cwd` });
        for (const checkPath of entry.pathChecks ?? []) {
          resolveWithin(repoRoot, checkPath, { mustExist: true, label: `${entry.id}.pathChecks` });
        }
        for (const fixture of entry.fixtures) {
          resolveWithin(repoRoot, fixture, { mustExist: true, label: `${entry.id}.fixtures` });
        }
      }
    } catch (error) {
      errors.push(error.message);
    }
  }

  if (selectedProfile === 'fast') {
    for (const entry of manifest.entries) {
      if (!entry.enabled || !entry.profiles.includes('fast')) continue;
      if (entry.liveRequired) errors.push(`${entry.id} cannot be liveRequired in fast profile`);
      for (const requirement of entry.requires ?? []) {
        if (FORBIDDEN_FAST_REQUIREMENTS.has(requirement)) {
          errors.push(`${entry.id} requires ${requirement}, forbidden in fast profile`);
        }
      }
    }
  }

  if (selectedProfile === 'full-offline') {
    for (const entry of manifest.entries) {
      if (entry.enabled && entry.profiles.includes('full-offline') && entry.liveRequired) {
        errors.push(`${entry.id} is liveRequired but included in full-offline`);
      }
    }
  }

  if (errors.length > 0) {
    throw new Error(errors.join('\n'));
  }

  return {
    profileNames: [...profileNames],
    entryIds: [...ids],
    requirementOwners,
  };
}

export function selectEntries(manifest, profile) {
  return manifest.entries.filter((entry) => entry.enabled && entry.profiles.includes(profile));
}

export function resolveEntry(entry, repoRoot) {
  return {
    ...entry,
    cwdResolved: resolveWithin(repoRoot, entry.cwd, { mustExist: true, label: `${entry.id}.cwd` }),
    commandResolved: expandCommand(entry.command),
  };
}

export function defaultManifestPath(scriptDirectory) {
  return path.join(scriptDirectory, 'test-manifest.json');
}
