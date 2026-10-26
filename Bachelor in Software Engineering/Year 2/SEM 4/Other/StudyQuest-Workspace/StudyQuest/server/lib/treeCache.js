import fs from 'node:fs';
import path from 'node:path';
import { RESOURCE_ROOT, CONVERTED_DIR } from '../config.js';
import { readJsonSafe } from './atomicWrite.js';

let cache = null;

function loadManifest() {
  const manifest = readJsonSafe(path.join(CONVERTED_DIR, 'conversion-manifest.json'), []);
  const map = new Map();
  const arr = Array.isArray(manifest) ? manifest : [manifest];
  for (const m of arr) {
    if (m && m.src && m.pdf) map.set(m.src.replaceAll('\\', '/'), m.pdf.replaceAll('\\', '/'));
  }
  return map;
}

function walk(absDir, relDir, convertedMap) {
  const entries = [];
  let dirents;
  try {
    dirents = fs.readdirSync(absDir, { withFileTypes: true });
  } catch {
    return entries;
  }
  // Folders first, then files, both alphabetical
  dirents.sort((a, b) => {
    if (a.isDirectory() !== b.isDirectory()) return a.isDirectory() ? -1 : 1;
    return a.name.localeCompare(b.name, undefined, { numeric: true });
  });
  for (const d of dirents) {
    if (d.name.startsWith('~$') || d.name.startsWith('.tmp-')) continue;
    const rel = relDir ? `${relDir}/${d.name}` : d.name;
    if (d.isDirectory()) {
      entries.push({
        name: d.name,
        relPath: rel,
        type: 'dir',
        children: walk(path.join(absDir, d.name), rel, convertedMap),
      });
    } else {
      const ext = path.extname(d.name).toLowerCase().slice(1);
      let size = 0;
      try {
        size = fs.statSync(path.join(absDir, d.name)).size;
      } catch {}
      const node = { name: d.name, relPath: rel, type: 'file', ext, size };
      if (ext === 'pptx' || ext === 'ppt') {
        node.convertedAvailable = convertedMap.has(rel);
      }
      entries.push(node);
    }
  }
  return entries;
}

export function getTree(refresh = false) {
  if (!cache || refresh) {
    const convertedMap = loadManifest();
    cache = {
      builtAt: new Date().toISOString(),
      root: 'Finals Subjects',
      children: walk(RESOURCE_ROOT, '', convertedMap),
    };
  }
  return cache;
}

/** rel source path -> rel converted pdf path (under converted/), or null */
export function convertedPdfFor(relPath) {
  const map = loadManifest();
  return map.get(relPath.replaceAll('\\', '/')) ?? null;
}
