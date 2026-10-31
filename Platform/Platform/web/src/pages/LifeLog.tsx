import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApp } from '../core/app-context.js';
import { ApiError, life, type LifeEventRow } from '../lib/api.js';
import { PageHead } from '../ui/page.js';
import { Badge, Button, Card, CardHead, EmptyState, Field } from '../ui/ui.js';
import { fmtAt, Note, useLife, TblWrap } from '../life/lifeKit.js';
import { AskAi } from '../ai/AskAi.js';
import {
  COMMAND_LABEL, COMMAND_TYPES, EXPENSE_BOXES, HABIT_KEYS, PAY_SOURCES, PRAYER_AR, PRAYER_KEYS, validatePayload, type CommandType, type Finance,
} from '../../../shared/life.js';

const TYPE_HINT: Record<CommandType, string> = { log_expense: 'مصروف جديد', log_prayer: 'فرض أو قضاء', log_weight: 'وزن اليوم', log_habit: 'قيمة اليوم', start_habit: 'تاريخ بدء', habit_relapse: 'انتكاسة' };
const BOX_AR: Record<string, string> = { treasury: 'الخزينة', monthly: 'الشهري', daily: 'اليومية', unknown: 'غير محدد' };
const PAY_AR: Record<string, string> = { rhb: 'RHB', tng: 'TNG', cash: 'نقدًا', unknown: 'غير محدد' };
const HABIT_AR: Record<string, string> = { vape: 'تقليل الفيب', tea_sugar: 'سكر الشاي', water: 'الماء', sleep: 'النوم', food: 'الأكل', workout: 'التمرين' };
const HABIT_VALUE: Record<string, string> = { vape: 'التزمت بالحد؟ (1 نعم، 0 لا)', tea_sugar: 'السكر بالغرام', water: 'الماء باللتر', sleep: 'نمت في موعدك؟ (1 نعم، 0 لا)', food: 'السعرات', workout: 'تمرنت؟ (1 نعم، 0 لا)' };
const todayKL = (): string => new Date(Date.now() + 8 * 3_600_000).toISOString().slice(0, 10);
type Form = Record<string, string>;

const num = (v: string | undefined): number | undefined => (v === undefined || v.trim() === '' ? undefined : Number(v));
function buildPayload(type: CommandType, f: Form): Record<string, unknown> {
  const note = f['note_ar']?.trim();
  const p: Record<string, unknown> = {};
  switch (type) {
    case 'log_expense':
      Object.assign(p, { date: f['date'], amount: num(f['amount']), currency: 'RM', box: f['box'], category_ar: f['category_ar']?.trim(), label_ar: f['label_ar']?.trim(), payment_source: f['payment_source'] });
      break;
    case 'log_prayer':
      Object.assign(p, { date: f['date'], prayer: f['prayer'], status: f['status'], kind: f['kind'] });
      break;
    case 'log_weight':
      Object.assign(p, { date: f['date'], weight_kg: num(f['weight_kg']) });
      break;
    case 'log_habit':
      Object.assign(p, { habit: f['habit'], date: f['date'], value: num(f['value']) });
      break;
    case 'start_habit':
      Object.assign(p, { habit: f['habit'], start_date: f['date'] });
      break;
    case 'habit_relapse':
      Object.assign(p, { habit: f['habit'], date: f['date'] });
      break;
  }
  if (note) p['note_ar'] = note;
  return p;
}
const defaults = (): Form => ({ date: todayKL(), box: 'daily', payment_source: 'tng', prayer: 'fajr', status: 'in_time', kind: 'fard', habit: 'water', amount: '', category_ar: '', label_ar: '', note_ar: '', weight_kg: '', value: '' });

export default function LifeLog() {
  const { toast } = useApp();
  const [sp, setSp] = useSearchParams();
  const t = sp.get('type');
  const type: CommandType = (COMMAND_TYPES as readonly string[]).includes(t ?? '') ? (t as CommandType) : 'log_prayer';
  const [form, setForm] = useState<Form>(defaults);
  const [errs, setErrs] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [list, setList] = useState<LifeEventRow[] | null>(null);
  const d = useLife(['finance']);
  const cats = useMemo(() => [...new Set((d.get<Finance>('finance')?.recent_transactions ?? []).map((x) => x.category_ar).filter((x): x is string => !!x))], [d]);
  const payload = useMemo(() => buildPayload(type, form), [type, form]);
  const set = (k: string, v: string): void => setForm((x) => ({ ...x, [k]: v }));
  const reload = useCallback(() => {
    void life.events().then((r) => setList(r.events)).catch(() => setList([]));
  }, []);
  useEffect(reload, [reload]);
  const lastId = list?.find((e) => !e.undone)?.id;

  const undo = async (id: string): Promise<void> => {
    try {
      await life.undo(id);
      toast('تم التراجع', { kind: 'ok' });
      d.reload?.();
      reload();
    } catch (er) {
      toast((er as Error).message, { kind: 'error' });
    }
  };
  const save = async (): Promise<void> => {
    const e = validatePayload(type, payload);
    setErrs(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    try {
      const r = await life.log(type, payload);
      toast(`سُجّل: ${r.event.summary}`, { kind: 'ok', action: { label: 'تراجع', run: () => void undo(r.event.id) } });
      d.reload?.();
      reload();
    } catch (er) {
      if (er instanceof ApiError && Object.keys(er.fields).length) setErrs(er.fields);
      toast((er as Error).message, { kind: 'error' });
    } finally {
      setBusy(false);
    }
  };
  const input = (k: string, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <Field label={label} error={errs[k]} htmlFor={'f-' + k}>
      <input id={'f-' + k} className="input" value={form[k] ?? ''} onChange={(e) => set(k, e.target.value)} aria-invalid={!!errs[k]} {...props} />
    </Field>
  );
  const sel = (k: string, label: string, opts: [string, string][]) => (
    <Field label={label} error={errs[k]} htmlFor={'f-' + k}>
      <select id={'f-' + k} className="input" value={form[k] ?? ''} onChange={(e) => set(k, e.target.value)}>
        {opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </Field>
  );

  return (
    <div className="page life-page">
      <PageHead title="تسجيل" icon="edit" sub="سجّل صلاتك ومصروفك ووزنك وعاداتك؛ يُحفظ فورًا ويمكنك التراجع." actions={<AskAi label="سجّل بجملة" prompt="سجّل: " />} />
      <div className="stack life-stack">
        <Card>
          <CardHead title="ماذا تسجّل؟" icon="list" />
          <div className="cmd-types" role="group" aria-label="نوع التسجيل">
            {COMMAND_TYPES.map((c) => (
              <button key={c} type="button" className="cmd-type" aria-pressed={type === c} onClick={() => { setSp({ type: c }, { replace: true }); setErrs({}); }}>
                <b>{COMMAND_LABEL[c]}</b>
                <small>{TYPE_HINT[c]}</small>
              </button>
            ))}
          </div>
        </Card>
        <Card>
          <CardHead title={COMMAND_LABEL[type]} icon="edit" />
          <form className="form-grid" onSubmit={(e) => { e.preventDefault(); void save(); }} noValidate>
            {type === 'log_expense' && (
              <>
                {input('date', 'التاريخ', { type: 'date' })}
                {input('amount', 'المبلغ (RM)', { inputMode: 'decimal', placeholder: '9.29' })}
                {sel('box', 'الصندوق', EXPENSE_BOXES.map((b) => [b, BOX_AR[b]!]))}
                {sel('payment_source', 'مصدر الدفع', PAY_SOURCES.map((b) => [b, PAY_AR[b]!]))}
                {input('category_ar', 'الفئة', { list: 'life-cats', placeholder: 'طعام وبقالة' })}
                <datalist id="life-cats">{cats.map((c) => <option key={c} value={c} />)}</datalist>
                {input('label_ar', 'وصف قصير', { placeholder: 'غداء' })}
              </>
            )}
            {type === 'log_prayer' && (
              <>
                {input('date', 'التاريخ', { type: 'date' })}
                {sel('prayer', 'الصلاة', PRAYER_KEYS.map((k) => [k, PRAYER_AR[k]]))}
                {sel('status', 'الحالة', [['in_time', 'في وقتها'], ['late', 'متأخرة'], ['missed', 'فاتت']])}
                {sel('kind', 'النوع', [['fard', 'فرض'], ['qada', 'قضاء']])}
              </>
            )}
            {type === 'log_weight' && (
              <>
                {input('date', 'التاريخ', { type: 'date' })}
                {input('weight_kg', 'الوزن (كغ)', { inputMode: 'decimal', placeholder: '83.5' })}
              </>
            )}
            {type === 'log_habit' && (
              <>
                {sel('habit', 'العادة', HABIT_KEYS.map((k) => [k, HABIT_AR[k]!]))}
                {input('date', 'التاريخ', { type: 'date' })}
                {input('value', HABIT_VALUE[form['habit'] ?? 'water'] ?? 'القيمة', { inputMode: 'decimal' })}
              </>
            )}
            {(type === 'start_habit' || type === 'habit_relapse') && (
              <>
                {sel('habit', 'العادة', HABIT_KEYS.map((k) => [k, HABIT_AR[k]!]))}
                {input('date', type === 'start_habit' ? 'تاريخ البدء' : 'تاريخ الانتكاسة', { type: 'date' })}
              </>
            )}
            <div style={{ gridColumn: '1 / -1' }}>{input('note_ar', 'ملاحظة (اختياري)', { maxLength: 500 })}</div>
            <div className="row" style={{ gridColumn: '1 / -1' }}>
              <Button variant="primary" type="submit" icon="save" disabled={busy}>سجّل</Button>
            </div>
          </form>
        </Card>
        <Card>
          <CardHead title="آخر التسجيلات" icon="archive" />
          {list === null ? (
            <p className="muted">جارٍ التحميل…</p>
          ) : list.length === 0 ? (
            <EmptyState icon="edit" title="لا تسجيلات بعد" text="ما تسجّله هنا يظهر في هذا السجل ويمكنك التراجع عن آخر تسجيل." />
          ) : (
            <TblWrap label="آخر التسجيلات">
              <table className="life-tbl">
                <thead><tr><th>الوقت</th><th>النوع</th><th>التفاصيل</th><th>الحالة</th><th /></tr></thead>
                <tbody>
                  {list.map((c) => (
                    <tr key={c.id}>
                      <td>{fmtAt(c.at)}</td>
                      <td>{COMMAND_LABEL[c.type as CommandType] ?? c.type}</td>
                      <td>{c.summary}</td>
                      <td>{c.undone ? <Badge dashed>تم التراجع</Badge> : <Badge tone="ok">محفوظ</Badge>}</td>
                      <td>{c.id === lastId && <Button size="sm" type="button" onClick={() => void undo(c.id)}>تراجع</Button>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TblWrap>
          )}
          <Note>التراجع متاح لآخر تسجيل فقط.</Note>
        </Card>
      </div>
    </div>
  );
}
