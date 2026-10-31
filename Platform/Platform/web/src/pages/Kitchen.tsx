import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHead } from '../ui/page.js';
import { KitchenChips, useKitchen } from '../kitchen/kitchenKit.js';
import { Badge, Card, CardHead, cx } from '../ui/ui.js';
import { StatTile } from '../widgets/tiles.js';
import { flagEnabled } from '../core/flags.js';
import { t } from '../kitchen/i18n/ar.js';
import { Enrichment } from '../kitchen/Enrichment.js';
import { IngIcon } from '../kitchen/kitchenIcons.js';
import {
  CYCLE, INGREDIENTS, LAW, ORIGINAL_RECIPES, SEED_PRICES, STORES, fmtKcal, fmtNum, fmtRM, indexPrices, nutritionOf, per100g, pickPrice, searchIngredients, unitAbbr, withinLaw, type Category,
} from '../../../shared/kitchen/index.js';

const CATS: Category[] = ['خضروات', 'فواكه', 'لحوم ودواجن', 'ألبان وبيض', 'حبوب ونشويات', 'مخبوزات', 'توابل', 'زيوت', 'محليات', 'معلبات وصلصات'];

/** HUB المطبخ (K-M1): بذرة المكوّنات الـ26 + الأسعار التقديرية + القانون. كل رقم من طبقة shared/kitchen. */
export default function Kitchen() {
  const k = useKitchen();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<Category | null>(null);
  const idx = useMemo(() => indexPrices(SEED_PRICES), []);
  const usage = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of ORIGINAL_RECIPES) for (const s of new Set(r.lines.map((l) => l.ingredient))) m.set(s, (m.get(s) ?? 0) + 1);
    return m;
  }, []);
  const cycleAvg = useMemo(() => CYCLE.reduce((s, d) => s + d.meals.reduce((x, m) => x + nutritionOf(m.lines).total.kcal, 0), 0) / CYCLE.length, []);
  const list = useMemo(() => searchIngredients(q, INGREDIENTS).map((h) => h.item).filter((i) => !cat || i.category === cat), [q, cat]);
  const cats = CATS.filter((c) => INGREDIENTS.some((i) => i.category === c));

  return (
    <div className="page kitchen">
      <PageHead title={t('hub.title')} icon="utensils" sub={t('hub.sub')} actions={<KitchenChips />} />
      {!flagEnabled('kitchen.enabled') && <div className="callout" role="note" style={{ marginBlockEnd: 'var(--s-4)' }}>{t('hub.preview')}</div>}
      <div className="grid stats" style={{ marginBlockEnd: 'var(--s-5)' }}>
        <StatTile tone="green" icon="list" label={t('hub.tiles.ingredients')} value={fmtNum(INGREDIENTS.length, 0)} />
        <StatTile tone="blue" icon="pin" label={t('hub.tiles.stores')} value={fmtNum(STORES.length, 0)} />
        <StatTile tone="orange" icon="book" label={t('hub.tiles.recipes')} value={fmtNum(ORIGINAL_RECIPES.length, 0)} />
        <StatTile tone="purple" icon="shield" label={t('hub.tiles.law')} value={<span dir="ltr">{fmtNum(LAW.MIN, 0)}–{fmtNum(LAW.MAX, 0)}</span>} sub={t('hub.tiles.law.sub')} />
        <StatTile tone="pink" icon="chart" label={t('hub.tiles.cycle')} value={fmtKcal(cycleAvg)} sub={withinLaw(cycleAvg) ? `${t('unit.kcal')} · محسوب` : t('unit.kcal')} />
      </div>

      <Card>
        <CardHead title="المكوّنات" icon="list">
          <input className="input kitchen-search" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('hub.search')} aria-label={t('hub.search')} />
        </CardHead>
        <div className="chips" role="group" aria-label="الفئات" style={{ marginBlockEnd: 'var(--s-4)' }}>
          <button type="button" className={cx('chip', !cat && 'active')} aria-pressed={!cat} onClick={() => setCat(null)}>{t('hub.filter.all')}</button>
          {cats.map((c) => <button key={c} type="button" className={cx('chip', cat === c && 'active')} aria-pressed={cat === c} onClick={() => setCat(cat === c ? null : c)}>{c}</button>)}
        </div>
        {list.length === 0 ? <p className="muted">{t('hub.empty')}</p> : (
          <ul className="plain ing-grid">
            {list.map((i) => {
              const n = per100g(i.slug);
              const cheapest = pickPrice(idx, i.slug, 'cheapest', '');
              const used = usage.get(i.slug) ?? 0;
              return (
                <li key={i.slug} className="ing-card">
                  <span className="ing-ico" aria-hidden="true"><IngIcon slug={i.slug} category={i.category} size={22} /></span>
                  <div className="ing-main">
                    <strong>{i.name_ar}</strong>
                    <small className="muted" dir="ltr">{i.name_ms}</small>
                    <small className="muted">{i.category} · {fmtKcal(n.kcal)} {t('unit.kcal')} {t('hub.per100')}</small>
                    {cheapest && (
                      <small>
                        {t('hub.from')} <b className="num">{fmtRM(cheapest.price_rm)}</b> / {unitAbbr(i.sale_unit)}{' '}
                        <Badge dashed title={t('hub.estimate.title')}>{t('hub.estimate')}</Badge>
                        {cheapest.unverified && <> <Badge tone="warn">{t('hub.unverified')}</Badge></>}
                      </small>
                    )}
                    <small className="muted">{used ? `${t('hub.usedIn')} ${fmtNum(used, 0)} ${t('hub.recipesWord')}` : t('hub.notInRecipes')}</small>
                    {i.flags.filter((f) => f !== 'not_in_recipes').map((f) => <small key={f} className="ing-flag">{t(`hub.flags.${f}` as 'hub.flags.assumed_pack')}</small>)}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <div className="grid cols-2" style={{ marginBlockStart: 'var(--s-5)' }}>
        <Card>
          <CardHead title={t('hub.defects')} icon="warn" />
          <ul className="plain stack" style={{ gap: 'var(--s-2)' }}>
            <li>{t('hub.defect.ln02')}</li>
            <li>{t('hub.defect.ln04')}</li>
            <li>{t('hub.defect.day3')}</li>
          </ul>
        </Card>
        <Card>
          <CardHead title={t('hub.next')} icon="flag" />
          <ul className="plain stack kt-tight kt-hub-links">
            <li><Link to="/kitchen/store">المتجر</Link> <small className="muted">26 منتجًا بأسعار الأسواق الخمسة</small></li>
            <li><Link to="/kitchen/cart">السلة</Link> <small className="muted"><span className="num">{fmtNum(k.cart.length, 0)}</span> صنفًا</small></li>
            <li><Link to="/kitchen/pantry">المخزن</Link> <small className="muted"><span className="num">{fmtNum(k.pantry.filter((p) => p.grams > 0).length, 0)}</span> صنفًا</small></li>
            <li><Link to="/kitchen/wallet">المحفظة</Link> <small className="muted">{k.wallet?.configured ? fmtRM(k.wallet.balance_rm) : 'غير مضبوطة'}</small></li>
            <li><Link to="/kitchen/prices">تحديث الأسعار</Link> <small className="muted">مصفوفة وتدقيق وتراجع</small></li>
            <li><Link to="/kitchen/codex">قاموس الوجبات</Link> <small className="muted"><span className="num">12</span> بطاقة أصلية</small></li>
          </ul>
          <p className="muted">{t('hub.next.list')}</p>
        </Card>
      </div>
      {flagEnabled('kitchen.apis.extended') && <Enrichment />}
    </div>
  );
}
