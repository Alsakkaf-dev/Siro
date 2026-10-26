import { Router } from 'express';
import { todayLedger, ledgerSummary } from '../lib/ledger.js';

const router = Router();

router.get('/time/today', (_req, res) => {
  res.json(todayLedger());
});

router.get('/time/summary', (_req, res) => {
  res.json(ledgerSummary());
});

export default router;
