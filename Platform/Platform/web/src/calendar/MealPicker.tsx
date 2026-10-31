import { useMemo, useState } from 'react';
import { Badge, Button, Modal } from '../ui/ui.js';
import { Icon } from '../lib/icons.js';
import { useKitchen } from '../kitchen/kitchenKit.js';
import { CYCLE_CARDS, ORIGINAL_CARDS, feasibility, fmtKcal, fmtRM, inventoryFrom, mealCost, nutritionOf, type Recipe, type RecipeLine, type Slot } from '../../../shared/kitchen/index.js';
import { normalizeText } from '../../../shared/text.js';

export interface PickOption { slug: string; title: string; meals: string[]; kcal: number | null; cost: number | null; ovr: number | null; group: 'ready' | 'cycle' | 'codex' | 'mine'; lines: RecipeLine[]; ready: boolean }
const BLOCK = ['unsafe_chicken', 'burnt', 'undercooked'];

/** كل البطاقات المسموح تعيينها في الجدول: الأصلية المحسوبة + دورتي + ابتكاراتي (غير المخفية/الموسومة). كلها تمرّ على القانون في الخادم. */
export function usePickOptions(): PickOption[] {
  const k = useKitchen();
  return useMemo(() => {
    const inv = inventoryFrom([], Object.fromEntries(k.pantry.map((p) => [p.ingredient, p.grams])));
    const ready = (lines: RecipeLine[]): boolean => feasibility({ slug: 'x', title_ar: 'x', meal_types: [], origin: 'kitchen', status: 'verified', steps_original: [], lines, flags: [] } as Recipe, inv).status === 'ready';
    const cost = (lines: RecipeLine[]): number | null => { const c = mealCost(lines, k.idx, { store: k.store }); return c.missing.length ? null : c.total_rm; };
    const out: PickOption[] = [];
    for (const c of ORIGINAL_CARDS(k.idx, k.store)) if (c.computable) out.push({ slug: c.slug, title: c.title_ar, meals: c.meal_types, kcal: c.nutrition?.kcal ?? null, cost: c.cost_rm, ovr: c.stats?.OVR ?? null, group: 'codex', lines: c.recipe.lines, ready: ready(c.recipe.lines) });
    for (const c of CYCLE_CARDS) out.push({ slug: c.slug, title: c.title_ar, meals: [c.meal_slot], kcal: nutritionOf(c.lines).total.kcal, cost: cost([...c.lines]), ovr: null, group: 'cycle', lines: [...c.lines], ready: ready([...c.lines]) });
    for (const c of k.cards) if (!c.hidden && !c.flags.some((f) => BLOCK.includes(f))) out.push({ slug: c.slug, title: c.name_ar, meals: c.meal_types, kcal: c.nutrition['kcal'] ?? null, cost: c.cost_rm, ovr: c.stats['OVR'] ?? null, group: 'mine', lines: c.lines, ready: ready(c.lines) });
    return out;
  }, [k.idx, k.store, k.cards, k.pantry]);
}

const GROUP_LABEL = { ready: 'جاهزة من مخزني الآن', cycle: 'دورتي (كما في Outlook)', codex: 'القاموس', mine: 'ابتكاراتي' } as const;

/** منتقي البطاقات (CAL-31): بحث، نوع الوجبة، «جاهزة من مخزني الآن» في الأعلى، التكلفة والتقييم */
export function MealPicker({ slot, onPick, onClose }: { slot: Slot; onPick: (slug: string) => void; onClose: () => void }) {
  const opts = usePickOptions();
  const [q, setQ] = useState('');
  const [onlyMeal, setOnlyMeal] = useState(true);
  const [sort, setSort] = useState<'default' | 'cost' | 'kcal' | 'ovr'>('default');
  const groups = useMemo(() => {
    const nq = normalizeText(q);
    let list = opts.filter((o) => (!nq || normalizeText(o.title).includes(nq)) && (!onlyMeal || o.meals.includes(slot)));
    if (sort === 'cost') list = [...list].sort((a, b) => (a.cost ?? 1e9) - (b.cost ?? 1e9));
    else if (sort === 'kcal') list = [...list].sort((a, b) => (a.kcal ?? 1e9) - (b.kcal ?? 1e9));
    else if (sort === 'ovr') list = [...list].sort((a, b) => (b.ovr ?? -1) - (a.ovr ?? -1));
    const ready = list.filter((o) => o.ready);
    const rest = list.filter((o) => !o.ready);
    return [
      { key: 'ready' as const, items: ready },
      { key: 'cycle' as const, items: rest.filter((o) => o.group === 'cycle') },
      { key: 'codex' as const, items: rest.filter((o) => o.group === 'codex') },
      { key: 'mine' as const, items: rest.filter((o) => o.group === 'mine') },
    ].filter((g) => g.items.length);
  }, [opts, q, onlyMeal, sort, slot]);
  return (
    <Modal title={`اختر بطاقة لـ«${slot}»`} onClose={onClose} wide footer={<Button onClick={onClose}>إلغاء</Button>}>
      <div className="stack" data-testid="meal-picker">
        <div className="row kt-filter-row">
          <input className="input kt-search" type="search" placeholder="ابحث في البطاقات…" aria-label="بحث في البطاقات" value={q} onChange={(e) => setQ(e.target.value)} />
          <label className="kt-check"><input type="checkbox" checked={onlyMeal} onChange={(e) => setOnlyMeal(e.target.checked)} /> مناسبة لـ{slot} فقط</label>
          <select className="select" aria-label="الترتيب" value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}>
            <option value="default">ترتيب افتراضي</option><option value="cost">الأرخص أولًا</option><option value="kcal">الأقل سعرات</option><option value="ovr">الأعلى تقييمًا</option>
          </select>
        </div>
        {groups.length === 0 && <p className="muted">لا بطاقات مطابقة.</p>}
        {groups.map((g) => (
          <section key={g.key} aria-label={GROUP_LABEL[g.key]}>
            <h3 className="cal-list-h">{GROUP_LABEL[g.key]} <small className="muted num">{g.items.length}</small></h3>
            <ul className="plain stack kt-tight">
              {g.items.map((o) => (
                <li key={o.slug}>
                  <button type="button" className="cal-row pick-row" data-slug={o.slug} onClick={() => onPick(o.slug)}>
                    <span className="cal-row-n">{o.title}</span>
                    <span className="row pick-meta"><span className="num" dir="ltr">{o.kcal !== null ? fmtKcal(o.kcal) : '—'}</span> <small>سعرة</small> · <span className="num" dir="ltr">{o.cost !== null ? fmtRM(o.cost) : 'تكلفة غير معروفة'}</span>{o.ovr !== null && <> · <Badge dashed>تقييم <span className="num">{o.ovr}</span></Badge></>}{g.key === 'ready' && <Badge tone="ok"><Icon name="check" size={11} /> جاهزة من مخزني</Badge>}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </Modal>
  );
}
