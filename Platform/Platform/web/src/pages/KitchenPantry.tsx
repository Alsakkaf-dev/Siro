import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHead } from '../ui/page.js';
import { Badge, Button, Card, CardHead, EmptyState, Field, Modal } from '../ui/ui.js';
import { KitchenChips, useAct, useKitchen } from '../kitchen/kitchenKit.js';
import { adjustPantry, fetchPantryMoves, setPantryMin } from '../kitchen/store.js';
import { INGREDIENT_BY_SLUG, INGREDIENTS, fmtNum, fmtRM } from '../../../shared/kitchen/index.js';

const KIND_AR: Record<string, string> = { purchase: 'شراء', consume: 'استهلاك من الطبخ', adjust: 'تعديل' };
type Move = { id: string; ingredient: string; delta_g: number; kind: string; reason: string | null; ref: string | null; at: string };

/** P — المخزن: ما أملكه فعلًا بالغرام، تكلفة الغرام الفعلية، حدّ أدنى للتنبيه، تعديل بسبب، وسجل الحركات */
export default function KitchenPantry() {
  const k = useKitchen();
  const act = useAct();
  const [moves, setMoves] = useState<Move[]>([]);
  const [adj, setAdj] = useState<string | null>(null);
  const rows = useMemo(() => k.pantry.filter((p) => p.grams > 0 || p.min_g !== null), [k.pantry]);
  const low = rows.filter((p) => p.min_g !== null && p.grams < p.min_g);
  useEffect(() => {
    void fetchPantryMoves().then((r) => setMoves(r.moves)).catch(() => undefined);
  }, [k.pantry]);

  return (
    <div className="page kitchen kt-pantry">
      <PageHead title="المخزن" icon="archive" sub="ما تملكه فعلًا. يُستهلك آليًا من المطبخ بالكميات الفعلية، ويُعدَّل يدويًا بسبب مسجّل." actions={<KitchenChips />} />
      {low.length > 0 && (
        <div className="callout warn" role="status" data-testid="low-stock">
          نقص في أصناف أساسية: {low.map((p) => `${INGREDIENT_BY_SLUG.get(p.ingredient)?.name_ar} (${fmtNum(Math.round(p.grams), 0)} من ${fmtNum(p.min_g ?? 0, 0)} غ)`).join('، ')}. <Link to="/kitchen/store">إلى المتجر</Link> — لا شراء تلقائي.
        </div>
      )}
      {rows.length === 0 ? (
        <EmptyState icon="archive" title="المخزن فارغ" text="يمتلئ المخزن عند «اشتريت» في السلة أو الشراء السريع. وللتصحيح اليدوي استعمل «تعديل جرد»." action={<div className="row"><Button variant="primary" to="/kitchen/store">إلى المتجر</Button><Button onClick={() => setAdj('')}>تعديل جرد</Button></div>} />
      ) : (
        <Card>
          <CardHead title="ما في المخزن" icon="archive"><Button size="sm" icon="plus" onClick={() => setAdj('')}>تعديل جرد</Button></CardHead>
          <div className="tbl-wrap">
            <table className="tbl kt-pantry-tbl">
              <thead><tr><th>الصنف</th><th>الكمية الباقية</th><th>تكلفة الغرام الفعلية</th><th>تاريخ الشراء</th><th>حدّ أدنى للتنبيه (غ)</th><th><span className="sr-only">إجراءات</span></th></tr></thead>
              <tbody>
                {rows.map((p) => {
                  const ing = INGREDIENT_BY_SLUG.get(p.ingredient);
                  if (!ing) return null;
                  const perG = p.grams > 0 ? p.cost_rm / p.grams : null;
                  const isLow = p.min_g !== null && p.grams < p.min_g;
                  return (
                    <tr key={p.ingredient} data-ing={p.ingredient}>
                      <th scope="row"><span aria-hidden="true">{ing.icon}</span> {ing.name_ar}</th>
                      <td className="num" dir="ltr"><b>{fmtNum(Math.round(p.grams * 10) / 10, 1)}</b> غ {isLow && <Badge tone="warn">نقص</Badge>}</td>
                      <td className="num" dir="ltr">{perG === null ? '—' : `${fmtRM(perG)} / غ`}{perG !== null && <small className="muted"> (RM {fmtNum(perG * 1000, 2)} / كغ)</small>}</td>
                      <td className="num" dir="ltr">{p.bought_at ? p.bought_at.slice(0, 10) : '—'}</td>
                      <td><MinInput value={p.min_g} onSave={(v) => void act(() => setPantryMin(p.ingredient, v))} label={ing.name_ar} /></td>
                      <td><Button size="sm" onClick={() => setAdj(p.ingredient)}>تعديل</Button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <small className="muted">ملاحظة عامة (غير طبية): الأصناف الطازجة كالدجاج تُجمَّد إن لم تُستعمل خلال يومين.</small>
        </Card>
      )}
      <Card style={{ marginBlockStart: 'var(--s-5)' }}>
        <CardHead title="سجل الحركات" icon="list" />
        {moves.length === 0 ? <p className="muted">لا حركات بعد.</p> : (
          <ul className="plain kt-moves">
            {moves.slice(0, 40).map((m) => (
              <li key={m.id}>
                <span>{INGREDIENT_BY_SLUG.get(m.ingredient)?.name_ar}</span>
                <b className="num" dir="ltr">{m.delta_g > 0 ? '+' : '−'}{fmtNum(Math.abs(m.delta_g), 1)} غ</b>
                <small className="muted">{KIND_AR[m.kind] ?? m.kind}{m.reason ? ` — ${m.reason}` : ''}</small>
                <small className="muted num" dir="ltr">{m.at.slice(0, 16).replace('T', ' ')}</small>
              </li>
            ))}
          </ul>
        )}
      </Card>
      {adj !== null && <AdjustDialog initial={adj} onClose={() => setAdj(null)} />}
    </div>
  );
}

function MinInput({ value, onSave, label }: { value: number | null; onSave: (v: number | null) => void; label: string }) {
  const [t, setT] = useState(value === null ? '' : String(value));
  useEffect(() => setT(value === null ? '' : String(value)), [value]);
  const commit = (): void => {
    const n = t.trim() === '' ? null : Number(t);
    if (n !== null && (!Number.isFinite(n) || n < 0)) return setT(value === null ? '' : String(value));
    if (n !== value) onSave(n);
  };
  return <input className="input kt-min num" dir="ltr" inputMode="numeric" aria-label={`حدّ أدنى لـ${label}`} placeholder="بلا" value={t} onChange={(e) => setT(e.target.value)} onBlur={commit} onKeyDown={(e) => e.key === 'Enter' && commit()} />;
}

function AdjustDialog({ initial, onClose }: { initial: string; onClose: () => void }) {
  const act = useAct();
  const [ing, setIng] = useState(initial || INGREDIENTS[0]!.slug);
  const [delta, setDelta] = useState('');
  const [reason, setReason] = useState('');
  const n = Number(delta);
  const bad = !delta.trim() || !Number.isFinite(n) || n === 0;
  const save = async (): Promise<void> => {
    const r = await act(() => adjustPantry(ing, n, reason.trim()), 'سُجّل التعديل');
    if (r !== null) onClose();
  };
  return (
    <Modal title="تعديل جرد" onClose={onClose} footer={<><Button onClick={onClose}>إلغاء</Button><Button variant="primary" disabled={bad || !reason.trim()} onClick={() => void save()}>احفظ</Button></>}>
      <div className="grid cols-2">
        <Field label="الصنف" htmlFor="adj-ing"><select id="adj-ing" className="select" value={ing} onChange={(e) => setIng(e.target.value)}>{INGREDIENTS.map((i) => <option key={i.slug} value={i.slug}>{i.name_ar}</option>)}</select></Field>
        <Field label="التغيير بالغرام (سالب للنقص)" htmlFor="adj-d" hint="مثال: ‎-60 لتلف بيضة"><input id="adj-d" className="input num" dir="ltr" inputMode="decimal" value={delta} onChange={(e) => setDelta(e.target.value)} /></Field>
        <Field label="السبب (إلزامي)" full htmlFor="adj-r"><input id="adj-r" className="input" value={reason} maxLength={200} onChange={(e) => setReason(e.target.value)} placeholder="تصحيح جرد، تلف، هدية…" /></Field>
      </div>
    </Modal>
  );
}
