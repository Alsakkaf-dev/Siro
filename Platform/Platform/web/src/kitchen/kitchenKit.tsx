import '../styles/kitchen.css';
import { useCallback, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../lib/icons.js';
import { useApp } from '../core/app-context.js';
import { Badge } from '../ui/ui.js';
import { SOURCE_LABEL, STORES, fmtKcal, fmtNum, fmtRM, isStale, unitAbbr, type Ingredient, type NutritionVector, type PricePoint } from '../../../shared/kitchen/index.js';
import { KitchenApiError, selectStore, useKitchen } from './store.js';

export { useKitchen } from './store.js';

export const storeName = (slug: string): string => STORES.find((s) => s.slug === slug)?.name ?? slug;
export const storeShort = (slug: string): string => STORES.find((s) => s.slug === slug)?.aliases[0] ?? slug;

/** تشغيل إجراء يرمي KitchenApiError: يعرض رسالته عربية في toast ويعيد null عند الفشل */
export function useAct(): <T>(fn: () => Promise<T>, okMsg?: string) => Promise<T | null> {
  const { toast } = useApp();
  return useCallback(
    async <T,>(fn: () => Promise<T>, okMsg?: string): Promise<T | null> => {
      try {
        const r = await fn();
        if (okMsg) toast(okMsg, { kind: 'ok' });
        return r;
      } catch (e) {
        toast(e instanceof KitchenApiError || e instanceof Error ? e.message : 'تعذّر التنفيذ', { kind: 'error' });
        return null;
      }
    },
    [toast],
  );
}

export function StoreSelect({ id, label = 'السوق' }: { id?: string; label?: string }) {
  const k = useKitchen();
  return (
    <select className="select kt-store-select" id={id} aria-label={label} value={k.store} onChange={(e) => selectStore(e.target.value)}>
      {STORES.map((s) => <option key={s.slug} value={s.slug}>{s.name}</option>)}
    </select>
  );
}

/** رمز المحفظة والسلة دائمًا في رأس صفحات المطبخ (WAL-01) */
export function KitchenChips() {
  const k = useKitchen();
  const w = k.wallet;
  return (
    <div className="row kt-chips">
      <Link to="/kitchen/wallet" className={`kt-chip wallet ${w?.level ?? 'none'}`} title="المحفظة — ميزانية المطبخ الداخلية">
        <Icon name="database" size={15} />
        <span className="num" dir="ltr">{w && w.configured ? fmtRM(w.balance_rm) : 'غير مضبوطة'}</span>
      </Link>
      <Link to="/kitchen/cart" className="kt-chip cart" title="السلة">
        <Icon name="list" size={15} />
        <span className="num">{fmtNum(k.cart.length, 0)}</span>
      </Link>
      {k.offline && <Badge tone="warn" title="القراءة من آخر لقطة محفوظة؛ الكتابة معطّلة حتى يعود الاتصال">غير متصل</Badge>}
    </div>
  );
}

/** سعر مختصر «RM x.xx / وحدة» + وسوم الثقة (تقديري/يدوي/إيصال، قديم، غير متحقَّق) */
export function PriceTag({ ing, point }: { ing: Ingredient; point: PricePoint | null | undefined }) {
  if (!point) return <span className="muted">لا سعر</span>;
  const stale = point.source !== 'estimate_tier' && isStale(point.observed_at);
  return (
    <span className="kt-price">
      <b className="num" dir="ltr">{fmtRM(point.price_rm)}</b> / {unitAbbr(ing.sale_unit)}{' '}
      {point.source === 'estimate_tier' ? <Badge dashed title="سعر تقديري من شريحة السوق — حدّثه من «الأسعار» ليصير يدويًا أو إيصالًا">تقديري</Badge> : <Badge tone="ok">{SOURCE_LABEL[point.source]}</Badge>}
      {point.unverified && <Badge tone="warn" title="سعر غير متحقَّق منه (2.7)">غير متحقَّق</Badge>}
      {stale && <Badge tone="warn" title="مضى أكثر من 30 يومًا على آخر تحديث">قديم</Badge>}
    </span>
  );
}

/** القيم الغذائية الخمس (NUT-04: kcal صحيح، والباقي خانة عشرية) */
export function NutriGrid({ n, unitLabel }: { n: NutritionVector; unitLabel?: string }) {
  const rows: [string, string, string][] = [
    ['السعرات', fmtKcal(n.kcal), 'سعرة'],
    ['البروتين', fmtNum(n.protein_g, 1), 'غ'],
    ['الكربوهيدرات', fmtNum(n.carbs_g, 1), 'غ'],
    ['الدهون', fmtNum(n.fat_g, 1), 'غ'],
    ['الألياف', fmtNum(n.fiber_g, 1), 'غ'],
  ];
  return (
    <dl className="kt-nutri" aria-label={unitLabel ?? 'القيم الغذائية'}>
      {rows.map(([l, v, u]) => (
        <div key={l}>
          <dt>{l}</dt>
          <dd><b className="num" dir="ltr">{v}</b> <small>{u}</small></dd>
        </div>
      ))}
    </dl>
  );
}

export function Section({ title, children, actions }: { title: ReactNode; children: ReactNode; actions?: ReactNode }) {
  return (
    <section className="kt-section">
      <div className="row kt-section-head"><h2>{title}</h2><span className="grow" />{actions}</div>
      {children}
    </section>
  );
}

export function useToggleSet(): [Set<string>, (k: string) => void] {
  const [s, setS] = useState<Set<string>>(new Set());
  return [s, (k) => setS((cur) => { const n = new Set(cur); if (n.has(k)) n.delete(k); else n.add(k); return n; })];
}
