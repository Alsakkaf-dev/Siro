import { Router } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { RESOURCE_ROOT, CONVERTED_DIR } from '../config.js';
import { safeResolve } from '../lib/safePath.js';
import { convertedPdfFor } from '../lib/treeCache.js';

const router = Router();

const MIME = {
  '.pdf': 'application/pdf',
  '.md': 'text/markdown; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.csv': 'text/csv; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.ppt': 'application/vnd.ms-powerpoint',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.xls': 'application/vnd.ms-excel',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

/** Stream a file honoring HTTP Range requests (pdf.js uses them). */
function streamFile(req, res, absPath, contentType, extraHeaders = {}) {
  const stat = fs.statSync(absPath);
  const range = req.headers.range;
  res.set({ 'Accept-Ranges': 'bytes', 'Content-Type': contentType, ...extraHeaders });
  if (range) {
    const m = /bytes=(\d*)-(\d*)/.exec(range);
    let start = m && m[1] ? parseInt(m[1], 10) : 0;
    let end = m && m[2] ? parseInt(m[2], 10) : stat.size - 1;
    if (Number.isNaN(start) || start > end || end >= stat.size) {
      res.status(416).set('Content-Range', `bytes */${stat.size}`).end();
      return;
    }
    res.status(206).set({
      'Content-Range': `bytes ${start}-${end}/${stat.size}`,
      'Content-Length': end - start + 1,
    });
    fs.createReadStream(absPath, { start, end }).pipe(res);
  } else {
    res.set('Content-Length', stat.size);
    fs.createReadStream(absPath).pipe(res);
  }
}

router.get('/file', (req, res) => {
  const rel = req.query.p;
  const abs = safeResolve(RESOURCE_ROOT, rel ?? '');
  if (!abs) return res.status(403).json({ error: 'forbidden path' });
  if (!fs.existsSync(abs) || !fs.statSync(abs).isFile()) {
    return res.status(404).json({ error: 'not found' });
  }

  const ext = path.extname(abs).toLowerCase();

  // Transparently serve the converted PDF for PowerPoint files.
  if ((ext === '.pptx' || ext === '.ppt') && req.query.raw !== '1') {
    const pdfRel = convertedPdfFor(String(rel));
    if (pdfRel) {
      const pdfAbs = safeResolve(CONVERTED_DIR, pdfRel);
      if (pdfAbs && fs.existsSync(pdfAbs)) {
        return streamFile(req, res, pdfAbs, 'application/pdf', {
          'X-Converted-From': encodeURIComponent(rel),
        });
      }
    }
    // No conversion available — fall through and serve raw bytes (download).
  }

  streamFile(req, res, abs, MIME[ext] ?? 'application/octet-stream');
});

export default router;
