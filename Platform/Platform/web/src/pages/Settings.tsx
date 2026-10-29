import { useEffect, useRef, useState } from 'react';
import { useApp } from '../core/app-context.js';
import { api, ApiError, type BackupInfo, type DiffResult, type EntityDiff, type Info } from '../lib/api.js';
import { PageHead } from '../ui/page.js';
import { Badge, Button, Card, CardHead, EmptyState, Segmented, Skeleton } from '../ui/ui.js';
import { Icon } from '../lib/icons.js';
import { AppearanceCard, NotifyCard } from '../core/Appearance.js';
import { useUrlParam } from '../core/useUrlParam.js';
import { FlagsCard } from '../core/FlagsCard.js';
import LibrarySettings from './LibrarySettings.js';
import LifeSettings from './LifeSettings.js';
import { fmtNum } from '../lib/format.js';

const fmtSize = (n: number): string => (n > 1_048_576 ? `${fmtNum(n / 1_048_576)} MB` : `${fmtNum(n / 1024, 0)} KB`);
const ENT: Record<string, string> = { semesters: 'الفصول', courses: 'المواد', assessments: 'التقييمات', notes: 'الملاحظات' };

function DiffView({ diff }: { diff: DiffResult }) {
  const keys = ['semesters', 'courses', 'assessments', 'notes'] as const;
  return (
    <div className="diff" aria-label="معاينة الفروقات">
      <div className="row" style={{ marginBlockEnd: 'var(--s-3)' }}>
        <Badge tone="ok">+{diff.totals.added} جديد</Badge>
        <Badge tone="warn">~{diff.totals.changed} معدّل</Badge>
        <Badge tone="danger">−{diff.totals.removed} غير موجود في الملف</Badge>
        <Badge>{diff.totals.unchanged} بلا تغيير</Badge>
      </div>
      {keys.map((k) => {
        const d: EntityDiff = diff[k];
        if (!d.added.length && !d.changed.length && !d.removed.length) return null;
        return (
          <details key={k} open={d.added.length + d.changed.length + d.removed.length < 12}>
            <summary><strong>{ENT[k]}</strong> — +{d.added.length} · ~{d.changed.length} · −{d.removed.length}</summary>
            <ul className="plain diff-list">
              {d.added.map((x) => (<li key={x.id} className="add">+ <bdi>{x.label}</bdi></li>))}
              {d.changed.map((x) => (<li key={x.id} className="chg">~ <bdi>{x.label}</bdi> <small className="muted">({x.fields.map((f) => f.field).join('، ')})</small></li>))}
              {d.removed.map((x) => (<li key={x.id} className="rem">− <bdi>{x.label}</bdi></li>))}
            </ul>
          </details>
        );
      })}
    </div>
  );
}

export default function Settings() {
  const { toast, confirm, reloadSemesters } = useApp();
  const [info, setInfo] = useState<Info | null>(null);
  const [backups, setBackups] = useState<BackupInfo[] | null>(null);
  const [file, setFile] = useState<{ name: string; json: unknown } | null>(null);
  const [diff, setDiff] = useState<DiffResult | null>(null);
  const [mode, setMode] = useState<'merge' | 'replace'>('merge');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);

  const load = (): void => {
    api.info().then(setInfo).catch(() => undefined);
    api.backups().then(setBackups).catch(() => setBackups([]));
  };
  useEffect(load, []);
  const [tab, setTab] = useUrlParam<'general' | 'data' | 'sources'>('tab', 'general', ['general', 'data', 'sources']);
  useEffect(() => {
    if (location.hash) document.getElementById(location.hash.slice(1))?.scrollIntoView({ block: 'start' });
  }, [tab]);

  const doExport = async (): Promise<void> => {
    const res = await fetch('/api/export');
    const blob = await res.blob();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `platform-export-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    toast('تم تنزيل ملف التصدير', { kind: 'ok' });
  };

  const pick = async (f: File | undefined): Promise<void> => {
    setErr(null);
    setDiff(null);
    setFile(null);
    if (!f) return;
    try {
      const json: unknown = JSON.parse(await f.text());
      setFile({ name: f.name, json });
      const r = await api.importPreview(json);
      setDiff(r.diff);
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : 'الملف ليس JSON صالحًا');
    }
  };
  const apply = async (): Promise<void> => {
    if (!file) return;
    if (mode === 'replace') {
      const ok = await confirm({ title: 'استبدال كل البيانات؟', body: <p>سيُستبدل كل ما في القاعدة بمحتوى الملف. تُحفظ نسخة احتياطية تلقائية قبل التنفيذ.</p>, confirmLabel: 'استبدال', danger: true });
      if (!ok) return;
    }
    setBusy(true);
    try {
      const r = await api.importApply(file.json, mode);
      toast(`تم الاستيراد (نسخة احتياطية: ${r.backup})`, { kind: 'ok' });
      setFile(null);
      setDiff(null);
      if (input.current) input.current.value = '';
      await reloadSemesters();
      load();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const backupNow = async (): Promise<void> => {
    try {
      const b = await api.backupNow();
      toast(`نسخة احتياطية: ${b.name}`, { kind: 'ok' });
      load();
    } catch (e) {
      toast((e as Error).message, { kind: 'error' });
    }
  };
  const restore = async (b: BackupInfo): Promise<void> => {
    const ok = await confirm({ title: `استعادة نسخة ${b.date}؟`, body: <p>ستحل محل البيانات الحالية. تُحفظ نسخة أمان قبل الاستعادة.</p>, confirmLabel: 'استعادة', danger: true });
    if (!ok) return;
    try {
      const r = await api.restore(b.name);
      toast(`تمت الاستعادة (نسخة الأمان: ${r.safety_backup})`, { kind: 'ok' });
      await reloadSemesters();
      load();
    } catch (e) {
      toast((e as Error).message, { kind: 'error' });
    }
  };

  return (
    <div className="page">
      <PageHead title="الإعدادات" icon="sliders" sub="مدخل واحد لكل الإعدادات: المظهر والتنبيهات، البيانات والنسخ، ومصادر المكتبة والحياة." />
      <nav className="tabs page-tabs" aria-label="أقسام الإعدادات" style={{ marginBlockEnd: 'var(--s-5)' }}>
        {([['general', 'عام'], ['data', 'البيانات والنسخ'], ['sources', 'المصادر']] as const).map(([id, label]) => (
          <button key={id} type="button" className="tab" aria-current={tab === id ? 'page' : undefined} onClick={() => setTab(id)}>{label}</button>
        ))}
      </nav>
      {tab === 'general' ? (
        <div className="grid cols-2 stagger" style={{ alignItems: 'start' }}>
          <div className="stack">
          <AppearanceCard />
          <NotifyCard />
          </div>
          <div className="stack">
            <FlagsCard />
          <Card>
            <CardHead title="معلومات النظام" icon="info" />
            {info ? (
              <dl className="kv">
                <dt>الإصدار</dt><dd className="num">{info.version}</dd>
                <dt>المحرّك</dt><dd dir="ltr" className="num">{info.driver}</dd>
                <dt>الخادم</dt><dd dir="ltr" className="num">{info.host}:{info.port}</dd>
                <dt>ملف البيانات</dt><dd dir="ltr" style={{ overflowWrap: 'anywhere' }}>{info.db_file}</dd>
                <dt>الحجم</dt><dd className="num">{fmtSize(info.db_size)}</dd>
              </dl>
            ) : <Skeleton h={90} />}
            <div className="callout ok" style={{ marginBlockStart: 'var(--s-4)' }}><Icon name="shield" size={18} /><span>الخادم يعمل على <b dir="ltr">127.0.0.1</b> فقط — لا يمكن الوصول إليه من الشبكة، ولا يتصل بالإنترنت.</span></div>
          </Card>
          </div>
        </div>
      ) : tab === 'data' ? (
        <div className="grid cols-2 stagger" style={{ alignItems: 'start' }}>
          <div className="stack">
            <Card>
              <CardHead title="ماذا يشمل كل خيار؟" icon="info" />
              <ul className="plain stack" style={{ gap: 'var(--s-2)' }}>
                <li><strong>التصدير/الاستيراد:</strong> الدراسة فقط (الفصول والمواد والتقييمات والملاحظات).</li>
                <li><strong>النسخ الاحتياطية:</strong> قاعدة البيانات كاملة (الدراسة، بيانات المكتبة، تمريني، المطبخ: الأسعار والسلة والمخزن والمحفظة).</li>
                <li><strong>في المتصفح فقط:</strong> ملاحظة المراجعة الأسبوعية، المظهر، «زرتَه مؤخرًا» — لا تدخل أيًا مما سبق.</li>
              </ul>
            </Card>
          <Card>
            <CardHead title="تصدير" icon="download" />
            <p className="muted" style={{ marginBlockEnd: 'var(--s-3)' }}>ملف JSON واحد فيه كل الفصول والمواد والتقييمات والملاحظات.</p>
            <Button icon="download" onClick={() => void doExport()}>تنزيل ملف التصدير</Button>
          </Card>
          <Card>
            <CardHead title="استيراد" icon="upload" />
            <p className="muted" style={{ marginBlockEnd: 'var(--s-3)' }}>اختر ملف تصدير سابق. سترى الفروقات قبل أي تغيير.</p>
            <input ref={input} type="file" accept="application/json,.json" className="input" aria-label="ملف الاستيراد" onChange={(e) => void pick(e.target.files?.[0])} />
            {err && <div className="callout danger" role="alert" style={{ marginBlockStart: 'var(--s-3)' }}>{err}</div>}
            {diff && file && (
              <div style={{ marginBlockStart: 'var(--s-4)' }}>
                <DiffView diff={diff} />
                <div className="row" style={{ marginBlock: 'var(--s-4)' }}>
                  <Segmented<'merge' | 'replace'> label="طريقة الاستيراد" value={mode} onChange={setMode} options={[{ value: 'merge', label: 'دمج (آمن)' }, { value: 'replace', label: 'استبدال الكل' }]} />
                </div>
                <Button variant="primary" disabled={busy || (mode === 'merge' && diff.totals.added + diff.totals.changed === 0)} onClick={() => void apply()}>{busy ? 'جارٍ التنفيذ…' : 'تطبيق الاستيراد'}</Button>
              </div>
            )}
          </Card>
          </div>
          <div className="stack">
          <Card>
            <CardHead title="النسخ الاحتياطية" icon="database"><Button size="sm" icon="plus" onClick={() => void backupNow()}>نسخة الآن</Button></CardHead>
            <p className="muted" style={{ marginBlockEnd: 'var(--s-3)' }}>تُؤخذ نسخة تلقائية يوميًا عند تشغيل المنصة (تُحفظ آخر 14).</p>
            {backups === null ? <Skeleton h={80} /> : backups.length === 0 ? <EmptyState icon="database" title="لا نسخ بعد" /> : (
              <ul className="plain">
                {backups.map((b) => (
                  <li key={b.name} className="un-item"><span><strong className="num" dir="ltr">{b.name}</strong><br /><small className="muted num">{fmtSize(b.size)}</small></span><Button size="sm" onClick={() => void restore(b)}>استعادة</Button></li>
                ))}
              </ul>
            )}
          </Card>
          </div>
        </div>
      ) : (
        <div className="stack" style={{ gap: 'var(--s-6)' }}>
          <section aria-label="مصدر المكتبة"><h2 className="h3" style={{ marginBlockEnd: 'var(--s-3)' }}>المكتبة</h2><LibrarySettings embedded /></section>
          <section aria-label="مصدر الحياة"><h2 className="h3" style={{ marginBlockEnd: 'var(--s-3)' }}>الحياة (صادرات راشد)</h2><LifeSettings embedded /></section>
        </div>
      )}
    </div>
  );
}
