/** صفوف جدول الأعمال الموحّد (تقييمات + عناصر المساحات + تماريني) — مستخدمة في اليوم/الأسبوع/كل شيء. */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../lib/icons.js';
import { api } from '../lib/api.js';
import { wos, type AgendaEntry, type Space } from '../lib/wos.js';
import { useApp } from '../core/app-context.js';
import { cx } from '../ui/ui.js';
import { fmtDateShort } from '../lib/format.js';

export const dayMs = (iso: string): number => Date.parse(`${iso}T00:00:00`);
export function localToday(): string {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}
export const addDays = (iso: string, n: number): string => new Date(Date.parse(iso) + n * 86_400_000).toISOString().slice(0, 10);

export function relDay(iso: string, today: string): string {
  const d = Math.round((Date.parse(iso) - Date.parse(today)) / 86_400_000);
  if (d === 0) return 'اليوم';
  if (d === 1) return 'غدًا';
  if (d === -1) return 'أمس';
  if (d < 0) return `متأخر ${-d} يوم`;
  if (d < 7) return `بعد ${d} أيام`;
  return fmtDateShort(dayMs(iso));
}

const KIND_ICON = { assessment: 'target', item: 'check', workout: 'dumbbell' } as const;
const KIND_LABEL = { assessment: 'تقييم', item: 'عنصر', workout: 'تمرين' } as const;

/** تبديل «منجز» لأي صف (تقييم أو عنصر) */
export async function toggleDone(e: AgendaEntry, spaces: Space[] | null): Promise<string> {
  const id = e.ref.split(':').pop()!;
  if (e.kind === 'assessment') {
    await api.editAssessment(id, { status: e.done ? 'pending' : 'submitted' });
    return e.done ? 'أُعيد إلى «قادم»' : 'تم التسليم ✓';
  }
  if (e.kind === 'item') {
    const sp = spaces?.find((s) => s.id === e.space_id);
    const st = sp?.type.statuses.find((x) => x.category === (e.done ? 'todo' : 'done')) ?? sp?.type.statuses[0];
    if (!st) throw new Error('لا توجد حالة مناسبة في هذه المساحة');
    await wos.editItem(id, { status: st.id });
    return e.done ? 'أُعيد فتحه' : 'منجز ✓';
  }
  throw new Error('غير قابل للتعليم');
}

export function AgendaRow({ e, today, onChanged, compact }: { e: AgendaEntry; today: string; onChanged?: () => void; compact?: boolean }) {
  const { spaces, toast } = useApp();
  const [busy, setBusy] = useState(false);
  const late = !e.done && e.date !== null && e.date < today;
  const canToggle = e.kind !== 'workout';
  return (
    <li className={cx('ag-row', e.done && 'done', late && 'late')} style={{ '--c': e.color } as never}>
      {canToggle ? (
        <button
          type="button"
          className="ag-check"
          aria-pressed={e.done}
          aria-label={e.done ? `إلغاء إنجاز «${e.title}»` : `تعليم «${e.title}» كمنجز`}
          disabled={busy}
          onClick={() => {
            setBusy(true);
            toggleDone(e, spaces)
              .then((m) => {
                toast(`«${e.title}»: ${m}`, { kind: 'ok' });
                onChanged?.();
              })
              .catch((x: Error) => toast(x.message, { kind: 'error' }))
              .finally(() => setBusy(false));
          }}
        >
          {e.done && <Icon name="check" size={14} />}
        </button>
      ) : (
        <span className="ag-ico" aria-hidden="true"><Icon name={KIND_ICON[e.kind]} size={15} /></span>
      )}
      <Link to={e.to} className="ag-main">
        <span className="ag-title"><bdi>{e.title}</bdi></span>
        <small><span className="sr-only">{KIND_LABEL[e.kind]}: </span><bdi>{e.subtitle}</bdi>{e.status_label && !compact ? ` · ${e.status_label}` : ''}</small>
      </Link>
      {e.date && (
        <span className={cx('ag-when', late && 'late')} title={e.approx ? 'تاريخ تقريبي (نهاية الأسبوع/فترة الامتحانات) — الموعد الدقيق غير معروف' : undefined}>
          {relDay(e.date, today)}{e.approx ? ' ≈' : ''}
        </span>
      )}
    </li>
  );
}

export function AgendaList({ entries, today, onChanged, empty, compact }: { entries: AgendaEntry[]; today: string; onChanged?: () => void; empty?: string; compact?: boolean }) {
  if (!entries.length) return <p className="muted" style={{ margin: 0 }}>{empty ?? 'لا شيء هنا.'}</p>;
  return (
    <ul className="ag-list">
      {entries.map((e) => (
        <AgendaRow key={`${e.ref}-${e.date ?? ''}`} e={e} today={today} onChanged={onChanged} compact={compact} />
      ))}
    </ul>
  );
}
