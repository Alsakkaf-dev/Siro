import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApp } from '../core/app-context.js';
import { ApiError, life } from '../lib/api.js';
import { PageHead } from '../ui/page.js';
import { Badge, Button, Card, CardHead, EmptyState, Field } from '../ui/ui.js';
import { fmtAt, FreshBadge, Note, useLife, TblWrap } from '../life/lifeKit.js';
import { AskAi } from '../ai/AskAi.js';
import { Icon } from '../lib/icons.js';
import {
  COMMAND_LABEL, COMMAND_TYPES, EXPENSE_BOXES, HABIT_KEYS, LIFE_DATA_FILES, LIFE_FILE_LABEL, PAY_SOURCES, PRAYER_AR, PRAYER_KEYS, validatePayload, type CommandType, type Finance, type LifeCommand,
} from '../../../shared/life.js';

const TYPE_HINT: Record<CommandType, string> = { log_expense: 'مصروف جديد', log_prayer: 'فرض أو قضاء', start_habit: 'تاريخ بدء', habit_relapse: 'ارتداد/انتكاسة', refresh_exports: 'حدّث الملفات' };
const BOX_AR: Record<string, string> = { treasury: 'الخزينة', monthly: 'الشهري', daily: 'اليومية', unknown: 'غير معروف' };
const PAY_AR: Record<string, string> = { rhb: 'RHB', tng: 'TNG', cash: 'نقدًا', unknown: 'غير معروف' };
const HABIT_AR: Record<string, string> = { vape: 'تقليل الفيب', tea_sugar: 'سكر الشاي', water: 'الماء', sleep: 'النوم', food: 'الأكل', workout: 'التمرين' };
const STATUS_AR: Record<string, string> = { pending: 'بانتظار راشد', done: 'منفّذ', rejected: 'مرفوض', failed: 'فشل', invalid: 'غير صالح' };
const STATUS_TONE: Record<string, 'ok' | 'warn' | 'danger' | undefined> = { pending: 'warn', done: 'ok', rejected: 'danger', failed: 'danger', invalid: 'danger' };
const todayKL = (): string => new Date(Date.now() + 8 * 3_600_000).toISOString().slice(0, 10);
type Form = Record<string, string>;

function buildPayload(type: CommandType, f: Form, files: string[]): Record<string, unknown> {
  const note = f['note_ar']?.trim();
  const p: Record<string, unknown> = {};
  switch (type) {
    case 'log_expense':
      Object.assign(p, { date: f['date'], amount: f['amount'] === '' || f['amount'] === undefined ? undefined : Number(f['amount']), currency: 'RM', box: f['box'], category_ar: f['category_ar']?.trim(), label_ar: f['label_ar']?.trim(), payment_source: f['payment_source'] });
      break;
    case 'log_prayer':
      Object.assign(p, { date: f['date'], prayer: f['prayer'], status: f['status'], kind: f['kind'] });
      break;
    case 'start_habit':
      Object.assign(p, { habit: f['habit'], start_date: f['date'] });
      break;
    case 'habit_relapse':
      Object.assign(p, { habit: f['habit'], date: f['date'] });
      break;
    case 'refresh_exports':
      Object.assign(p, { files });
      break;
  }
  if (note) p['note_ar'] = note;
  return p;
}
const defaults = (): Form => ({ date: todayKL(), box: 'daily', payment_source: 'tng', prayer: 'fajr', status: 'in_time', kind: 'fard', habit: 'vape', amount: '', category_ar: '', label_ar: '', note_ar: '' });

export default function LifeCommands() {
  const { toast, confirm } = useApp();
  const [sp, setSp] = useSearchParams();
  const t = sp.get('type');
  const type: CommandType = (COMMAND_TYPES as readonly string[]).includes(t ?? '') ? (t as CommandType) : 'log_expense';
  const [form, setForm] = useState<Form>(defaults);
  const [files, setFiles] = useState<string[]>([]);
  const [errs, setErrs] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [list, setList] = useState<(LifeCommand & { file: string; error?: string })[] | null>(null);
  const [dirOk, setDirOk] = useState(true);
  const d = useLife(['finance']);
  const cats = useMemo(() => [...new Set((d.get<Finance>('finance')?.recent_transactions ?? []).map((x) => x.category_ar).filter((x): x is string => !!x))], [d]);
  const payload = useMemo(() => buildPayload(type, form, files), [type, form, files]);
  const previewJson = useMemo(() => JSON.stringify({ id: '(يُولَّد عند الحفظ)', created_at: '(وقت الحفظ)', created_by: 'site', status: 'pending', type, payload }, null, 2), [type, payload]);
  const set = (k: string, v: string): void => setForm((x) => ({ ...x, [k]: v }));
  const reload = useCallback(() => {
    void life.commands().then((r) => { setList(r.commands); setDirOk(r.dir_exists); }).catch(() => setList([]));
  }, []);
  useEffect(reload, [reload]);

  const save = async (): Promise<void> => {
    const e = validatePayload(type, payload);
    setErrs(e);
    if (Object.keys(e).length) return;
    const ok = await confirm({
      title: 'حفظ مسودة أمر؟',
      body: <>سيُنشأ ملف جديد بحالة <b>pending</b> في مجلد <code>commands</code> عند راشد. <b>لن يُنفَّذ شيء</b> إلا بعد موافقتك الصريحة في المحادثة معه. لا يُعدَّل أو يُحذف أي ملف موجود.</>,
      confirmLabel: 'احفظ المسودة',
    });
    if (!ok) return;
    setBusy(true);
    try {
      const r = await life.draft(type, payload);
      toast(`حُفظت المسودة ${r.command.id}`, { kind: 'ok' });
      reload();
    } catch (er) {
      if (er instanceof ApiError && Object.keys(er.fields).length) setErrs(er.fields);
      toast((er as Error).message, { kind: 'error' });
    } finally {
      setBusy(false);
    }
  };
  const copy = (): void => {
    void navigator.clipboard?.writeText(previewJson).then(() => toast('نُسخ النص', { kind: 'ok' })).catch(() => toast('تعذّر النسخ', { kind: 'error' }));
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
      <PageHead title="طلبات التسجيل" icon="mail" sub="مسودات لراشد فقط. الموقع لا ينفّذ شيئًا." actions={<AskAi label="سجّل بجملة" prompt="سجّل: " />} badge={d.status ? <FreshBadge f={{ state: d.status.worst, age_hours: null }} /> : undefined} />
      <div className="stack life-stack">
        <div className="life-alert warn" role="note">
          <Icon name="warn" size={14} />
          <div>
            <strong>لا شيء يُنفَّذ من هنا</strong>
            <p style={{ margin: 0 }} className="muted">حفظ المسودة ينشئ ملفًا جديدًا (pending) في <code>commands</code>. راشد لا ينفّذه إلا بعد موافقتك الصريحة في المحادثة معه. يمكنك أيضًا نسخ النص وإرساله له يدويًا.</p>
          </div>
        </div>
        <Card>
          <CardHead title="نوع الأمر" icon="list" />
          <div className="cmd-types" role="group" aria-label="نوع الأمر">
            {COMMAND_TYPES.map((c) => (
              <button key={c} type="button" className="cmd-type" aria-pressed={type === c} onClick={() => { setSp({ type: c }, { replace: true }); setErrs({}); }}>
                <b>{COMMAND_LABEL[c]}</b>
                <small>{TYPE_HINT[c]}</small>
              </button>
            ))}
          </div>
        </Card>
        <div className="grid cols-2 cols-1-1">
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
              {(type === 'start_habit' || type === 'habit_relapse') && (
                <>
                  {sel('habit', 'العادة', HABIT_KEYS.map((k) => [k, HABIT_AR[k]!]))}
                  {input('date', type === 'start_habit' ? 'تاريخ البدء' : 'تاريخ الانتكاسة', { type: 'date' })}
                </>
              )}
              {type === 'refresh_exports' && (
                <fieldset style={{ gridColumn: '1 / -1', border: 0, padding: 0, margin: 0 }}>
                  <legend className="muted" style={{ marginBlockEnd: 6 }}>الملفات (بدون اختيار = الكل)</legend>
                  <div className="row" style={{ gap: 12 }}>
                    {LIFE_DATA_FILES.map((n) => (
                      <label key={n} className="row" style={{ gap: 6 }}>
                        <input type="checkbox" checked={files.includes(`${n}.json`)} onChange={(e) => setFiles((x) => (e.target.checked ? [...x, `${n}.json`] : x.filter((y) => y !== `${n}.json`)))} /> {LIFE_FILE_LABEL[n]}
                      </label>
                    ))}
                  </div>
                  {errs['files'] && <p role="alert" className="neg">{errs['files']}</p>}
                </fieldset>
              )}
              <div style={{ gridColumn: '1 / -1' }}>{input('note_ar', 'ملاحظة (اختياري)', { maxLength: 500 })}</div>
              <div className="row" style={{ gridColumn: '1 / -1' }}>
                <Button variant="primary" type="submit" icon="save" disabled={busy}>حفظ كمسودة</Button>
                <Button type="button" icon="copy" onClick={copy}>نسخ النص</Button>
              </div>
            </form>
          </Card>
          <Card>
            <details className="json-details">
              <summary><strong>معاينة الملف (JSON)</strong> <span className="muted">— للتحقق فقط</span></summary>
              <pre className="json-pre" tabIndex={0} aria-label="معاينة JSON">{previewJson}</pre>
              <Note>هذا ما سيُكتب بالضبط. الرقم المعرّف والوقت يُولَّدان عند الحفظ.</Note>
            </details>
          </Card>
        </div>
        <Card>
          <CardHead title="المسودات والأوامر الموجودة" icon="archive" />
          {!dirOk ? (
            <EmptyState icon="folder" title="مجلد commands غير موجود" text="لا ينشئه الموقع. اطلب من راشد تجهيز المجلد." />
          ) : list === null ? (
            <p className="muted">جارٍ التحميل…</p>
          ) : list.length === 0 ? (
            <EmptyState icon="mail" title="لا أوامر بعد" text="المسودات التي تحفظها تظهر هنا بحالتها كما يحدّثها راشد." />
          ) : (
            <TblWrap label="الأوامر الموجودة">
              <table className="life-tbl">
                <thead><tr><th>المعرّف</th><th>النوع</th><th>الحالة</th><th>أُنشئ</th><th>نتيجة</th></tr></thead>
                <tbody>
                  {list.map((c) => (
                    <tr key={c.file}>
                      <td><bdi className="num">{c.id}</bdi></td>
                      <td>{COMMAND_LABEL[c.type] ?? c.type}</td>
                      <td><Badge tone={STATUS_TONE[c.status]}>{STATUS_AR[c.status] ?? c.status}</Badge></td>
                      <td>{c.created_at ? fmtAt(c.created_at) : '—'}</td>
                      <td>{c.error ?? c.result_note_ar ?? ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TblWrap>
          )}
        </Card>
      </div>
    </div>
  );
}
