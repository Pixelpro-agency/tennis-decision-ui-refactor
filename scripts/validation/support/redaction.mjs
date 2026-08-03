import os from 'node:os';
import path from 'node:path';

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function replacePath(text, candidate, replacement) {
  if (!candidate) return text;
  const variants = new Set([
    candidate,
    candidate.replaceAll('\\', '/'),
    candidate.replaceAll('/', '\\'),
  ]);
  let result = text;
  for (const variant of variants) {
    if (!variant) continue;
    result = result.replace(new RegExp(escapeRegExp(variant), 'gi'), replacement);
  }
  return result;
}

export function redactText(value, { repoRoot = '', extraPaths = [] } = {}) {
  let text = String(value ?? '');

  text = replacePath(text, repoRoot, '<repo>');
  text = replacePath(text, os.homedir(), '<home>');
  text = replacePath(text, os.tmpdir(), '<tmp>');
  for (const extraPath of extraPaths) {
    text = replacePath(text, extraPath, '<path>');
  }

  text = text.replace(/\bBearer\s+[^\s,;]+/gi, 'Bearer <redacted>');
  text = text.replace(
    /\b(authorization|cookie|set-cookie|api[_-]?key|app[_-]?key|token|password)\b\s*[:=]\s*([^\s,;]+)/gi,
    '$1=<redacted>',
  );
  text = text.replace(/https?:\/\/[^\s)\]}>'\"]+/gi, '<url>');

  // Absolute paths outside the known repository are reduced while preserving
  // relative stack frames and module names.
  text = text.replace(/\b[A-Za-z]:\\(?:[^\r\n:]+\\)*[^\r\n:]+/g, '<path>');
  text = text.replace(/(^|[\s(])\/(?:Users|home|private|var\/folders)\/[^\s):]+/g, '$1<path>');

  return text;
}

export function truncateUtf8(value, maxBytes) {
  const text = String(value ?? '');
  const buffer = Buffer.from(text, 'utf8');
  if (buffer.length <= maxBytes) {
    return { text, truncated: false, originalBytes: buffer.length };
  }

  const suffix = '\n<output truncated>\n';
  const suffixBytes = Buffer.byteLength(suffix, 'utf8');
  const available = Math.max(0, maxBytes - suffixBytes);
  let sliced = buffer.subarray(0, available).toString('utf8');
  while (Buffer.byteLength(sliced, 'utf8') > available) {
    sliced = sliced.slice(0, -1);
  }
  return {
    text: sliced + suffix,
    truncated: true,
    originalBytes: buffer.length,
  };
}
