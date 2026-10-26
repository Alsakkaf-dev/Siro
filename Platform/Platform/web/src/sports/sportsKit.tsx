import '../styles/sports.css';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { life, sports, type ItemInput } from '../lib/api.js';
import { Icon } from '../lib/icons.js';
import { Badge } from '../ui/ui.js';
import { ageText, FRESH_LABEL, type ContentStatus, type LifeContentName } from '../../../shared/life.js';
import { REGION_AR, regionsOf, WEEKDAYS, type Exercise, type ExercisesDoc, type MyItem, type MyWeek, type PlansDoc, type SafetyReview, type Session } from '../../../shared/sports.js';
import { Term } from '../glossary/glossary.js';

/* ───── تحميل محتوى راشد (قراءة فقط) ───── */
export interface ContentState<T> { data: T | null; status: ContentStatus | null; rootExists: boolean; loading: boolean; error: string | null; reload: () => void }
export function useContent<T>(name: LifeContentName): ContentState<T> {
  const [r, setR] = useState<{ data: T | null; status: ContentStatus; root_exists: boolean } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [n, setN] = useState(0);
  useEffect(() => {
    let live = true;
    life
      .content<T>(name)
      .then((x) => {
        if (live) {
          setR(x);
          setError(null);
        }
      })
      .catch((e: Error) => live && setError(e.message));
    return () => {
      live = false;
    };
  }, [name, n]);
  useEffect(() => {
    const f = (): void => {
      if (document.visibilityState === 'visible') setN((x) => x + 1);
    };
    document.addEventListener('visibilitychange', f);
    return () => document.removeEventListener('visibilitychange', f);
  }, []);
  const reload = useCallback(() => setN((x) => x + 1), []);
  return { data: r?.data ?? null, status: r?.status ?? null, rootExists: r?.root_exists ?? true, loading: !r && !error, error, reload };
}
export const useExercises = (): ContentState<ExercisesDoc> => useContent<ExercisesDoc>('SPORTS_EXERCISES.json');
export const usePlans = (): ContentState<PlansDoc> => useContent<PlansDoc>('SPORTS_PLANS_AR.json');

/* ───── تمريني المحلي ───── */
const EMPTY: MyWeek = { workouts: [], week: Object.fromEntries(WEEKDAYS.map((d) => [d, null])), template: null, location: null };
export function useMine(): { mine: MyWeek; loaded: boolean; error: string | null; set: (w: MyWeek) => void; reload: () => void } {
  const [mine, setMine] = useState<MyWeek>(EMPTY);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [n, setN] = useState(0);
  useEffect(() => {
    let live = true;
    sports
      .mine()
      .then((w) => {
        if (live) {
          setMine(w);
          setLoaded(true);
          setError(null);
        }
      })
      .catch((e: Error) => live && setError(e.message));
    return () => {
      live = false;
    };
  }, [n]);
  return { mine, loaded, error, set: setMine, reload: useCallback(() => setN((x) => x + 1), []) };
}

/* ───── شريط حالة المحتوى ───── */
export function ContentBanner({ status, label, children }: { status: ContentStatus | null; label: string; children?: ReactNode }) {
  if (!status) return null;
  const bad = status.state !== 'fresh' || status.error;
  return (
    <div className={`life-alert ${!bad ? 'info' : status.state === 'stale' || status.state === 'inconsistent' ? 'warn' : 'danger'}`} role="status" hidden={!bad && !children}>
      <Icon name={bad ? 'warn' : 'info'} size={20} />
      <div>
        {bad ? (
          <>
            <strong>{status.error ? `تعذّر قراءة ${label}` : `${label}: ${FRESH_LABEL[status.state]}`}</strong>
            <ul>
              <li>{status.error ?? `${status.age_hours !== null ? ageText(status.age_hours) : 'عمر غير معروف'} — قد يكون راشد حدّث الملف؛ اطلب تحديثًا إن لزم.`}</li>
            </ul>
          </>
        ) : null}
        {children}
      </div>
    </div>
  );
}
export function ConfBadge({ c }: { c: string | undefined }) {
  if (!c) return null;
  const ar = c === 'assumption' ? 'افتراض' : c;
  const id = ({ 'افتراض': 'conf_assumption', 'مثبت': 'conf_confirmed', 'محسوب': 'conf_computed' } as Record<string, string>)[ar];
  const b = <Badge tone={ar === 'افتراض' ? 'warn' : ar === 'مثبت' ? 'ok' : undefined}>{ar}</Badge>;
  return id ? <Term id={id} bare>{b}</Term> : b;
}

/* ───── خريطة الجسم (رسم أصلي بسيط؛ لا صور خارجية ولا محتوى MuscleWiki) ───── */
type Shape = { d: string; mirror?: boolean };
const SH = 'M71 62 Q57 63 54 79 Q54 91 64 93 Q75 87 77 71Z';
const ARM = 'M53 82 Q45 102 47 124 L59 126 Q64 106 63 90Z';
const FORE = 'M46 129 Q41 152 41 174 L52 176 Q57 152 59 130Z';
const CALF = 'M77 244 Q70 266 74 302 L86 304 Q92 268 90 244Z';
const FRONT: Record<string, Shape[]> = {
  shoulders: [{ d: SH, mirror: true }],
  chest: [{ d: 'M79 66 Q91 62 100 66 L100 102 Q88 108 77 98 Q72 82 79 66Z', mirror: true }],
  biceps: [{ d: ARM, mirror: true }],
  forearms: [{ d: FORE, mirror: true }],
  obliques: [{ d: 'M76 102 L87 106 L89 148 L80 146 Q73 126 76 102Z', mirror: true }],
  abs: [{ d: 'M89 106 L111 106 L109 150 Q100 156 91 150Z' }],
  quads: [{ d: 'M74 158 L92 162 L91 232 Q84 240 77 232 Q70 196 74 158Z', mirror: true }],
  adductors: [{ d: 'M93 162 L100 166 L99 214 L92 216Z', mirror: true }],
  calves: [{ d: CALF, mirror: true }],
};
const BACK: Record<string, Shape[]> = {
  upper_back: [{ d: 'M89 78 L111 78 L109 114 L100 120 L91 114Z' }],
  traps: [{ d: 'M86 54 Q100 50 114 54 L112 76 L100 94 L88 76Z' }],
  rear_delts: [{ d: SH, mirror: true }],
  lats: [{ d: 'M77 80 L88 82 L90 120 L81 128 Q72 108 77 80Z', mirror: true }],
  lower_back: [{ d: 'M90 124 L110 124 L111 150 L89 150Z' }],
  triceps: [{ d: ARM, mirror: true }],
  forearms: [{ d: FORE, mirror: true }],
  glutes: [{ d: 'M76 154 Q100 146 124 154 L124 186 Q100 194 76 186Z' }],
  hamstrings: [{ d: 'M76 190 L98 190 L94 238 Q85 245 78 237Z', mirror: true }],
  calves: [{ d: CALF, mirror: true }],
};
const MIRROR = 'matrix(-1 0 0 1 200 0)';

function Figure({ view, active, second, counts, onToggle }: { view: 'front' | 'back'; active: ReadonlySet<string>; second: ReadonlySet<string>; counts: Record<string, number> | undefined; onToggle?: ((id: string) => void) | undefined }) {
  const shapes = view === 'front' ? FRONT : BACK;
  return (
    <svg viewBox="0 0 200 320" className="bodymap-svg" role="img" aria-label={view === 'front' ? 'الجسم من الأمام' : 'الجسم من الخلف'}>
      <circle cx="100" cy="30" r="17" className="bm-neutral" />
      <rect x="92" y="45" width="16" height="12" rx="4" className="bm-neutral" />
      <path d="M80 60 H120 V158 H80Z M76 150 H124 L122 166 H78Z" className="bm-neutral" />
      <ellipse cx="47" cy="184" rx="7" ry="9" className="bm-neutral" />
      <ellipse cx="153" cy="184" rx="7" ry="9" className="bm-neutral" />
      <path d="M80 310 L90 310 L90 318 L74 318Z M110 310 L120 310 L126 318 L110 318Z" className="bm-neutral" />
      {Object.entries(shapes).map(([id, list]) => {
        const on = active.has(id);
        const c = counts?.[id] ?? 0;
        const cls = `bm-region${on ? ' on' : second.has(id) ? ' sec' : ''}${c > 0 ? ' has' : ''}${onToggle ? ' btn' : ''}`;
        return (
          <g key={id} className={cls} onClick={onToggle ? () => onToggle(id) : undefined}>
            <title>{`${REGION_AR[id] ?? id}${counts ? ` — ${c} تمرين` : ''}`}</title>
            {list.map((s, i) => (
              <g key={i}>
                <path d={s.d} />
                {s.mirror && <path d={s.d} transform={MIRROR} />}
              </g>
            ))}
          </g>
        );
      })}
    </svg>
  );
}

/** خريطة تحديد: تُبرز المناطق النشطة، وإن مُرّرت onToggle صارت النقرة تبدّل التحديد. التحديد متاح دائمًا بلوحة المفاتيح من الأزرار المصاحبة. */
export function BodyMap({ active, secondary, counts, onToggle, className }: { active: ReadonlySet<string> | readonly string[]; secondary?: readonly string[]; counts?: Record<string, number>; onToggle?: (id: string) => void; className?: string }) {
  const set = useMemo(() => (active instanceof Set ? (active as ReadonlySet<string>) : new Set(active as readonly string[])), [active]);
  const sec = useMemo(() => new Set(secondary ?? []), [secondary]);
  return (
    <div className={`bodymap ${className ?? ''}`}>
      <figure>
        <Figure view="front" active={set} second={sec} counts={counts} onToggle={onToggle} />
        <figcaption>أمام</figcaption>
      </figure>
      <figure>
        <Figure view="back" active={set} second={sec} counts={counts} onToggle={onToggle} />
        <figcaption>خلف</figcaption>
      </figure>
    </div>
  );
}

/* ───── أدوات ───── */
/** تطبيع للبحث: إزالة التشكيل وتوحيد الألف والياء والتاء المربوطة وحروف الإنجليزية الصغيرة. */
export const norm = (s: string): string =>
  s
    .normalize('NFKD')
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
    .replace(/[إأآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .toLowerCase()
    .trim();

export const toInput = (i: MyItem): ItemInput => ({ exercise_id: i.exercise_id, en_name: i.en_name, ar_name: i.ar_name, sets: i.sets, reps_min: i.reps_min, reps_max: i.reps_max, duration_s: i.duration_s, per_side: i.per_side, note: i.note });

/** يضيف تمرينًا إلى تمرين محفوظ (أو ينشئ تمرينًا جديدًا إن لم يُمرَّر معرّف). */
export async function addExerciseTo(mine: MyWeek, workoutId: string | null, name: string, ex: Pick<Exercise, 'id' | 'english_name' | 'arabic_name'>, defaults: Partial<ItemInput> = {}): Promise<MyWeek> {
  const item: ItemInput = { exercise_id: ex.id, en_name: ex.english_name, ar_name: ex.arabic_name, sets: 3, reps_min: 10, reps_max: 12, ...defaults };
  if (workoutId === null) await sports.create({ name, items: [item] });
  else {
    const w = mine.workouts.find((x) => x.id === workoutId);
    await sports.setItems(workoutId, [...(w?.items ?? []).map(toInput), item]);
  }
  return sports.mine();
}

export function sessionRegions(s: Session, byId: Map<string, Exercise>): string[] {
  const out = new Set<string>();
  for (const se of s.exercises ?? []) {
    const e = byId.get(se.exercise_id);
    if (e) regionsOf(e.main_muscle_ar).forEach((r) => out.add(r));
  }
  return [...out];
}

export function itemText(i: Pick<MyItem, 'sets' | 'reps_min' | 'reps_max' | 'duration_s' | 'per_side'>): string {
  const p: string[] = [];
  if (i.sets) p.push(`${i.sets} × `);
  if (i.reps_min != null) p.push(i.reps_max != null && i.reps_max !== i.reps_min ? `${i.reps_min}–${i.reps_max} تكرار` : `${i.reps_min} تكرار`);
  if (i.duration_s != null) p.push(`${i.duration_s} ثانية`);
  if (i.per_side) p.push('لكل جهة');
  return p.join(' ').trim();
}

/* ───── الأمان (راشد v6) ───── */
/** false فقط = ليس للمبتدئ. null/غائب = غير مراجَع فلا نفترض شيئًا. */
export const isUnsafe = (e: Pick<Exercise, 'beginner_safe'> | undefined | null): boolean => e?.beginner_safe === false;
export function SafetyBadge({ e, compact }: { e: Pick<Exercise, 'beginner_safe'>; compact?: boolean }) {
  if (e.beginner_safe === false) return <Badge tone="danger">{compact ? 'ليس للمبتدئ' : 'ليس للمبتدئ — تدرّج أولًا'}</Badge>;
  if (e.beginner_safe === true) return <Badge tone="ok">للمبتدئ</Badge>;
  return null;
}
type SafetySource = { safety_review?: SafetyReview } & Partial<Pick<PlansDoc, 'disclaimer_ar' | 'recorded_injuries_ar' | 'recorded_injuries_note_ar' | 'weight_context_ar'>>;
/** إخلاء المسؤولية + الإصابات (غير مسجلة ≠ لا توجد) كما كتبها راشد. يظهر في الرياضة والقوالب وتفاصيل التمرين. */
export function SafetyDisclaimer({ doc, className }: { doc: SafetySource | null | undefined; className?: string }) {
  const r = doc?.safety_review;
  const disclaimer = r?.disclaimer_ar ?? doc?.disclaimer_ar;
  const injuries = r?.recorded_injuries_ar ?? doc?.recorded_injuries_ar;
  const injNote = r?.recorded_injuries_note_ar ?? doc?.recorded_injuries_note_ar;
  const weight = r?.weight_context_ar ?? doc?.weight_context_ar;
  if (!disclaimer && !injuries) return null;
  return (
    <div className={`life-alert warn safety-disc ${className ?? ''}`} role="note">
      <Icon name="shield" size={20} />
      <div>
        {disclaimer && <strong>{disclaimer}</strong>}
        {injuries && (
          <p style={{ margin: '6px 0 0' }}>
            الإصابات المسجلة: <Badge dashed>غير مسجلة</Badge>{' '}
            <small>(كتب راشد «{injuries}»؛ المقصود أنها غير مسجلة وليس أنها غير موجودة)</small>
          </p>
        )}
        {(injNote || weight) && (
          <details className="safety-more" style={{ marginBlockStart: 6 }}>
            <summary>تفاصيل مراجعة الأمان</summary>
            {injNote && <p style={{ margin: '0 0 6px' }}>{injNote}</p>}
            {weight && <p style={{ margin: 0 }}>{weight}</p>}
            {r?.basis_ar && <p className="muted" style={{ margin: '6px 0 0' }}>{r.basis_ar}</p>}
          </details>
        )}
      </div>
    </div>
  );
}
