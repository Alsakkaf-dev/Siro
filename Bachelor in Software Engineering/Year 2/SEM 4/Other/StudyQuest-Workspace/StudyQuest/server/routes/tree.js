import { Router } from 'express';
import { getTree } from '../lib/treeCache.js';

const router = Router();

router.get('/tree', (req, res) => {
  res.json(getTree(req.query.refresh === '1'));
});

export default router;
