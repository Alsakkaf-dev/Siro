import fs from 'node:fs';
import path from 'node:path';

/** Write JSON atomically: write to tmp file then rename over target. */
export function atomicWriteJson(filePath, obj) {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
  const tmp = path.join(dir, `.tmp-${process.pid}-${Date.now()}`);
  fs.writeFileSync(tmp, JSON.stringify(obj, null, 2), 'utf8');
  fs.renameSync(tmp, filePath);
}

/** Keep a rolling set of timestamped backups of a JSON file (max `keep`). */
export function backupFile(filePath, backupDir, keep = 20) {
  if (!fs.existsSync(filePath)) return;
  fs.mkdirSync(backupDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const base = path.basename(filePath, '.json');
  fs.copyFileSync(filePath, path.join(backupDir, `${base}-${stamp}.json`));
  const backups = fs
    .readdirSync(backupDir)
    .filter((f) => f.startsWith(base + '-'))
    .sort();
  while (backups.length > keep) {
    fs.unlinkSync(path.join(backupDir, backups.shift()));
  }
}

export function readJsonSafe(filePath, fallback) {
  try {
    let text = fs.readFileSync(filePath, 'utf8');
    // strip BOM — PowerShell's utf8 Out-File writes one
    if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
    return JSON.parse(text);
  } catch {
    return fallback;
  }
}
