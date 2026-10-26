import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { PORT, DIST_DIR, DATA_DIR, RESOURCE_ROOT } from './config.js';
import treeRoutes from './routes/tree.js';
import fileRoutes from './routes/file.js';
import contentRoutes from './routes/content.js';
import progressRoutes from './routes/progress.js';
import eventsRoutes from './routes/events.js';
import timeRoutes from './routes/time.js';
import calibrateRoutes from './routes/calibrate.js';

const app = express();
app.use(express.json({ limit: '2mb' }));

// sendBeacon posts text/plain — parse it as JSON too.
app.use(express.text({ type: ['text/plain'], limit: '2mb' }));
app.use((req, _res, next) => {
  if (typeof req.body === 'string' && req.body.length) {
    try { req.body = JSON.parse(req.body); } catch {}
  }
  next();
});

app.use('/api', treeRoutes);
app.use('/api', fileRoutes);
app.use('/api', contentRoutes);
app.use('/api', progressRoutes);
app.use('/api', eventsRoutes);
app.use('/api', timeRoutes);
app.use('/api', calibrateRoutes);

app.get('/api/health', (_req, res) =>
  res.json({ ok: true, resourceRoot: RESOURCE_ROOT, resourceExists: fs.existsSync(RESOURCE_ROOT) })
);

// Production: serve built frontend from dist/
if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));
  app.get(/^\/(?!api\/).*/, (_req, res) => res.sendFile(path.join(DIST_DIR, 'index.html')));
}

fs.mkdirSync(DATA_DIR, { recursive: true });

app.listen(PORT, () => {
  console.log(`[StudyQuest API] http://localhost:${PORT}`);
  console.log(`[StudyQuest API] resources: ${RESOURCE_ROOT} (exists: ${fs.existsSync(RESOURCE_ROOT)})`);
});
