import { useState } from 'react';
import { PageHead } from '../ui/page.js';
import { Badge, Button, Card, CardHead, Field, Switch } from '../ui/ui.js';
import { KitchenChips, useAct, useKitchen } from '../kitchen/kitchenKit.js';
import { saveWallet, walletAdjust } from '../kitchen/store.js';
import { fmtNum, fmtRM } from '../../../shared/kitchen/index.js';

const KIND_AR: Record<string, string> = { budget: 'ضبط الميزانية', purchase: 'شراء', quick: 'شراء سريع', refund: 'استرداد', adjust: 'تعديل' };
const PERIOD_AR = { week: 'أسبوع', month: 'شهر', custom: 'مخصّص' } as const;

/** W — محفظة المطبخ: ميزانية داخلية مستقلة عن دفتر المال (C6)؛ حدّ صارم افتراضيًا وتحذير عند 80% و100% */
export default function KitchenWallet() {
  const k = useKitchen();
  const act = useAct();
  const w = k.wallet;
  const [budget, setBudget] = useState('');
  const [period, setPeriod] = useState<'week' | 'month' | 'custom'>('week');
  const [hard, setHard] = useState(true);
  const [adj, setAdj] = useState('');
  const [note, setNote] = useState('');
  const bn = Number(budget);
  const badBudget = !budget.trim() || !Number.isFinite(bn) || bn < 0;
  const an = Number(adj);
  const pct = w && w.budget_rm > 0 ? Math.min(100, Math.round(((w.spent_rm / w.budget_rm) * 100))) : 0;

  return (
    <div className="page kitchen kt-wallet">
      <PageHead title="المحفظة" icon="database" sub="المبلغ المسموح لك بصرفه على المطبخ. ميزانية داخلية مستقلة عن دفتر المال ولا تنسخ أرصدته." actions={<KitchenChips />} />
      <div className="grid cols-2">
        <Card>
          <CardHead title="الرصيد" icon="database" />
          {w === null ? <p className="muted">جارٍ التحميل…</p> : !w.configured ? (
            <div className="callout warn" role="note">لم تُضبط ميزانية بعد. حدّد المبلغ والفترة ليصير «اشتريت» ممكنًا (الحدّ الصارم يمنع الصرف بلا رصيد).</div>
          ) : (
            <>
              <div className="kt-total big" data-testid="wallet-balance"><span>المتبقي</span><b className="num" dir="ltr">{fmtRM(w.balance_rm)}</b></div>
              <div className={`kt-meter ${w.level}`} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label="نسبة الصرف من الميزانية"><i style={{ inlineSize: `${pct}%` }} /></div>
              <p className="muted">صُرف <b className="num" dir="ltr">{fmtRM(w.spent_rm)}</b> من <b className="num" dir="ltr">{fmtRM(w.budget_rm)}</b> (<span className="num">{fmtNum(pct, 0)}</span>%) · فترة: {PERIOD_AR[w.period as keyof typeof PERIOD_AR] ?? w.period} · الحدّ {w.hard_limit ? 'صارم' : 'تحذيري'}</p>
              {w.level === 'warn' && <p className="callout warn" role="alert">بلغ الصرف 80% من الميزانية.</p>}
              {w.level === 'full' && <p className="callout danger" role="alert">بلغ الصرف 100% من الميزانية{w.hard_limit ? ' — الشراء متوقف حتى تزيدها صراحةً' : ''}.</p>}
            </>
          )}
        </Card>
        <Card>
          <CardHead title={w?.configured ? 'ضبط ميزانية جديدة' : 'ضبط الميزانية'} icon="sliders" />
          <div className="grid cols-2">
            <Field label="المبلغ (RM)" htmlFor="wl-b" hint="يستبدل الرصيد الحالي ببداية فترة جديدة"><input id="wl-b" className="input num" dir="ltr" inputMode="decimal" value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="مثال: 150" /></Field>
            <Field label="الفترة" htmlFor="wl-p"><select id="wl-p" className="select" value={period} onChange={(e) => setPeriod(e.target.value as typeof period)}>{(Object.keys(PERIOD_AR) as (keyof typeof PERIOD_AR)[]).map((p) => <option key={p} value={p}>{PERIOD_AR[p]}</option>)}</select></Field>
          </div>
          <Switch checked={hard} onChange={setHard} label="حدّ صارم (لا يتجاوز الصرف الرصيد)" />
          <div className="row"><Button variant="primary" disabled={badBudget} onClick={() => void act(() => saveWallet(bn, period, hard), 'ضُبطت الميزانية').then((r) => r !== null && setBudget(''))}>احفظ الميزانية</Button></div>
        </Card>
      </div>

      <Card style={{ marginBlockStart: 'var(--s-5)' }}>
        <CardHead title="تعديل أو استرداد" icon="edit" />
        <div className="row kt-adj">
          <input className="input num" dir="ltr" inputMode="decimal" aria-label="مبلغ التعديل (سالب للخصم)" placeholder="± مبلغ" value={adj} onChange={(e) => setAdj(e.target.value)} />
          <input className="input" aria-label="ملاحظة" placeholder="ملاحظة (اختياري)" maxLength={200} value={note} onChange={(e) => setNote(e.target.value)} />
          <Button disabled={!adj.trim() || !Number.isFinite(an) || an === 0} onClick={() => void act(() => walletAdjust(an, an > 0 ? 'refund' : 'adjust', note.trim() || undefined), 'سُجّلت الحركة').then((r) => { if (r !== null) { setAdj(''); setNote(''); } })}>سجّل</Button>
        </div>
      </Card>

      <Card style={{ marginBlockStart: 'var(--s-5)' }}>
        <CardHead title="الحركات" icon="list" />
        {!w || w.txs.length === 0 ? <p className="muted">لا حركات بعد.</p> : (
          <ul className="plain kt-moves">
            {w.txs.map((t) => (
              <li key={t.id}>
                <span>{KIND_AR[t.kind] ?? t.kind}</span>
                <b className="num" dir="ltr">{t.amount_rm > 0 ? '+' : '−'}{fmtRM(Math.abs(t.amount_rm)).replace('RM ', '')} RM</b>
                {t.note && <small className="muted">{t.note}</small>}
                {t.ref && <Badge dashed>مرجع {t.ref.slice(0, 6)}</Badge>}
                <small className="muted num" dir="ltr">{t.at.slice(0, 16).replace('T', ' ')}</small>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
