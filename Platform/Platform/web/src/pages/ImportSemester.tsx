import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../core/app-context.js';
import { api, ApiError, type PackageImportRow, type PackagePreview, type PackageSourceReq } from '../lib/api.js';
import { PageHead } from '../ui/page.js';
import { Badge, Button, Card, CardHead, EmptyState, Field, Segmented, Skeleton } from '../ui/ui.js';
import { DiffView } from '../ui/diff.js';
import { Icon } from '../lib/icons.js';
import { CATEGORIES, GENERAL_DIR } from '../../../shared/package.js';
import { fmtNum } from '../lib/format.js';

type Kind = PackageSourceReq['kind'];
const fmtSize = (n: number): string => (n > 1_048_576 ? `${fmtNum(n / 1_048_576)} MB` : `${fmtNum(n / 1024, 0)} KB`);

function Report({ p }: { p: PackagePreview }) {
  const r = p.report;
  const warnings = r?.issues.filter((i) => i.level === 'warning') ?? [];
  const bytes = r?.files.reduce((s, f) => s + f.size, 0) ?? 0;
  return (
    <div className="stack" style={{ marginBlockStart: 'var(--s-4)' }}>
      <div className="row">
        {p.ok ? <Badge tone="ok"><Icon name="check" size={12} /> الحزمة سليمة</Badge> : <Badge tone="danger">فيها أخطاء — لن يُستورد شيء</Badge>}
        <Badge><bdi>{p.pkg}</bdi></Badge>
        {p.semester && <Badge tone="accent"><bdi>{p.semester.code} — {p.semester.name}</bdi></Badge>}
        {r && <Badge>{fmtNum(r.files.length, 0)} ملف · {fmtSize(bytes)}</Badge>}
        {p.results > 0 && <Badge tone="core">{p.results} نتيجة رسمية</Badge>}
      </div>
      {p.errors.length > 0 && (
        <div className="callout danger" role="alert">
          <ul className="plain">{p.errors.map((e, i) => <li key={i}><bdi>{e}</bdi></li>)}</ul>
        </div>
      )}
      {warnings.length > 0 && (
        <details>
          <summary><strong>تحذيرات ({warnings.length})</strong> — لا تمنع الاستيراد</summary>
          <ul className="plain diff-list">{warnings.map((w, i) => <li key={i} className="chg"><bdi dir="ltr">{w.path}</bdi> — {w.message}</li>)}</ul>
        </details>
      )}
      {r && Object.keys(r.counts).length > 0 && (
        <div className="table-wrap" style={{ overflowX: 'auto' }}>
          <table className="table" aria-label="الملفات حسب المادة والتصنيف">
            <thead><tr><th>المادة</th>{CATEGORIES.map((c) => <th key={c.dir} title={c.dir} className="num">{c.label}</th>)}</tr></thead>
            <tbody>
              {Object.entries(r.counts).filter(([k]) => k !== '—').map(([code, c]) => (
                <tr key={code}><th scope="row" dir="ltr">{code}</th>{CATEGORIES.map((cat) => <td key={cat.dir} className="num">{c[cat.dir] ?? ''}</td>)}</tr>
              ))}
              {r.counts['—'] && <tr><th scope="row">عام</th><td colSpan={CATEGORIES.length} className="num">{r.counts['—'][GENERAL_DIR]} ملف في {GENERAL_DIR}</td></tr>}
            </tbody>
          </table>
        </div>
      )}
      {p.diff && <DiffView diff={p.diff} />}
    </div>
  );
}

export default function ImportSemester() {
  const { toast, reloadSemesters } = useApp();
  const [env, setEnv] = useState<{ imports: PackageImportRow[]; drive_api: boolean; online: boolean } | null>(null);
  const [kind, setKind] = useState<Kind>('drive');
  const [link, setLink] = useState('');
  const [dir, setDir] = useState('');
  const [listing, setListing] = useState<{ name: string; json: unknown } | null>(null);
  const [listLink, setListLink] = useState('');
  const [preview, setPreview] = useState<PackagePreview | null>(null);
  const [busy, setBusy] = useState<'check' | 'apply' | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const load = (): void => void api.packages().then((e) => {
    setEnv(e);
    if (!e.drive_api) setKind((k) => (k === 'drive' ? (e.online ? 'listing' : 'local') : k));
  }).catch(() => setEnv({ imports: [], drive_api: false, online: false }));
  useEffect(load, []);

  const src = (): PackageSourceReq | null =>
    kind === 'drive' ? (link.trim() ? { kind, link: link.trim() } : null) : kind === 'local' ? (dir.trim() ? { kind, path: dir.trim() } : null) : listing ? { kind, listing: listing.json } : listLink.trim() ? { kind, link: listLink.trim() } : null;

  const check = async (): Promise<void> => {
    const s = src();
    if (!s) return;
    setErr(null);
    setPreview(null);
    setBusy('check');
    try {
      setPreview(await api.packagePreview(s));
    } catch (e) {
      setErr(e instanceof ApiError ? Object.values(e.fields)[0] ?? e.message : (e as Error).message);
    } finally {
      setBusy(null);
    }
  };
  const apply = async (): Promise<void> => {
    const s = src();
    if (!s || !preview?.ok) return;
    setBusy('apply');
    try {
      const r = await api.packageApply(s);
      toast(`تم استيراد ${preview.pkg}: ${r.files} ملف${r.results ? ` · ${r.results} نتيجة` : ''} (نسخة احتياطية: ${r.backup})`, { kind: 'ok' });
      setPreview(null);
      await reloadSemesters();
      load();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(null);
    }
  };
  const pickListing = async (f: File | undefined): Promise<void> => {
    setPreview(null);
    setErr(null);
    if (!f) return setListing(null);
    try {
      setListing({ name: f.name, json: JSON.parse(await f.text()) as unknown });
    } catch {
      setErr('الملف ليس JSON صالحًا');
    }
  };

  const options: { value: Kind; label: string }[] = [
    { value: 'drive', label: 'رابط Google Drive' },
    ...(env?.online ? [] : [{ value: 'local' as const, label: 'مجلد على الجهاز' }]),
    { value: 'listing', label: 'ملف قائمة الحزمة' },
  ];

  return (
    <div className="page">
      <PageHead title="استيراد فصل" icon="upload" crumbs={[{ to: '/academic', label: 'الفصول' }, { label: 'استيراد فصل' }]} sub="استورد مجلد SEM-X كاملًا: الفصل، المواد، النتائج الرسمية، وكل ملفات المواد في المكتبة." />
      <div className="grid cols-2 stagger" style={{ alignItems: 'start' }}>
        <Card>
          <CardHead title="مصدر الحزمة" icon="download" />
          <Segmented<Kind> label="المصدر" value={kind} onChange={(k) => { setKind(k); setPreview(null); setErr(null); }} options={options} />
          <div style={{ marginBlockStart: 'var(--s-4)' }}>
            {kind === 'drive' && (
              <Field label="رابط مجلد SEM-X في Drive" htmlFor="pk-link" hint="المجلد يجب أن يكون مشاركًا «لأي شخص لديه الرابط»." full>
                <input id="pk-link" className="input" dir="ltr" placeholder="https://drive.google.com/drive/folders/…" value={link} onChange={(e) => setLink(e.target.value)} />
              </Field>
            )}
            {kind === 'drive' && env && !env.drive_api && <div className="callout warn" style={{ marginBlockStart: 'var(--s-3)' }}>مفتاح Google Drive API غير مضبوط على الخادم، فالقراءة من الرابط لن تعمل. استخدم «ملف قائمة الحزمة».</div>}
            {kind === 'local' && (
              <Field label="المسار الكامل لمجلد SEM-X" htmlFor="pk-dir" hint="مثال: C:\Users\…\SEM-5" full>
                <input id="pk-dir" className="input" dir="ltr" value={dir} onChange={(e) => setDir(e.target.value)} />
              </Field>
            )}
            {kind === 'listing' && (
              <div className="stack">
                <Field label="رابط ملف SEM-X.listing.json في Drive" htmlFor="pk-llink" hint="من مجلد Siro Semesters/_index — لا يحتاج مفتاح API." full>
                  <input id="pk-llink" className="input" dir="ltr" placeholder="https://drive.google.com/file/d/…" value={listLink} disabled={!!listing} onChange={(e) => { setListLink(e.target.value); setPreview(null); }} />
                </Field>
                <Field label="أو ارفع الملف من جهازك" htmlFor="pk-file" full>
                  <input id="pk-file" ref={fileInput} type="file" accept="application/json,.json" className="input" onChange={(e) => void pickListing(e.target.files?.[0])} />
                </Field>
              </div>
            )}
          </div>
          <div className="row" style={{ marginBlockStart: 'var(--s-4)' }}>
            <Button icon="search" disabled={!src() || busy !== null} onClick={() => void check()}>{busy === 'check' ? 'جارٍ الفحص…' : 'فحص الحزمة'}</Button>
            <Button variant="primary" icon="check" disabled={!preview?.ok || busy !== null} onClick={() => void apply()}>{busy === 'apply' ? 'جارٍ الاستيراد…' : 'استيراد'}</Button>
          </div>
          {err && <div className="callout danger" role="alert" style={{ marginBlockStart: 'var(--s-3)' }}>{err}</div>}
          {preview && <Report p={preview} />}
        </Card>
        <div className="stack">
          <Card>
            <CardHead title="الحزم المستوردة" icon="layers" />
            {env === null ? <Skeleton h={80} /> : env.imports.length === 0 ? <EmptyState icon="layers" title="لم تُستورد أي حزمة بعد" /> : (
              <ul className="plain">
                {env.imports.map((i) => (
                  <li key={i.pkg} className="un-item">
                    <span><strong><bdi>{i.pkg}</bdi></strong> · <span className="num">{fmtNum(i.files, 0)}</span> ملف<br /><small className="muted num" dir="ltr">{i.imported_at.slice(0, 16).replace('T', ' ')}</small></span>
                    <span className="row">
                      {i.semester_id && <Link className="btn sm" to={`/academic/s/${i.semester_id}`}>الفصل</Link>}
                      <Link className="btn sm" to={`/library?sem=${encodeURIComponent(i.pkg.replace('-', ' '))}`}>الملفات</Link>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <Card>
            <CardHead title="صيغة الحزمة" icon="info" />
            <p className="muted">مجلد باسم <b dir="ltr">SEM-X</b> فيه <b dir="ltr">semester.json</b>، ومجلد <b dir="ltr">{GENERAL_DIR}</b>، ومجلد لكل مادة باسم <b dir="ltr">CODE-SECTION Name</b> وبداخله:</p>
            <ul className="plain" dir="ltr" style={{ columns: 2, marginBlockStart: 'var(--s-2)' }}>{CATEGORIES.map((c) => <li key={c.dir}><code>{c.dir}</code></li>)}</ul>
            <p className="muted" style={{ marginBlockStart: 'var(--s-3)' }}>الأخطاء تمنع الاستيراد، والتحذيرات لا تمنعه. تُحفظ نسخة احتياطية تلقائيًا قبل التطبيق، وإعادة الاستيراد تستبدل ملفات نفس الحزمة فقط.</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
