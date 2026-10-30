/** محرر الأتمتة بجمل عربية: «عندما [حدث] ثم [إجراء]» — بلا كود. */
import { useId, useState } from 'react';
import { useApp } from '../core/app-context.js';
import { wos, type Space } from '../lib/wos.js';
import { Button, Field, IconButton, Switch } from '../ui/ui.js';
import { ACTION_LABEL, TRIGGER_LABEL, describeAutomation, type Action, type ActionKind, type Automation, type Trigger, type TriggerKind } from '../../../shared/wos.js';
import { AskAi } from '../ai/AskAi.js';

export function AutomationList({ space, rules, onChanged }: { space: Space; rules: Automation[]; onChanged: () => void }) {
  const { toast } = useApp();
  const [adding, setAdding] = useState(false);
  return (
    <div className="stack">
      {rules.length ? (
        <ul className="plain auto-list">
          {rules.map((a) => (
            <li key={a.id} className="auto-row">
              <Switch checked={a.enabled} label={`تفعيل «${a.name}»`} onChange={(v) => void wos.editAutomation(a.id, { enabled: v }).then(onChanged)} />
              <div>
                <b><bdi>{a.name}</bdi></b>
                <small className="muted">{describeAutomation(a, space.type)} · عملت {a.runs} مرة</small>
              </div>
              <IconButton icon="trash" sm ghost tone="danger" label={`حذف «${a.name}»`} onClick={() => void wos.delAutomation(a.id).then((r) => { onChanged(); toast(`حُذفت «${a.name}»`, { kind: 'ok', action: { label: 'تراجع', run: () => void wos.restore(r.undo).then(onChanged) } }); })} />
            </li>
          ))}
        </ul>
      ) : <p className="muted" style={{ margin: 0 }}>لا قواعد بعد. القاعدة تعمل تلقائيًا وتُسجَّل في سجل النشاط ويمكن التراجع عنها.</p>}
      {adding ? <AutomationForm space={space} onDone={() => { setAdding(false); onChanged(); }} onCancel={() => setAdding(false)} /> : <div className="row" style={{ gap: 8 }}><Button icon="plus" onClick={() => setAdding(true)}>قاعدة جديدة</Button><AskAi label="اكتبها بالعربي" prompt={`أضف أتمتة لمساحة «${space.name}»: عندما `} /></div>}
    </div>
  );
}

function AutomationForm({ space, onDone, onCancel }: { space: Space; onDone: () => void; onCancel: () => void }) {
  const { toast } = useApp();
  const id = useId();
  const t = space.type;
  const [trigger, setTrigger] = useState<Trigger>({ kind: 'status_changed', to: t.statuses.find((s) => s.category === 'done')?.id ?? t.statuses[0]?.id ?? null });
  const [action, setAction] = useState<Action>({ kind: 'notify', text: '' });
  const [name, setName] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const writable = t.fields.filter((f) => !['formula', 'rollup', 'relation', 'multiselect', 'daterange', 'library'].includes(f.kind));
  const dateLike = [{ id: 'due', name: 'الموعد' }, { id: 'start', name: 'البداية' }];
  const actField = [...dateLike, ...writable].find((f) => f.id === action.field);
  const fieldDef = t.fields.find((f) => f.id === action.field);
  const isDate = action.field === 'due' || action.field === 'start' || fieldDef?.kind === 'date';
  const save = async (): Promise<void> => {
    const a = { trigger, action };
    try {
      await wos.addAutomation(space.id, { name: name.trim() || describeAutomation(a, t).slice(0, 80), enabled: true, ...a });
      toast('أُضيفت القاعدة', { kind: 'ok' });
      onDone();
    } catch (e) {
      setErr((e as Error).message);
    }
  };
  return (
    <form className="card auto-form stack" onSubmit={(e) => { e.preventDefault(); void save(); }} aria-label="قاعدة أتمتة جديدة">
      <div className="form-grid">
        <Field label="عندما" htmlFor={`${id}-t`}>
          <select id={`${id}-t`} value={trigger.kind} onChange={(e) => { const k = e.target.value as TriggerKind; setTrigger(k === 'status_changed' ? { kind: k, to: t.statuses[0]?.id ?? null } : k === 'due_soon' ? { kind: k, days: 1 } : k === 'field_changed' ? { kind: k, field: t.fields[0]?.id ?? 'due' } : { kind: k }); }}>
            {(Object.keys(TRIGGER_LABEL) as TriggerKind[]).map((k) => <option key={k} value={k}>{TRIGGER_LABEL[k]}</option>)}
          </select>
        </Field>
        {trigger.kind === 'status_changed' && (
          <Field label="إلى الحالة" htmlFor={`${id}-to`}>
            <select id={`${id}-to`} value={trigger.to ?? ''} onChange={(e) => setTrigger({ ...trigger, to: e.target.value || null })}>
              <option value="">أي حالة</option>
              {t.statuses.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </Field>
        )}
        {trigger.kind === 'field_changed' && (
          <Field label="الحقل" htmlFor={`${id}-tf`}>
            <select id={`${id}-tf`} value={trigger.field ?? ''} onChange={(e) => setTrigger({ ...trigger, field: e.target.value })}>
              {[...dateLike, ...t.fields].map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </Field>
        )}
        {trigger.kind === 'due_soon' && (
          <Field label="قبل الموعد بـ (أيام)" htmlFor={`${id}-d`}><input id={`${id}-d`} type="number" min={0} max={60} value={trigger.days ?? 1} onChange={(e) => setTrigger({ ...trigger, days: Number(e.target.value) })} /></Field>
        )}
        <Field label="ثم" htmlFor={`${id}-a`}>
          <select id={`${id}-a`} value={action.kind} onChange={(e) => { const k = e.target.value as ActionKind; setAction(k === 'set_status' ? { kind: k, status: t.statuses[0]?.id ?? null } : k === 'set_field' ? { kind: k, field: 'due', value: 'today' } : k === 'create_next' ? { kind: k, every: 'week' } : k === 'notify' ? { kind: k, text: '' } : { kind: k }); }}>
            {(Object.keys(ACTION_LABEL) as ActionKind[]).map((k) => <option key={k} value={k}>{ACTION_LABEL[k]}</option>)}
          </select>
        </Field>
        {action.kind === 'set_status' && (
          <Field label="الحالة الجديدة" htmlFor={`${id}-as`}>
            <select id={`${id}-as`} value={action.status ?? ''} onChange={(e) => setAction({ ...action, status: e.target.value })}>
              {t.statuses.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </Field>
        )}
        {action.kind === 'set_field' && (
          <>
            <Field label="الحقل" htmlFor={`${id}-af`}>
              <select id={`${id}-af`} value={action.field ?? ''} onChange={(e) => { const fid = e.target.value; const fk = t.fields.find((f) => f.id === fid)?.kind; setAction({ ...action, field: fid, value: fid === 'due' || fid === 'start' || fk === 'date' ? 'today' : fk === 'checkbox' ? true : null }); }}>
                {[...dateLike, ...writable].map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </Field>
            <Field label={`القيمة${actField ? ` («${actField.name}»)` : ''}`} htmlFor={`${id}-av`}>
              {isDate ? (
                <select id={`${id}-av`} value={String(action.value ?? 'today')} onChange={(e) => setAction({ ...action, value: e.target.value })}><option value="today">اليوم (وقت التشغيل)</option></select>
              ) : fieldDef?.kind === 'select' ? (
                <select id={`${id}-av`} value={String(action.value ?? '')} onChange={(e) => setAction({ ...action, value: e.target.value || null })}><option value="">فارغ</option>{fieldDef.options?.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}</select>
              ) : fieldDef?.kind === 'checkbox' ? (
                <select id={`${id}-av`} value={String(action.value ?? 'true')} onChange={(e) => setAction({ ...action, value: e.target.value === 'true' })}><option value="true">نعم</option><option value="false">لا</option></select>
              ) : (
                <input id={`${id}-av`} value={String(action.value ?? '')} onChange={(e) => setAction({ ...action, value: ['number', 'currency', 'rating', 'progress'].includes(fieldDef?.kind ?? '') ? (e.target.value === '' ? null : Number(e.target.value)) : e.target.value })} />
              )}
            </Field>
          </>
        )}
        {action.kind === 'notify' && <Field label="نص التنبيه" htmlFor={`${id}-n`}><input id={`${id}-n`} value={action.text ?? ''} onChange={(e) => setAction({ ...action, text: e.target.value })} maxLength={200} placeholder="مثال: موعد قريب!" /></Field>}
        {action.kind === 'create_next' && (
          <Field label="كل" htmlFor={`${id}-e`}>
            <select id={`${id}-e`} value={action.every ?? 'week'} onChange={(e) => setAction({ ...action, every: e.target.value as 'day' })}><option value="day">يوم</option><option value="week">أسبوع</option><option value="month">شهر</option></select>
          </Field>
        )}
        <Field label="اسم القاعدة (اختياري)" htmlFor={`${id}-nm`} full><input id={`${id}-nm`} value={name} onChange={(e) => setName(e.target.value)} maxLength={80} placeholder={describeAutomation({ trigger, action }, t)} /></Field>
      </div>
      <p className="auto-sentence" aria-live="polite"><b>{describeAutomation({ trigger, action }, t)}</b></p>
      {err && <p className="err-inline" role="alert">{err}</p>}
      <div className="row" style={{ gap: 8 }}><Button variant="primary" type="submit">إضافة القاعدة</Button><Button variant="ghost" onClick={onCancel}>إلغاء</Button></div>
    </form>
  );
}
