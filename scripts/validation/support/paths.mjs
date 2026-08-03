import fs from 'node:fs';
import path from 'node:path';

export function isWithin(root, candidate) {
  const relative = path.relative(root, candidate);
  return relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative));
}

export function resolveWithin(root, relativePath, { mustExist = false, label = 'path' } = {}) {
  if (typeof relativePath !== 'string' || relativePath.trim() === '') {
    throw new Error(`${label} must be a non-empty repository-relative path`);
  }
  if (path.isAbsolute(relativePath)) {
    throw new Error(`${label} must be repository-relative: ${relativePath}`);
  }

  const resolved = path.resolve(root, relativePath);
  if (!isWithin(root, resolved)) {
    throw new Error(`${label} escapes repository root: ${relativePath}`);
  }
  if (mustExist && !fs.existsSync(resolved)) {
    throw new Error(`${label} does not exist: ${relativePath}`);
  }
  if (mustExist) {
    const realRoot = fs.realpathSync(root);
    const realResolved = fs.realpathSync(resolved);
    if (!isWithin(realRoot, realResolved)) {
      throw new Error(`${label} resolves outside repository root: ${relativePath}`);
    }
  }
  return resolved;
}

export function safeArtifactPath(repoRoot, requestedPath) {
  if (typeof requestedPath !== 'string' || requestedPath.trim() === '' || path.isAbsolute(requestedPath)) {
    throw new Error('result artifact must be a repository-relative path under test-results/');
  }
  const resolvedRoot = path.resolve(repoRoot);
  const artifactRoot = path.join(resolvedRoot, 'test-results');
  const resolved = path.resolve(resolvedRoot, requestedPath);
  if (!isWithin(artifactRoot, resolved)) {
    throw new Error('result artifact must be written under test-results/');
  }
  if (fs.existsSync(artifactRoot)) {
    const stat = fs.lstatSync(artifactRoot);
    if (stat.isSymbolicLink()) {
      throw new Error('test-results/ must not be a symbolic link');
    }
    const realRoot = fs.realpathSync(resolvedRoot);
    const realArtifactRoot = fs.realpathSync(artifactRoot);
    if (!isWithin(realRoot, realArtifactRoot)) {
      throw new Error('test-results/ resolves outside repository root');
    }
  }
  return resolved;
}
