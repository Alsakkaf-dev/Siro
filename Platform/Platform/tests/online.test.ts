import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import type { AddressInfo } from 'node:net';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ROOT, tmpDir } from './helpers.js';

/* ‏Blob و Drive وهميان داخل الذاكرة عبر اعتراض fetch */
const blobs = new Map<string, Buffer>();
const driveFiles = new Map<string, string>();
const realFetch = globalThis.fetch;
const TOKEN = 'vercel_blob_rw_STORE123_secret';

function fakeFetch(input: string | URL | Request, init?: RequestInit): Promise<Response> {
  const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url);
  if (url.hostname === 'vercel.com' && url.pathname === '/api/blob/') {
    const h = new Headers(init?.headers);
    expect(h.get('authorization')).toBe(`Bearer ${TOKEN}`);
    expect(h.get('x-vercel-blob-store-id')).toBe('STORE123');
    expect(h.get('x-vercel-blob-access')).toBe('private');
    blobs.set(url.searchParams.get('pathname')!, Buffer.from(init!.body as Uint8Array));
    return Promise.resolve(new Response('{}', { status: 200 }));
  }
  if (url.hostname === 'store123.private.blob.vercel-storage.com') {
    const b = blobs.get(url.pathname.slice(1));
    return Promise.resolve(b ? new Response(new Uint8Array(b)) : new Response('not found', { status: 404 }));
  }
  if (url.hostname === 'drive.google.com' && url.pathname === '/uc') {
    const t = driveFiles.get(url.searchParams.get('id') ?? '');
    return Promise.resolve(t ? new Response(t) : new Response('nope', { status: 404 }));
  }
  return realFetch(input, init);
}

async function boot(tmp: string): Promise<{ base: string; close: () => Promise<void> }> {
  process.env['PLATFORM_TMP'] = tmp;
  const mod = await import('../server/online.js');
  const app = await mod.createOnlineHandler();
  const srv = http.createServer(app);
  await new Promise<void>((r) => srv.listen(0, '127.0.0.1', () => r()));
  const port = (srv.address() as AddressInfo).port;
  return { base: `http://127.0.0.1:${port}`, close: () => new Promise((r) => srv.close(() => r())) };
}

/** طلب بـ Host مخصص (fetch لا يسمح بتغيير Host) */
function rawPost(base: string, p: string, headers: Record<string, string>, body: unknown): Promise<number> {
  const u = new URL(base);
  const data = Buffer.from(JSON.stringify(body));
  return new Promise((resolve, reject) => {
    const req = http.request({ hostname: u.hostname, port: u.port, path: p, method: 'POST', headers: { 'content-type': 'application/json', 'content-length': data.length, ...headers } }, (res) => {
      res.resume();
      res.on('end', () => resolve(res.statusCode ?? 0));
    });
    req.on('error', reject);
    req.end(data);
  });
}

let dir: string;
const saved = { ...process.env };
beforeAll(() => {
  dir = tmpDir('platform-online-');
  globalThis.fetch = fakeFetch as typeof fetch;
  process.env['BLOB_READ_WRITE_TOKEN'] = TOKEN;
  const seed = JSON.parse(fs.readFileSync(path.join(ROOT, 'seed', 'sem5-dashboard.json'), 'utf8')) as Record<string, unknown>;
  const m1 = {
    package_version: 1, source: 'package:SEM-1',
    semester: { id: 'sem1', code: 'SEM 1', name: 'Semester I 2024/2025', year_no: 1, sem_no: 1, start_date: '2024-10-06', weeks: 16, break_weeks: [], exam_start: null, exam_end: null, note: null },
    courses: [{ id: 'sem1-scsr1013', code: 'SCSR1013', name: 'Digital Logic', section: '01', credits: 3, color: '#4CC9F0', result: { grade: 'C+', points: 2.33, credits: 3, status: null } }],
    assessments: [], notes: [],
  };
  driveFiles.set('LISTFILE0001', JSON.stringify({ pkg: 'SEM-1', location: 'https://drive.google.com/drive/folders/F1', manifest: m1, entries: [{ path: 'semester.json', size: 1, ref: 'm1' }, { path: 'SCSR1013-01 Digital Logic/02-Lectures/ch1.pdf', size: 10, ref: 'DRIVEPDF1' }] }));
  driveFiles.set('LISTFILE0005', JSON.stringify({ pkg: 'SEM-5', location: 'x', manifest: { package_version: 1, source: seed['source'], semester: seed['semester'], courses: seed['courses'], assessments: seed['assessments'], notes: seed['notes'] }, entries: [{ path: 'semester.json', size: 1, ref: 'm5' }] }));
  process.env['PLATFORM_PACKAGE_LISTINGS'] = 'SEM-1=LISTFILE0001, SEM-5=LISTFILE0005, SEM-9=MISSINGFILE99';
});
afterAll(() => {
  globalThis.fetch = realFetch;
  for (const k of Object.keys(process.env)) if (!(k in saved)) delete process.env[k];
  Object.assign(process.env, saved);
  fs.rmSync(dir, { recursive: true, force: true });
});

describe('online runtime (Vercel)', () => {
  it('parses PLATFORM_PACKAGE_LISTINGS', async () => {
    const { parseListingEnv } = await import('../server/online.js');
    expect(parseListingEnv(' SEM-1=a ,SEM-2=b,,bad')).toEqual([{ pkg: 'SEM-1', id: 'a' }, { pkg: 'SEM-2', id: 'b' }]);
  });

  it('cold start imports Drive listings, accepts any Host, persists writes to Blob, and a new instance restores them', async () => {
    const a = await boot(path.join(dir, 'i1'));
    const pk = await (await fetch(`${a.base}/api/packages`)).json();
    expect(pk.imports.map((i: { pkg: string }) => i.pkg).sort()).toEqual(['SEM-1', 'SEM-5']); // SEM-9 مفقود → يُتجاهل بدون تعطل
    expect(pk.online).toBe(true);
    expect(blobs.has('platform.db')).toBe(true);
    expect([...blobs.keys()].some((k) => /^backups\/\d{4}-\d{2}-\d{2}\.db$/.test(k))).toBe(true);
    const items = await (await fetch(`${a.base}/api/library/items?q=ch1.pdf`)).json();
    expect(items.items[0]).toMatchObject({ origin: 'drive', preview: 'drive', remote_id: 'DRIVEPDF1' });
    // Host عام + Origin مطابق
    const ok = await rawPost(a.base, '/api/semesters/sem5/notes', { host: 'siro.example.app', origin: 'https://siro.example.app' }, { text: 'ملاحظة من الإنترنت', tag: 'note' });
    expect(ok).toBeLessThan(300);
    const bad = await realFetch(`${a.base}/api/semesters/sem5/notes`, { method: 'POST', headers: { 'content-type': 'application/json', origin: 'https://evil.example' }, body: JSON.stringify({ text: 'x', tag: 'note' }) });
    expect(bad.status).toBe(403);
    await a.close();

    const b = await boot(path.join(dir, 'i2')); // نسخة جديدة تمامًا (/tmp فارغ)
    const sem = await (await fetch(`${b.base}/api/semesters/sem5`)).json();
    expect(JSON.stringify(sem)).toContain('ملاحظة من الإنترنت');
    const res = await (await fetch(`${b.base}/api/packages/results/sem1`)).json();
    expect(res[0]).toMatchObject({ grade: 'C+', points: 2.33 });
    const html = await (await fetch(`${b.base}/academic/import`)).text();
    expect(html).toContain('<div id="root">');
    await b.close();
  });

  it('the local folder source is refused online', async () => {
    const c = await boot(path.join(dir, 'i3'));
    const r = await fetch(`${c.base}/api/packages/preview`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ kind: 'local', path: '/etc' }) });
    expect(r.status).toBe(400);
    await c.close();
  });
});
