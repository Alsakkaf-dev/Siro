import path from 'node:path';

/**
 * Resolve a client-supplied relative path against a root directory,
 * guaranteeing the result stays inside the root. Returns the absolute
 * path or null if the request is unsafe.
 */
export function safeResolve(root, relPath) {
  if (typeof relPath !== 'string' || relPath.length === 0) return null;
  let decoded;
  try {
    decoded = decodeURIComponent(relPath);
  } catch {
    return null;
  }
  // Reject absolute paths, drive letters, null bytes
  if (decoded.includes('\0')) return null;
  if (path.isAbsolute(decoded)) return null;
  if (/^[a-zA-Z]:/.test(decoded)) return null;

  const resolved = path.resolve(root, decoded);
  const normalRoot = path.resolve(root);
  if (resolved !== normalRoot && !resolved.startsWith(normalRoot + path.sep)) return null;
  return resolved;
}
