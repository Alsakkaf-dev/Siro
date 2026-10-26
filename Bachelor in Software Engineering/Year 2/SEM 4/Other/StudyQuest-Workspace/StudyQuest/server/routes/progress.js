import { Router } from 'express';
import path from 'node:path';
import { DATA_DIR } from '../config.js';
import { atomicWriteJson, backupFile, readJsonSafe } from '../lib/atomicWrite.js';

const router = Router();
const PROGRESS_FILE = path.join(DATA_DIR, 'progress.json');
const BACKUP_DIR = path.join(DATA_DIR, 'backups');

export const DEFAULT_PROGRESS = {
  version: 1,
  xp: 0,
  missions: {},   // { [missionId]: { status, secondsSpent, pagesViewed[], bestScorePct, stars, attempts[] } }
  reading: {},    // { [relPath]: { seconds, pagesViewed[], lastAt } }
  updatedAt: null,
};

let lastBackup = 0;

router.get('/progress', (_req, res) => {
  res.json(readJsonSafe(PROGRESS_FILE, DEFAULT_PROGRESS));
});

router.put('/progress', (req, res) => {
  const body = req.body;
  if (!body || typeof body !== 'object' || typeof body.missions !== 'object') {
    return res.status(400).json({ error: 'invalid progress payload' });
  }
  // Backup at most every 10 minutes to keep the rolling window useful.
  if (Date.now() - lastBackup > 10 * 60 * 1000) {
    backupFile(PROGRESS_FILE, BACKUP_DIR, 20);
    lastBackup = Date.now();
  }
  body.updatedAt = new Date().toISOString();
  atomicWriteJson(PROGRESS_FILE, body);
  res.json({ ok: true, updatedAt: body.updatedAt });
});

export default router;
