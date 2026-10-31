import { useEffect, useState } from 'react';
import { Badge, Button, Card, CardHead } from '../ui/ui.js';
import { Icon } from '../lib/icons.js';
import { INGREDIENTS, fmtNum, type FoodHit, type Suggestion } from '../../../shared/kitchen/index.js';

interface Svc { id: string; label: string; configured: boolean; reason: string | null; used_today: number; cap: number; verified_note: string }
const FIELD_AR: Record<string, string> = { kcal: 'السعرات', protein_g: 'البروتين', carbs_g: 'الكربوهيدرات', fat_g: 'الدهون', fiber_g: 'الألياف' };

async function get<T>(u: string): Promise<T> {
  const r = await fetch(u);
  const j = (await r.json()) as { error?: string } & T;
  if (!r.ok) throw new Error(j.error ?? `خطأ ${r.status}`);
  return j;
}

/** إثراء اختياري (K-M12، علم kitchen.apis.extended): حالة الخدمات، باركود من الملصق، ومقارنة مكوّن بـUSDA كاقتراح لا يُطبَّق. المنصة تعمل كاملة بدونه (API-02). */
export function Enrichment() {
  const [st, setSt] = useState<{ enabled: boolean; services: Svc[] } | null>(null);
  const [code, setCode] = useState('');
  const [ing, setIng] = useState('egg');
  const [item, setItem] = useState<FoodHit | null>(null);
  const [sug, setSug] = useState<{ suggestion: Suggestion | null; note: string } | null>(null);
  const [err, setErr] = useState('');
  useEffect(() => { void get<{ enabled: boolean; services: Svc[] }>('/api/enrich/status').then(setSt).catch(() => setSt(null)); }, []);
  const run = async (fn: () => Promise<void>): Promise<void> => { setErr(''); try { await fn(); } catch (e) { setErr(e instanceof Error ? e.message : 'تعذّر الطلب'); } };
  return (
    <Card className="kt-enrich" id="enrich">
      <CardHead title="إثراء اختياري (UNVERIFIED)" icon="database" info="يعمل عبر بوابة الخادم فقط والمفاتيح لا تصل المتصفح. لو انقطع كل شيء تعمل المنصة من البذرة المحلية." />
      {!st ? <p className="muted">حالة الإثراء غير متاحة.</p> : (
        <ul className="plain stack kt-tight" data-testid="enrich-status">
          {st.services.map((s) => <li key={s.id}><b>{s.label}</b> {s.configured ? <Badge tone="ok">جاهز</Badge> : <Badge tone="warn">{s.reason}</Badge>} <small className="muted">استعمال اليوم <span className="num">{fmtNum(s.used_today, 0)}/{fmtNum(s.cap, 0)}</span> · {s.verified_note}</small></li>)}
        </ul>
      )}
      <div className="row kt-filter-row">
        <label className="kt-inline">باركود <input className="input" inputMode="numeric" dir="ltr" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} aria-label="الباركود" placeholder="9556001234567" /></label>
        <Button size="sm" disabled={code.length < 8} onClick={() => void run(async () => { const r = await get<{ item: FoodHit }>(`/api/enrich/off/barcode/${code}`); setItem(r.item); })}>اقرأ الملصق</Button>
        <label className="kt-inline">مكوّن <select className="select" value={ing} onChange={(e) => setIng(e.target.value)} aria-label="المكوّن">{INGREDIENTS.map((i) => <option key={i.slug} value={i.slug}>{i.name_ar}</option>)}</select></label>
        <Button size="sm" onClick={() => void run(async () => setSug(await get(`/api/enrich/compare/${ing}`)))}>قارن بـUSDA</Button>
      </div>
      {err && <p className="callout warn" role="status">{err}</p>}
      {item && <p>{item.name} — <Badge dashed>{item.basis}</Badge> {item.per100 ? <span className="num" dir="ltr">{fmtNum(item.per100.kcal, 0)} سعرة · {fmtNum(item.per100.protein_g, 1)} بروتين · {fmtNum(item.per100.carbs_g, 1)} كربوهيدرات · {fmtNum(item.per100.fat_g, 1)} دهون / 100 غ</span> : 'قيم ناقصة'}</p>}
      {sug && (sug.suggestion ? (
        <div className="stack">
          <p><b>اقتراح تحديث قيمة «{sug.suggestion.name_ar}»</b> {sug.suggestion.worth_review ? <Badge tone="warn"><Icon name="warn" size={11} /> يستحق المراجعة</Badge> : <Badge tone="ok">متقارب</Badge>} <small className="muted">{sug.suggestion.hit} · {sug.suggestion.basis}</small></p>
          <table className="dm-ba"><thead><tr><th>القيمة (لكل 100 غ)</th><th>البذرة</th><th>الخارجي</th><th>الفرق</th></tr></thead><tbody>{sug.suggestion.deltas.map((d) => <tr key={d.field}><td>{FIELD_AR[d.field]}</td><td className="num" dir="ltr">{fmtNum(d.seed, 1)}</td><td className="num" dir="ltr">{fmtNum(d.external, 1)}</td><td className="num" dir="ltr">{d.diff > 0 ? '+' : ''}{fmtNum(d.diff, 1)}</td></tr>)}</tbody></table>
          <small className="muted">{sug.note}</small>
        </div>
      ) : <p className="muted">لا نتيجة قابلة للمقارنة.</p>)}
    </Card>
  );
}
