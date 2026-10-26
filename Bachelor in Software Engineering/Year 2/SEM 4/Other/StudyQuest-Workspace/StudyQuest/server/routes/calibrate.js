import { Router } from 'express';
import { runCalibration } from '../lib/calibrate.js';

const router = Router();

// Re-balance the plan from a moment in time (defaults to now). The frontend
// sends its clock's now so ?fakeNow= testing calibrates from the fake moment.
router.post('/calibrate', (req, res) => {
  const fromRaw = req.body?.from;
  const from = fromRaw ? new Date(fromRaw) : new Date();
  if (Number.isNaN(from.getTime())) {
    return res.status(400).json({ error: `invalid from: ${fromRaw}` });
  }
  try {
    const { plan, summary } = runCalibration({ from });
    res.json({ ok: true, plan, summary });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
