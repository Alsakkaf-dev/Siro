import { Suspense, lazy, useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useApp } from '../core/app-context.js';
import { usePageTitle } from '../core/title.js';
import { lib } from '../lib/api.js';
import { Icon } from '../lib/icons.js';
import { PageHead } from '../ui/page.js';
import { Badge, Button, Card, CardHead, EmptyState, Skeleton, useDebounced } from '../ui/ui.js';
import { CourseBadge, ProgressBar, fmtDate, fmtSize, kindLabel, pctOf, typeLabel } from '../library/common.js';
import { MediaPlayer, YoutubePlayer } from '../library/players.js';
import { bareLibId, libRefOf, fmtTime, type LibBookmark, type LibItem } from '../../../shared/library.js';

const PdfViewer = lazy(() => import('../library/PdfViewer.js'));

/* ───── حفظ التقدّم بتأخير + عند المغادرة ───── */
function useProgressSaver(ref: string | null) {
  const last = useRef<{ pos: number; dur: number | null } | null>(null);
  const saved = useRef<number>(-1);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flush = useCallback((keepalive = false): void => {
    if (!ref || !last.current) return;
    const { pos, dur } = last.current;
    if (Math.round(pos) === saved.current) return;
    saved.current = Math.round(pos);
    const body: Record<string, unknown> = { progress: Math.round(pos * 10) / 10 };
    if (dur) body['duration'] = Math.round(dur * 10) / 10;
    void fetch(`/api/library/meta/${encodeURIComponent(ref)}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), keepalive }).catch(() => undefined);
  }, [ref]);
  const report = useCallback((pos: number, dur: number | null): void => {
    last.current = { pos, dur };
    if (!timer.current) {
      timer.current = setTimeout(() => {
        timer.current = null;
        flush();
      }, 4000);
    }
  }, [flush]);
  useEffect(() => {
    const hide = (): void => flush(true);
    window.addEventListener('pagehide', hide);
    return () => {
      window.removeEventListener('pagehide', hide);
      if (timer.current) clearTimeout(timer.current);
      timer.current = null;
      flush(true);
    };
  }, [flush]);
  return report;
}

function DocxView({ id }: { id: string }) {
  const [html, setHtml] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    lib.docx(id).then((r) => alive && setHtml(r.html)).catch((e: Error) => alive && setErr(e.message));
    return () => {
      alive = false;
    };
  }, [id]);
  if (err) return <div className="callout danger" role="alert">{err}</div>;
  if (html === null) return <Skeleton h={320} r={16} />;
  const doc = `<!doctype html><html dir="auto"><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; style-src 'unsafe-inline'"><style>body{font:16px/1.8 system-ui,'Segoe UI',Tahoma,sans-serif;max-width:820px;margin:0 auto;padding:24px;color:#1b1f33;background:#fff}img{max-width:100%;height:auto}table{border-collapse:collapse;max-width:100%}td,th{border:1px solid #ccc;padding:4px 8px}a{color:#5b45f0}</style></head><body>${html}</body></html>`;
  return <div className="lib-stage"><iframe className="lib-frame" title="معاينة المستند" sandbox="" srcDoc={doc} /></div>;
}

function TextView({ id }: { id: string }) {
  const [d, setD] = useState<{ text: string; truncated: boolean } | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    lib.text(id).then((r) => alive && setD(r)).catch((e: Error) => alive && setErr(e.message));
    return () => {
      alive = false;
    };
  }, [id]);
  if (err) return <div className="callout danger" role="alert">{err}</div>;
  if (!d) return <Skeleton h={240} r={16} />;
  return (
    <div className="lib-stage">
      {d.truncated && <div className="callout warn" style={{ margin: 'var(--s-3)' }}>الملف كبير؛ المعروض أول جزء منه فقط.</div>}
      <pre className="lib-text"><code>{d.text}</code></pre>
    </div>
  );
}

function TagEditor({ it, onChange }: { it: LibItem; onChange: (n: LibItem) => void }) {
  const { toast } = useApp();
  const [val, setVal] = useState('');
  const [known, setKnown] = useState<string[]>([]);
  useEffect(() => {
    void lib.tags().then((t) => setKnown(t.map((x) => x.tag))).catch(() => undefined);
  }, [it.tags.length]);
  const save = async (tags: string[]): Promise<void> => {
    try {
      onChange(await lib.setTags(it.ref, tags));
    } catch (e) {
      toast((e as Error).message, { kind: 'error' });
    }
  };
  const add = (): void => {
    const parts = val.split(/[,،]/).map((s) => s.trim().replace(/^#+/, '').trim()).filter(Boolean);
    if (!parts.length) return;
    setVal('');
    void save([...new Set([...it.tags, ...parts])]);
  };
  const onKey = (e: KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter' || e.key === ',' || e.key === '،') {
      e.preventDefault();
      add();
    }
  };
  return (
    <div className="tag-editor">
      {it.tags.map((t) => (
        <span key={t} className="tag-chip"><bdi>#{t}</bdi><button type="button" aria-label={`إزالة الوسم ${t}`} onClick={() => void save(it.tags.filter((x) => x !== t))}>×</button></span>
      ))}
      <input className="input" list="lib-known-tags" placeholder="أضف وسمًا ثم Enter" aria-label="وسم جديد" value={val} onChange={(e) => setVal(e.target.value)} onKeyDown={onKey} onBlur={add} maxLength={30} />
      <datalist id="lib-known-tags">{known.filter((k) => !it.tags.includes(k)).map((k) => <option key={k} value={k} />)}</datalist>
    </div>
  );
}

function NoteEditor({ it, onChange }: { it: LibItem; onChange: (n: LibItem) => void }) {
  const [v, setV] = useState(it.note ?? '');
  const [state, setState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const dv = useDebounced(v, 800);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (dv === (it.note ?? '')) return;
    setState('saving');
    lib.meta(it.ref, { note: dv === '' ? null : dv }).then((n) => { onChange(n); setState('saved'); }).catch(() => setState('error'));
  }, [dv]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div>
      <label className="sr-only" htmlFor="lib-note">ملاحظاتي</label>
      <textarea id="lib-note" className="textarea" rows={6} placeholder="اكتب ملاحظاتك هنا… تُحفظ تلقائيًا" value={v} onChange={(e) => { setV(e.target.value); setState('idle'); }} maxLength={20000} dir="auto" />
      <p className="muted" aria-live="polite" style={{ margin: '4px 0 0', fontSize: 'var(--fs-xs)' }}>{state === 'saving' ? 'جارٍ الحفظ…' : state === 'saved' ? 'تم الحفظ' : state === 'error' ? 'تعذّر الحفظ' : ' '}</p>
    </div>
  );
}

function parseTime(s: string): number | null {
  const t = s.trim();
  if (!t) return null;
  const parts = t.split(':').map((x) => Number(x));
  if (parts.some((n) => !Number.isFinite(n) || n < 0) || parts.length > 3) return null;
  return parts.reduce((a, n) => a * 60 + n, 0);
}

function Bookmarks({ it, list, setList, seek, curPos, isPdf, timeMode, live }: { it: LibItem; list: LibBookmark[]; setList: (l: LibBookmark[]) => void; seek: (pos: number) => void; curPos: () => number; isPdf: boolean; timeMode: boolean; live: boolean }) {
  const { toast } = useApp();
  const [label, setLabel] = useState('');
  const [time, setTime] = useState('');
  const [edit, setEdit] = useState<{ id: string; text: string } | null>(null);
  const fmtPos = (p: number): string => (isPdf ? `ص ${Math.round(p)}` : fmtTime(p));
  const reload = async (): Promise<void> => setList(await lib.bookmarks(it.ref));
  const add = async (): Promise<void> => {
    let pos = curPos();
    if (timeMode) {
      const typed = parseTime(time);
      if (time.trim() && typed === null) return void toast('صيغة الوقت غير صحيحة، مثل 12:30', { kind: 'error' });
      if (typed !== null) pos = typed;
      else if (!live) return void toast('اكتب الوقت يدويًا (مثل 12:30) لأن التتبّع التلقائي غير متاح', { kind: 'error' });
    }
    try {
      await lib.addBookmark(it.ref, pos, label.trim() || undefined);
      setLabel('');
      setTime('');
      await reload();
      toast('أُضيفت العلامة', { kind: 'ok' });
    } catch (e) {
      toast((e as Error).message, { kind: 'error' });
    }
  };
  return (
    <div className="stack" style={{ gap: 'var(--s-3)' }}>
      <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
        {timeMode && <input className="input ltr-in" style={{ inlineSize: 96, direction: 'ltr', textAlign: 'center' }} aria-label="الوقت (دقيقة:ثانية)" placeholder={live ? 'الآن' : 'mm:ss'} value={time} onChange={(e) => setTime(e.target.value)} />}
        <input className="input" style={{ flex: 1, minInlineSize: 120 }} aria-label="وصف العلامة" placeholder="وصف (اختياري)" value={label} onChange={(e) => setLabel(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && void add()} maxLength={200} />
        {!isPdf && <Button size="sm" icon="bookmark" onClick={() => void add()}>إضافة</Button>}
      </div>
      {isPdf && <p className="muted" style={{ margin: 0, fontSize: 'var(--fs-xs)' }}>اضغط «علامة للصفحة» في شريط أدوات PDF.</p>}
      {list.length === 0 ? (
        <p className="muted" style={{ margin: 0 }}>لا علامات بعد.</p>
      ) : (
        <ul className="bm-list">
          {list.map((b) => (
            <li key={b.id} className="bm-item">
              {edit?.id === b.id ? (
                <input className="input" style={{ flex: 1, minHeight: 34 }} autoFocus value={edit.text} aria-label="تعديل وصف العلامة" onChange={(e) => setEdit({ id: b.id, text: e.target.value })}
                  onKeyDown={(e) => { if (e.key === 'Escape') setEdit(null); if (e.key === 'Enter') void lib.editBookmark(b.id, edit.text).then(reload).then(() => setEdit(null)); }} onBlur={() => setEdit(null)} />
              ) : (
                <button className="bm-go" onClick={() => seek(b.pos)} title="انتقل إلى هذه العلامة"><b>{fmtPos(b.pos)}</b><span><bdi>{b.label ?? '—'}</bdi></span></button>
              )}
              <button className="icon-btn sm ghost" aria-label="تعديل الوصف" title="تعديل الوصف" onMouseDown={(e) => e.preventDefault()} onClick={() => setEdit({ id: b.id, text: b.label ?? '' })}><Icon name="edit" size={14} /></button>
              <button className="icon-btn sm ghost" aria-label="حذف العلامة" title="حذف العلامة" onClick={() => void lib.delBookmark(b.id).then(reload)}><Icon name="trash" size={14} /></button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function LibraryItem({ source }: { source: 'file' | 'youtube' }) {
  const { id = '' } = useParams();
  // الروابط القديمة الخاطئة كانت /library/f/f:… — نقبل المعرّف مع أو بدون البادئة
  const bareId = bareLibId(id);
  const ref = libRefOf(source, bareId);
  const { toast } = useApp();
  const [it, setIt] = useState<LibItem | null>(null);
  usePageTitle(it?.title ?? null);
  const [missing, setMissing] = useState(false);
  const [marks, setMarks] = useState<LibBookmark[]>([]);
  const [live, setLive] = useState(false);
  const pos = useRef(0);
  const seekFn = useRef<(p: number) => void>(() => undefined);
  const report = useProgressSaver(it ? ref : null);

  useEffect(() => {
    let alive = true;
    setIt(null);
    setMissing(false);
    lib.item(ref).then((r) => {
      if (!alive) return;
      setIt(r);
      void lib.open(ref).catch(() => undefined);
    }).catch(() => alive && setMissing(true));
    void lib.bookmarks(ref).then((b) => alive && setMarks(b)).catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [ref]);

  const registerSeek = useCallback((fn: (p: number) => void) => {
    seekFn.current = fn;
  }, []);
  const onTime = useCallback((sec: number, dur: number | null) => {
    pos.current = sec;
    report(sec, dur);
  }, [report]);
  const onPage = useCallback((p: number, total: number) => {
    pos.current = p;
    report(p, total);
  }, [report]);
  const onTracking = useCallback((v: boolean) => setLive(v), []);

  if (missing) {
    return (
      <div className="page">
        <PageHead title="العنصر غير موجود" icon="library" crumbs={[{ to: '/library', label: 'المكتبة' }]} />
        <EmptyState icon="file" title="لم يُعثر على هذا العنصر" text="ربما حُذف من المجلد أو أُزيل من المكتبة." action={<Button to="/library" variant="primary">العودة للمكتبة</Button>} />
      </div>
    );
  }
  if (!it) return <div className="page"><PageHead title="…" icon="library" /><Skeleton h={360} r={16} /></div>;

  const isYt = it.source === 'youtube';
  const isPdf = it.preview === 'pdf';
  const timeMode = it.preview === 'video' || it.preview === 'audio' || isYt;
  const raw = lib.rawUrl(bareId || it.id);
  const folderTo = it.folder ? `/library/folders?p=${encodeURIComponent(it.folder)}` : '/library/folders';

  const toggleDone = async (): Promise<void> => {
    try {
      setIt(await lib.meta(it.ref, { done: !it.done }));
    } catch (e) {
      toast((e as Error).message, { kind: 'error' });
    }
  };
  const addPageMark = async (page: number): Promise<void> => {
    try {
      await lib.addBookmark(it.ref, page);
      setMarks(await lib.bookmarks(it.ref));
      toast(`أُضيفت علامة للصفحة ${page}`, { kind: 'ok' });
    } catch (e) {
      toast((e as Error).message, { kind: 'error' });
    }
  };

  let stage;
  if (it.missing) stage = <div className="callout warn" role="alert">هذا الملف لم يعد موجودًا في المجلد (مفقود). بقيت وسومه وملاحظاته محفوظة.</div>;
  else if (isYt) stage = <YoutubePlayer videoId={it.video_id ?? ''} initial={it.progress} onTime={onTime} registerSeek={registerSeek} onTracking={onTracking} />;
  else if (isPdf) stage = (
    <Suspense fallback={<Skeleton h={420} r={16} />}>
      <PdfViewer url={raw} initialPage={Math.round(it.progress)} onPage={onPage} registerSeek={registerSeek} onBookmark={(p) => void addPageMark(p)} />
    </Suspense>
  );
  else if (it.preview === 'video' || it.preview === 'audio') stage = <MediaPlayer key={it.id} src={raw} audio={it.preview === 'audio'} initial={it.progress} onTime={onTime} registerSeek={registerSeek} />;
  else if (it.preview === 'image') stage = <div className="lib-stage lib-img"><img src={raw} alt={it.title} /></div>;
  else if (it.preview === 'docx') stage = <DocxView id={it.id} />;
  else if (it.preview === 'text') stage = <TextView id={it.id} />;
  else stage = (
    <EmptyState icon="file" title="لا توجد معاينة لهذا النوع" text={`ملفات ${kindLabel(it.kind)} (.${it.ext}) لا تُعرض داخل الموقع. نزّله وافتحه ببرنامجه.`} action={<a className="btn primary" href={lib.rawUrl(it.id, true)} download><Icon name="download" size={16} /> تنزيل</a>} />
  );

  return (
    <div className="page">
      <PageHead
        title={<bdi>{it.title}</bdi>}
        icon={isYt ? 'play' : 'file'}
        crumbs={[{ to: '/library', label: 'المكتبة' }, isYt ? { to: '/library/youtube', label: 'YouTube' } : { to: folderTo, label: it.folder || 'المجلدات' }]}
        badge={it.done ? <Badge tone="ok">مكتمل</Badge> : undefined}
        actions={
          <>
            <Button icon="check" onClick={() => void toggleDone()}>{it.done ? 'إلغاء الإكمال' : 'تعليم كمكتمل'}</Button>
            {!isYt && !it.missing && <a className="btn" href={lib.rawUrl(it.id, true)} download><Icon name="download" size={16} /> تنزيل</a>}
            {isYt && <Link className="btn" to="/library/youtube">كل الفيديوهات</Link>}
          </>
        }
      />
      <div className="lib-view">
        <div className="lib-main">{stage}</div>
        <aside className="lib-side" aria-label="تفاصيل العنصر">
          <Card>
            <CardHead title="التفاصيل" icon="info" />
            <dl className="meta-dl">
              <dt>النوع</dt><dd>{kindLabel(it.kind)}{it.type ? ` · ${typeLabel(it.type)}` : ''}</dd>
              <dt>المادة</dt><dd><CourseBadge it={it} /></dd>
              {it.sem && (<><dt>الفصل</dt><dd><bdi>{it.sem}</bdi> <small className="muted">(مُستنتج)</small></dd></>)}
              {!isYt && (<><dt>الحجم</dt><dd className="num">{fmtSize(it.size)}</dd><dt>آخر تعديل</dt><dd>{fmtDate(it.mtime)}</dd><dt>المسار</dt><dd style={{ direction: 'ltr', textAlign: 'start' }}><bdi>{it.rel_path}</bdi></dd></>)}
              <dt>التقدّم</dt><dd><ProgressBar value={pctOf(it)} /></dd>
              <dt>مرات الفتح</dt><dd className="num">{it.opened_count}</dd>
            </dl>
            <p className="muted" style={{ fontSize: 'var(--fs-xs)', marginBottom: 0 }}>الفصل والمادة والتصنيف تقديرات من اسم المجلد.</p>
            {it.course && <p style={{ marginBlock: 'var(--s-2) 0' }}><Link to={`/academic/s/${it.course.semester_id}/courses${it.course.id ? `/${it.course.id}?tab=materials` : ""}`}>فتح المادة في الدراسة ←</Link></p>}
          </Card>
          <Card>
            <CardHead title="الوسوم" icon="tag" />
            <TagEditor it={it} onChange={(n) => setIt(n)} />
          </Card>
          <Card>
            <CardHead title="ملاحظاتي" icon="edit" />
            <NoteEditor key={it.ref} it={it} onChange={(n) => setIt((cur) => (cur ? { ...cur, note: n.note } : n))} />
          </Card>
          <Card>
            <CardHead title={isPdf ? 'علامات الصفحات' : timeMode ? 'علامات الوقت' : 'العلامات'} icon="bookmark" />
            <Bookmarks it={it} list={marks} setList={setMarks} seek={(p) => seekFn.current(p)} curPos={() => pos.current} isPdf={isPdf} timeMode={timeMode} live={live || !isYt} />
          </Card>
        </aside>
      </div>
    </div>
  );
}
