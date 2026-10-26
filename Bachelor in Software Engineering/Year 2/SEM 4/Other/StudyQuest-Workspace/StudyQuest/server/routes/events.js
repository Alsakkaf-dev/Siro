import { Router } from 'express';
import { appendEvents } from '../lib/ledger.js';

const router = Router();

// Body: { events: [{ type: 'heartbeat'|'page_view'|'answer'|'gate_result'|'file_open', ... }] }
router.post('/events', (req, res) => {
  const events = req.body?.events;
  if (!Array.isArray(events) || events.length === 0) {
    return res.status(400).json({ error: 'events array required' });
  }
  if (events.length > 500) return res.status(400).json({ error: 'too many events' });
  appendEvents(events);
  res.json({ ok: true, count: events.length });
});

export default router;
