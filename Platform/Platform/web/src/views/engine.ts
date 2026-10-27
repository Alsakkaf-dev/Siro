/** محرك العروض: العرض = استعلام محفوظ (مرشحات + ترتيب + تجميع) فوق عناصر المساحة (ADR-0003). */
import { matchFilter, sortItems, valueText, type FieldDef, type ViewConfig, type WosItem, type WosType } from '../../../shared/wos.js';

export interface Group { key: string; label: string; color?: string; items: WosItem[] }

export function applyView(items: WosItem[], type: WosType, cfg: ViewConfig, q = ''): WosItem[] {
  const ql = q.trim().toLowerCase();
  let out = items.filter((i) => !i.parent_id);
  if (!cfg.showDone) out = out.filter((i) => !i.done_at);
  for (const f of cfg.filters ?? []) out = out.filter((i) => matchFilter(i, f, type));
  if (ql) out = out.filter((i) => `${i.title} ${type.fields.map((f) => valueText(f, i.computed?.[f.id] ?? i.data[f.id])).join(' ')}`.toLowerCase().includes(ql));
  return sortItems(out, cfg.sort ?? null, type);
}

/** حقول قابلة للتجميع: الحالة + اختيار واحد + مربع اختيار */
export function groupableFields(type: WosType): { id: string; name: string }[] {
  return [{ id: 'status', name: 'الحالة' }, ...type.fields.filter((f) => f.kind === 'select' || f.kind === 'checkbox' || f.kind === 'rating').map((f) => ({ id: f.id, name: f.name }))];
}

export function groupItems(items: WosItem[], type: WosType, by: string | null | undefined): Group[] {
  if (!by) return [{ key: '_all', label: 'الكل', items }];
  if (by === 'status') {
    const gs: Group[] = type.statuses.map((s) => ({ key: s.id, label: s.name, color: s.color, items: items.filter((i) => i.status === s.id) }));
    const orphan = items.filter((i) => !type.statuses.some((s) => s.id === i.status));
    return orphan.length ? [...gs, { key: '_none', label: 'بلا حالة', items: orphan }] : gs;
  }
  const f = type.fields.find((x) => x.id === by);
  if (!f) return [{ key: '_all', label: 'الكل', items }];
  if (f.kind === 'select') {
    const gs: Group[] = (f.options ?? []).map((o) => ({ key: o.id, label: o.name, ...(o.color ? { color: o.color } : {}), items: items.filter((i) => i.data[f.id] === o.id) }));
    return [...gs, { key: '_none', label: `بلا ${f.name}`, items: items.filter((i) => !i.data[f.id]) }];
  }
  if (f.kind === 'checkbox') return [{ key: 'true', label: 'نعم', items: items.filter((i) => i.data[f.id] === true) }, { key: 'false', label: 'لا', items: items.filter((i) => i.data[f.id] !== true) }];
  const vals = [5, 4, 3, 2, 1, 0];
  return vals.map((v) => ({ key: String(v), label: '★'.repeat(v) || 'بلا تقييم', items: items.filter((i) => Number(i.data[f.id] ?? 0) === v) }));
}

/** القيمة التي تُكتب عند نقل بطاقة إلى مجموعة */
export function patchForGroup(by: string, key: string, field?: FieldDef): { status?: string; data?: Record<string, unknown> } {
  if (by === 'status') return { status: key };
  if (!field) return {};
  if (key === '_none') return { data: { [field.id]: null } };
  if (field.kind === 'checkbox') return { data: { [field.id]: key === 'true' } };
  if (field.kind === 'rating') return { data: { [field.id]: Number(key) } };
  return { data: { [field.id]: key } };
}

/** حقل التاريخ للتقويم/الخط الزمني */
export function dateOf(i: WosItem, dateField: string | null | undefined): string | null {
  const f = dateField ?? 'due';
  if (f === 'due') return i.due;
  if (f === 'start') return i.start;
  const v = i.data[f];
  if (typeof v === 'string') return v;
  if (v && typeof v === 'object' && !Array.isArray(v)) return v.start ?? v.end ?? null;
  return null;
}

export function dateFields(type: WosType): { id: string; name: string }[] {
  return [{ id: 'due', name: 'الموعد' }, { id: 'start', name: 'البداية' }, ...type.fields.filter((f) => f.kind === 'date' || f.kind === 'daterange').map((f) => ({ id: f.id, name: f.name }))];
}
