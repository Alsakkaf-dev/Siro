import { Router } from 'express';
import fs from 'node:fs';
import { CONTENT_DIR } from '../config.js';
import { safeResolve } from '../lib/safePath.js';

const router = Router();

// Serves authored game data: world.json, schedule.json, subjects/<S>/country.json, banks
router.get(/^\/content\/(.+)$/, (req, res) => {
  const abs = safeResolve(CONTENT_DIR, req.params[0]);
  if (!abs) return res.status(403).json({ error: 'forbidden path' });
  if (!fs.existsSync(abs) || !fs.statSync(abs).isFile()) {
    return res.status(404).json({ error: 'not found' });
  }
  res.type('application/json').send(fs.readFileSync(abs, 'utf8'));
});

export default router;
