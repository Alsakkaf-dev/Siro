import '../styles/life.css';
import { Link } from 'react-router-dom';
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { life, type LifeBundle } from '../lib/api.js';
import { Icon, type IconName } from '../lib/icons.js';
import { Badge, Button, Card, CardHead, EmptyState, Skeleton, TrustTag, Unknown } from '../ui/ui.js';
import { PageHead } from '../ui/page.js';
import { fieldLabel, type FieldLabelsDoc } from '../../../shared/labels.js';
import { missingTitle, plainText, UNIT_AR } from '../../../shared/plain.js';
import { kgText, countMissing, missingInputs, type Conf, type LifeFile, type LifeFileStatus, type LifeStatus } from '../../../shared/life.js';
import { Term } from '../glossary/glossary.js';

/* ───── الثقة والأرقام ───── */
export function trustKind(c: Conf): 'proven' | 'calc' | 'assumed' | null {
  return c === 'مثبت' ? 'proven' : c === 'محسوب' ? 'calc' : c === 'افتراض' ? 'assumed' : null;
}
/** وسم ثقة النظام (مثبت / محسوب / افتراض) كما هو؛ لا وسم إن لم تُذكر الثقة. */
const CONF_TERM: Record<string, string> = { 'مثبت': 'conf_confirmed', 'محسوب': 'conf_computed', 'افتراض': 'conf_assumption' };
export function Conf({ c }: { c: Conf }) {
  const k = trustKind(c);
  return k ? <Term id={CONF_TERM[c as string] ?? ''} bare><TrustTag kind={k} /></Term> : null;
}
const nf2 = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const money = (n: number | null | undefined): string => (typeof n === 'number' ? `RM ${nf2.format(n)}` : '—');
export const num2 = (n: number): string => nf2.format(n);
/** كغ بدقة النظام (حتى منزلتين) — انظر kgText. */
export const num1 = kgText;
export function Money({ v, c }: { v: number | null | undefined; c?: Conf }) {
  return typeof v === 'number' ? (
    <>
      <bdi className="num">{money(v)}</bdi> <Conf c={c} />
    </>
  ) : (
    <Unknown />
  );
}
const dfDay = new Intl.DateTimeFormat('ar', { day: 'numeric', month: 'short', numberingSystem: 'latn', timeZone: 'Asia/Kuala_Lumpur' });
const dfFull = new Intl.DateTimeFormat('ar', { day: 'numeric', month: 'short', year: 'numeric', numberingSystem: 'latn', timeZone: 'Asia/Kuala_Lumpur' });
const dfTime = new Intl.DateTimeFormat('ar', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', numberingSystem: 'latn', timeZone: 'Asia/Kuala_Lumpur' });
const parse = (s: string): number => Date.parse(s.length === 10 ? `${s}T12:00:00+08:00` : s);
export const fmtDay = (s: string | null | undefined): string => (s && Number.isFinite(parse(s)) ? dfDay.format(parse(s)) : '—');
export const fmtDayFull = (s: string | null | undefined): string => (s && Number.isFinite(parse(s)) ? dfFull.format(parse(s)) : '—');
export const fmtAt = (s: string | null | undefined): string => (s && Number.isFinite(parse(s)) ? dfTime.format(parse(s)) : '—');

/* ───── تحميل البيانات ───── */
export interface LifeData {
  status: LifeStatus | null;
  files: Partial<Record<LifeFile, unknown>>;
  loading: boolean;
  error: string | null;
  reload: () => void;
  get: <T,>(n: LifeFile) => T | null;
  file: (n: LifeFile) => LifeFileStatus | undefined;
}
/** يقرأ الملفات المطلوبة (قراءة فقط) ويعيد القراءة كل دقيقة وعند العودة للنافذة. */
export function useLife(names: LifeFile[]): LifeData {
  const key = names.join(',');
  const [b, setB] = useState<LifeBundle | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [n, setN] = useState(0);
  useEffect(() => {
    let live = true;
    life
      .bundle(key.split(',') as LifeFile[])
      .then((r) => {
        if (live) {
          setB(r);
          setError(null);
        }
      })
      .catch((e: Error) => live && setError(e.message));
    return () => {
      live = false;
    };
  }, [key, n]);
  useEffect(() => {
    const t = window.setInterval(() => setN((x) => x + 1), 60_000);
    const f = (): void => {
      if (document.visibilityState === 'visible') setN((x) => x + 1);
    };
    document.addEventListener('visibilitychange', f);
    return () => {
      window.clearInterval(t);
      document.removeEventListener('visibilitychange', f);
    };
  }, []);
  const reload = useCallback(() => setN((x) => x + 1), []);
  return useMemo<LifeData>(
    () => ({
      status: b?.status ?? null,
      files: b?.files ?? {},
      loading: !b && !error,
      error,
      reload,
      get: <T,>(name: LifeFile): T | null => ((b?.files[name] as T | null | undefined) ?? null),
      file: (name) => b?.status.files.find((f) => f.name === name),
    }),
    [b, error, reload],
  );
}

/** هيكل صفحة الحياة: عنوان + حالة تحميل/خطأ، ثم المحتوى. */
export function LifePage({ title, icon, sub, names, data, actions, crumbs, children }: { title: string; icon: IconName; sub?: ReactNode; names: LifeFile[]; data: LifeData; actions?: ReactNode; crumbs?: { to?: string; label: string }[]; children: ReactNode }) {
  const head = <PageHead title={title} icon={icon} sub={sub} actions={actions} crumbs={crumbs} />;
  if (data.loading) return <div className="page">{head}<div className="stack"><Skeleton h={90} r={16} /><Skeleton h={260} r={16} /></div></div>;
  if (data.error || !data.status) return <div className="page">{head}<EmptyState icon="warn" title="تعذّر الاتصال بالخادم" text={data.error ?? 'حاول مجددًا.'} action={<Button onClick={data.reload}>إعادة المحاولة</Button>} /></div>;
  const have = names.some((n) => data.files[n] != null);
  return (
    <div className="page life-page">
      {head}
      {have ? <div className="stack life-stack">{children}</div> : <EmptyState icon="database" title="لا توجد بيانات بعد" text="ابدأ بالتسجيل لتظهر هنا." action={<Button to="/life/log" icon="edit">سجّل الآن</Button>} />}
    </div>
  );
}

/* ───── مكوّنات عرض ───── */
export function Kpi({ label, value, sub, tone, icon }: { label: ReactNode; value: ReactNode; sub?: ReactNode; tone?: string; icon?: IconName }) {
  return (
    <div className="kpi" style={tone ? ({ '--c': tone } as CSSProperties) : undefined}>
      <span className="kpi-l">{icon && <Icon name={icon} size={15} />} {label}</span>
      <strong className="kpi-v num">{value}</strong>
      {sub && <span className="kpi-s">{sub}</span>}
    </div>
  );
}
export function Note({ children, tone = 'info' }: { children: ReactNode; tone?: 'info' | 'warn' }) {
  return (
    <p className={`life-note ${tone}`}>
      <Icon name={tone === 'warn' ? 'warn' : 'info'} size={15} /> <span>{children}</span>
    </p>
  );
}
export const SectionCard = Card;

/* ───── مخطط خطي متعدد السلاسل ───── */
export interface LinePt { t: number; v: number | null }
export interface LineSeries { key: string; name: string; color: string; points: LinePt[] }
/** مخطط خطي يقرأ من اليمين (الأقدم) إلى اليسار (الأحدث) كباقي مخططات الموقع. القيم الفارغة (null) تقطع الخط ولا تُصفَّر. */
export function LineChart({ series, height = 220, fmt = (v: number) => nf2.format(v), ariaLabel, dateFmt = fmtDay, fitY = false }: { fitY?: boolean; series: LineSeries[]; height?: number; fmt?: (v: number) => string; ariaLabel: string; dateFmt?: (s: string) => string }) {
  const W = 600;
  const H = height;
  const padX = 34;
  const padY = 22;
  const all = series.flatMap((s) => s.points.filter((p): p is { t: number; v: number } => p.v !== null));
  const ts = [...new Set(series.flatMap((s) => s.points.map((p) => p.t)))].sort((a, b) => a - b);
  const [hover, setHover] = useState<number | null>(null);
  if (!all.length) return <p className="muted">لا توجد قيم لرسمها.</p>;
  const t0 = ts[0]!;
  const t1 = ts[ts.length - 1]!;
  const vmin = Math.min(...all.map((p) => p.v));
  const vmax = Math.max(...all.map((p) => p.v));
  const padV = fitY ? Math.max((vmax - vmin) * 0.25, 0.5) : 0;
  const lo = fitY ? vmin - padV : Math.min(0, vmin);
  const hi = fitY ? vmax + padV : vmax;
  const span = hi - lo || 1;
  const x = (t: number): number => (t1 === t0 ? W / 2 : W - padX - ((t - t0) / (t1 - t0)) * (W - 2 * padX));
  const y = (v: number): number => H - padY - ((v - lo) / span) * (H - 2 * padY);
  const hoverT = hover !== null ? ts[hover] : undefined;
  const iso = (t: number): string => new Date(t).toISOString();
  return (
    <div className="linechart">
      <div className="lc-wrap" style={{ height }}>
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label={ariaLabel} onMouseLeave={() => setHover(null)}>
          {[0, 0.5, 1].map((g) => (
            <line key={g} x1={padX} x2={W - padX} y1={H - padY - g * (H - 2 * padY)} y2={H - padY - g * (H - 2 * padY)} stroke="var(--border)" strokeDasharray="3 5" />
          ))}
          {series.map((s) => {
            const segs: string[] = [];
            let cur = '';
            for (const p of [...s.points].sort((a, b) => a.t - b.t)) {
              if (p.v === null) {
                if (cur) segs.push(cur);
                cur = '';
              } else cur += `${cur ? 'L' : 'M'}${x(p.t).toFixed(1)} ${y(p.v).toFixed(1)}`;
            }
            if (cur) segs.push(cur);
            return (
              <g key={s.key}>
                {segs.map((d, i) => (
                  <path key={i} d={d} fill="none" stroke={s.color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
                ))}
              </g>
            );
          })}
          {hoverT !== undefined && <line x1={x(hoverT)} x2={x(hoverT)} y1={8} y2={H - padY} stroke="var(--text-3)" strokeDasharray="3 4" vectorEffect="non-scaling-stroke" />}
          {ts.map((t, i) => (
            <rect key={t} x={x(t) - (W - 2 * padX) / Math.max(1, ts.length - 1) / 2} y={0} width={(W - 2 * padX) / Math.max(1, ts.length - 1)} height={H} fill="transparent" onMouseEnter={() => setHover(i)} />
          ))}
        </svg>
        <span className="lc-y" style={{ top: `${(y(hi) / H) * 100}%` }}>{fmt(hi)}</span>
        <span className="lc-y" style={{ top: `${(y(lo) / H) * 100}%` }}>{fmt(lo)}</span>
        {/* النقاط كعناصر HTML كي لا تتشوّه مع preserveAspectRatio=none */}
        {series.flatMap((s) => s.points.filter((p) => p.v !== null).map((p) => <i key={s.key + p.t} className={`lc-dot ${hoverT === p.t ? 'on' : ''}`} style={{ insetInlineStart: `${(x(p.t) / W) * 100}%`, top: `${(y(p.v as number) / H) * 100}%`, borderColor: s.color }} />))}
        {hoverT !== undefined && (
          <span className="lc-tip" style={{ insetInlineStart: `${(x(hoverT) / W) * 100}%` }}>
            <b>{dateFmt(iso(hoverT))}</b>
            {series.map((s) => {
              const p = s.points.filter((q) => q.t === hoverT).at(-1);
              return p && p.v !== null ? (
                <span key={s.key}>
                  <i className="dot" style={{ background: s.color }} /> {s.name}: <bdi className="num">{fmt(p.v)}</bdi>
                </span>
              ) : null;
            })}
          </span>
        )}
      </div>
      <div className="lc-x" aria-hidden="true">
        <span>{dateFmt(iso(t0))}</span>
        {t1 !== t0 && <span>{dateFmt(iso(t1))}</span>}
      </div>
      <div className="legend">
        {series.map((s) => (
          <span key={s.key}>
            <i className="dot" style={{ background: s.color }} /> {s.name}
          </span>
        ))}
      </div>
      <div className="sr-only"><table>
        <caption>{ariaLabel}</caption>
        <thead>
          <tr>
            <th>التاريخ</th>
            {series.map((s) => (
              <th key={s.key}>{s.name}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ts.map((t) => (
            <tr key={t}>
              <td>{dateFmt(iso(t))}</td>
              {series.map((s) => {
                const p = s.points.filter((q) => q.t === t).at(-1);
                return <td key={s.key}>{p && p.v !== null ? fmt(p.v) : 'غير معروف'}</td>;
              })}
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
}

/** غلاف جدول عريض: قابل للتمرير بلوحة المفاتيح (a11y). */
export function TblWrap({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="life-tbl-wrap" role="region" aria-label={label} tabIndex={0}>
      {children}
    </div>
  );
}

export function PageLinks({ items }: { items: { to: string; label: string; icon: IconName; sub?: string }[] }) {
  return (
    <div className="grid auto life-links">
      {items.map((i) => (
        <Link key={i.to} to={i.to} className="life-link">
          <span className="pc-ico" style={{ '--c': 'var(--life)' } as CSSProperties}><Icon name={i.icon} size={20} /></span>
          <span><b>{i.label}</b>{i.sub && <small>{i.sub}</small>}</span>
        </Link>
      ))}
    </div>
  );
}

/** بطاقات «بيانات ناقصة»: كل حقل قيمته null عندك يظهر كما هو مع ملاحظته، ولا تُملأ قيمته أبدًا. */
let labelsP: Promise<FieldLabelsDoc | null> | null = null;
/** أسماء عربية للمفاتيح التقنية من FIELD_LABELS_AR.json (تُجلب مرة واحدة). */
export function useFieldLabels(): FieldLabelsDoc | null {
  const [d, setD] = useState<FieldLabelsDoc | null>(null);
  useEffect(() => {
    let live = true;
    labelsP ??= life.content<FieldLabelsDoc>('FIELD_LABELS_AR.json').then((r) => r.data).catch(() => { labelsP = null; return null; });
    void labelsP.then((x) => live && setD(x));
    return () => { live = false; };
  }, []);
  return d;
}
export function MissingInputsCards({ title, data, fallbackTitle = 'بيانات ناقصة' }: { title?: string; data: unknown; fallbackTitle?: string }) {
  const items = useMemo(() => missingInputs(data), [data]);
  const labels = useFieldLabels();
  if (!items.length) return null;
  const n = countMissing(items);
  return (
    <Card>
      <CardHead title={fallbackTitle} icon="help" info="هذه حقول فارغة حتى تسجّل قيمتها. فارغ ≠ صفر، ولا نخمّن القيمة هنا.">
        <Badge tone={n ? 'warn' : 'ok'}>{n ? `${n} غير مسجّل` : 'مسجّلة كلها'}</Badge>
      </CardHead>
      {title && <p className="muted missing-title">{title}</p>}
      <ul className="missing-grid">
        {items.map((i) => (
          <li key={i.key} className={`missing-card ${i.value === null || i.value === undefined ? 'empty' : ''}`}>
            <span className="missing-key">{fieldLabel(labels, i.key) ?? missingTitle(i.key, i.note, i.label)}</span>
            <div className="missing-val">
              {i.value === null || i.value === undefined ? <Unknown /> : <b className="num">{String(i.value)}{i.unit ? ` ${UNIT_AR[i.unit] ?? i.unit}` : ''}</b>}
              {i.unit && (i.value === null || i.value === undefined) && <small className="muted">الوحدة: {UNIT_AR[i.unit] ?? i.unit}</small>}
            </div>
            {i.note && <p className="missing-note">{i.note}</p>}
            <p className="missing-meta">
              {i.confidence && (i.confidence === 'غير مسجل' ? <Term id="conf_not_recorded" bare><Badge>{i.confidence}</Badge></Term> : <Badge>{i.confidence}</Badge>)}
              </p>
            {i.needed_for && <small className="muted">يلزم لـ: {i.needed_for}</small>}
          </li>
        ))}
      </ul>
    </Card>
  );
}
