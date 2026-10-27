/** إعدادات المساحة: الاسم واللون والأيقونة + محرر الحقول (نوع، خيارات، معادلة، تجميع) + محرر الحالات ومسار الانتقالات. */
import { useState } from 'react';
import { useApp } from '../core/app-context.js';
import { wos, type Space } from '../lib/wos.js';
import { Button, Field, IconButton, Modal, Segmented, cx } from '../ui/ui.js';
import { Icon } from '../lib/icons.js';
import { checkFormula, FORMULA_FUNCTIONS } from '../../../shared/formula.js';
import { FIELD_KINDS, FIELD_KIND_LABEL, STATUS_CATEGORY_LABEL, slugId, type FieldDef, type FieldKind, type StatusDef } from '../../../shared/wos.js';

const ICONS = ['layers', 'book', 'target', 'flag', 'check', 'star', 'heart', 'file', 'folder', 'pin', 'calendar', 'chart', 'zap', 'dumbbell', 'music', 'video', 'user', 'users', 'refresh', 'bookmark', 'tag', 'image', 'database', 'mail'] as const;
const COLORS = ['#5B45F0', '#7C5CFF', '#0369A1', '#0E7490', '#047857', '#12703F', '#B45309', '#C9A227', '#C23B2A', '#BE185D', '#596079', '#14172B'];

export function SpaceSettings({ space, onClose, onSaved }: { space: Space; onClose: () => void; onSaved: () => void }) {
  const { toast, reloadSpaces } = useApp();
  const [tab, setTab] = useState<'general' | 'fields' | 'statuses'>('fields');
  const [name, setName] = useState(space.name);
  const [desc, setDesc] = useState(space.description ?? '');
  const [icon, setIcon] = useState(space.icon);
  const [color, setColor] = useState(space.color);
  const [typeName, setTypeName] = useState(space.type.name);
  const [fields, setFields] = useState<FieldDef[]>(space.type.fields);
  const [statuses, setStatuses] = useState<StatusDef[]>(space.type.statuses);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const save = async (): Promise<void> => {
    for (const f of fields) {
      if (f.kind === 'formula') {
        const e = f.formula ? checkFormula(f.formula) : 'المعادلة فارغة';
        if (e) return setErr(`المعادلة في «${f.name}»: ${e}`);
      }
      if ((f.kind === 'select' || f.kind === 'multiselect') && !(f.options ?? []).length) return setErr(`أضف خيارًا واحدًا على الأقل للحقل «${f.name}»`);
    }
    if (!statuses.length) return setErr('حالة واحدة على الأقل');
    setBusy(true);
    try {
      await wos.editSpace(space.id, { name, description: desc || null, icon, color });
      await wos.setType(space.id, { name: typeName, icon, color, fields, statuses });
      toast('حُفظت إعدادات المساحة', { kind: 'ok' });
      void reloadSpaces();
      onSaved();
      onClose();
    } catch (e) {
      setErr((e as Error).message + ((e as { fields?: Record<string, string> }).fields ? ` — ${Object.values((e as { fields: Record<string, string> }).fields).join('، ')}` : ''));
      setBusy(false);
    }
  };

  const addField = (kind: FieldKind): void => {
    const nm = `${FIELD_KIND_LABEL[kind]} ${fields.length + 1}`;
    const id = slugId(kind, fields.map((f) => f.id));
    const f: FieldDef = { id, name: nm, kind, ...(kind === 'select' || kind === 'multiselect' ? { options: [{ id: 'a', name: 'خيار 1' }] } : {}), ...(kind === 'formula' ? { formula: '1 + 1' } : {}), ...(kind === 'rollup' ? { rollup: { source: 'children' as const, field: null, agg: 'count' as const } } : {}), ...(kind === 'currency' ? { currency: 'RM' } : {}) };
    setFields([...fields, f]);
  };
  const upd = (i: number, p: Partial<FieldDef>): void => setFields(fields.map((f, k) => (k === i ? { ...f, ...p } : f)));
  const move = <T,>(arr: T[], i: number, d: -1 | 1): T[] => { const n = [...arr]; const j = i + d; if (j < 0 || j >= n.length) return arr; [n[i], n[j]] = [n[j]!, n[i]!]; return n; };

  return (
    <Modal title={<>إعدادات «<bdi>{space.name}</bdi>»</>} onClose={onClose} wide footer={<>{err && <span className="err-inline" role="alert">{err}</span>}<Button variant="ghost" onClick={onClose}>إلغاء</Button><Button variant="primary" onClick={() => void save()} disabled={busy}>حفظ</Button></>}>
      <Segmented label="القسم" value={tab} onChange={setTab} options={[{ value: 'general', label: 'عام' }, { value: 'fields', label: `الحقول (${fields.length})` }, { value: 'statuses', label: `الحالات (${statuses.length})` }]} />
      <div style={{ height: 'var(--s-4)' }} />
      {tab === 'general' && (
        <div className="form-grid">
          <Field label="اسم المساحة" htmlFor="ss-name"><input id="ss-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} /></Field>
          <Field label="اسم نوع العنصر (مفرد)" htmlFor="ss-type" hint="مثل: كتاب، طلب، مهمة"><input id="ss-type" value={typeName} onChange={(e) => setTypeName(e.target.value)} maxLength={60} /></Field>
          <Field label="الوصف" htmlFor="ss-desc" full><textarea id="ss-desc" rows={2} value={desc} onChange={(e) => setDesc(e.target.value)} maxLength={1000} /></Field>
          <Field label="الأيقونة" htmlFor="ss-icon" full>
            <div id="ss-icon" className="icon-pick" role="radiogroup" aria-label="الأيقونة">
              {ICONS.map((ic) => <button key={ic} type="button" role="radio" aria-checked={icon === ic} aria-label={ic} className={cx(icon === ic && 'on')} onClick={() => setIcon(ic)}><Icon name={ic} size={18} /></button>)}
            </div>
          </Field>
          <Field label="اللون" htmlFor="ss-color" full>
            <div id="ss-color" className="color-pick" role="radiogroup" aria-label="اللون">
              {COLORS.map((c) => <button key={c} type="button" role="radio" aria-checked={color === c} aria-label={c} className={cx(color === c && 'on')} style={{ background: c }} onClick={() => setColor(c)} />)}
            </div>
          </Field>
        </div>
      )}
      {tab === 'fields' && (
        <div className="stack">
          {fields.map((f, i) => (
            <fieldset key={f.id} className="fdef">
              <legend className="sr-only">الحقل {f.name}</legend>
              <div className="fdef-row">
                <label className="sr-only" htmlFor={`fn-${f.id}`}>اسم الحقل</label>
                <input id={`fn-${f.id}`} value={f.name} onChange={(e) => upd(i, { name: e.target.value })} maxLength={60} />
                <span className="badge">{FIELD_KIND_LABEL[f.kind]}</span>
                <label className="row small" style={{ gap: 4 }}><input type="checkbox" checked={!!f.required} onChange={(e) => upd(i, { required: e.target.checked })} /> مطلوب</label>
                <IconButton icon="up" sm ghost label={`تحريك «${f.name}» لأعلى`} onClick={() => setFields(move(fields, i, -1))} />
                <IconButton icon="down" sm ghost label={`تحريك «${f.name}» لأسفل`} onClick={() => setFields(move(fields, i, 1))} />
                <IconButton icon="trash" sm ghost tone="danger" label={`حذف الحقل «${f.name}»`} onClick={() => setFields(fields.filter((_, k) => k !== i))} />
              </div>
              {(f.kind === 'select' || f.kind === 'multiselect') && (
                <div className="opt-edit">
                  {(f.options ?? []).map((o, k) => (
                    <span key={o.id} className="opt-row">
                      <input aria-label={`اسم الخيار ${k + 1}`} value={o.name} onChange={(e) => upd(i, { options: f.options!.map((x, j) => (j === k ? { ...x, name: e.target.value } : x)) })} maxLength={60} />
                      <input type="color" aria-label={`لون الخيار ${o.name}`} value={o.color ?? '#5B45F0'} onChange={(e) => upd(i, { options: f.options!.map((x, j) => (j === k ? { ...x, color: e.target.value.toUpperCase() } : x)) })} />
                      <IconButton icon="x" sm ghost label={`حذف الخيار ${o.name}`} onClick={() => upd(i, { options: f.options!.filter((_, j) => j !== k) })} />
                    </span>
                  ))}
                  <Button size="sm" icon="plus" onClick={() => upd(i, { options: [...(f.options ?? []), { id: slugId('o', (f.options ?? []).map((x) => x.id)), name: `خيار ${(f.options?.length ?? 0) + 1}` }] })}>خيار</Button>
                </div>
              )}
              {f.kind === 'formula' && (
                <div className="stack" style={{ gap: 4 }}>
                  <label className="small" htmlFor={`ff-${f.id}`}>المعادلة — استخدم أسماء الحقول بين أقواس: <code dir="ltr">{'{الحالي} / {المستهدف} * 100'}</code></label>
                  <input id={`ff-${f.id}`} dir="ltr" value={f.formula ?? ''} onChange={(e) => upd(i, { formula: e.target.value })} aria-invalid={!!(f.formula && checkFormula(f.formula))} />
                  <small className={f.formula && checkFormula(f.formula) ? 'err-inline' : 'muted'}>{f.formula && checkFormula(f.formula) ? `⚠ ${checkFormula(f.formula)}` : `الدوال: ${FORMULA_FUNCTIONS.join('، ')}`}</small>
                </div>
              )}
              {f.kind === 'rollup' && f.rollup && (
                <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
                  <label className="small">المصدر <select value={f.rollup.source} onChange={(e) => upd(i, { rollup: { ...f.rollup!, source: e.target.value as 'children' | 'relation' } })}><option value="children">العناصر الفرعية</option><option value="relation">العناصر المرتبطة</option></select></label>
                  <label className="small">التجميع <select value={f.rollup.agg} onChange={(e) => upd(i, { rollup: { ...f.rollup!, agg: e.target.value as 'count' } })}><option value="count">العدد</option><option value="percent_done">نسبة المنجز</option><option value="sum">المجموع</option><option value="avg">المتوسط</option><option value="min">الأدنى</option><option value="max">الأعلى</option></select></label>
                  {['sum', 'avg', 'min', 'max'].includes(f.rollup.agg) && <label className="small">الحقل <select value={f.rollup.field ?? ''} onChange={(e) => upd(i, { rollup: { ...f.rollup!, field: e.target.value || null } })}><option value="">—</option>{fields.filter((x) => ['number', 'currency', 'rating', 'progress'].includes(x.kind)).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label>}
                </div>
              )}
            </fieldset>
          ))}
          <div className="add-field">
            <span className="small muted">أضف حقلًا:</span>
            {FIELD_KINDS.filter((k) => k !== 'relation' && k !== 'status').map((k) => <button key={k} type="button" className="chip" onClick={() => addField(k)}>+ {FIELD_KIND_LABEL[k]}</button>)}
          </div>
          <p className="muted small">«الروابط» متاحة لكل عنصر دون حقل (قسم «مرتبط بـ» في لوحة العنصر). حذف حقل لا يحذف القيم فورًا؛ تُتجاهل ثم تسقط عند التعديل التالي.</p>
        </div>
      )}
      {tab === 'statuses' && (
        <div className="stack">
          {statuses.map((s, i) => (
            <fieldset key={s.id} className="fdef">
              <legend className="sr-only">الحالة {s.name}</legend>
              <div className="fdef-row">
                <input type="color" aria-label={`لون «${s.name}»`} value={s.color} onChange={(e) => setStatuses(statuses.map((x, k) => (k === i ? { ...x, color: e.target.value.toUpperCase() } : x)))} />
                <label className="sr-only" htmlFor={`sn-${s.id}`}>اسم الحالة</label>
                <input id={`sn-${s.id}`} value={s.name} onChange={(e) => setStatuses(statuses.map((x, k) => (k === i ? { ...x, name: e.target.value } : x)))} maxLength={40} />
                <label className="sr-only" htmlFor={`sc-${s.id}`}>الفئة</label>
                <select id={`sc-${s.id}`} value={s.category} onChange={(e) => setStatuses(statuses.map((x, k) => (k === i ? { ...x, category: e.target.value as StatusDef['category'] } : x)))}>
                  {(['todo', 'active', 'done', 'blocked'] as const).map((c) => <option key={c} value={c}>{STATUS_CATEGORY_LABEL[c]}</option>)}
                </select>
                <IconButton icon="up" sm ghost label={`تحريك «${s.name}» لأعلى`} onClick={() => setStatuses(move(statuses, i, -1))} />
                <IconButton icon="down" sm ghost label={`تحريك «${s.name}» لأسفل`} onClick={() => setStatuses(move(statuses, i, 1))} />
                <IconButton icon="trash" sm ghost tone="danger" label={`حذف الحالة «${s.name}»`} onClick={() => setStatuses(statuses.filter((_, k) => k !== i).map((x) => ({ ...x, ...(x.next ? { next: x.next.filter((n) => n !== s.id) } : {}) })))} />
              </div>
              <details>
                <summary className="small">مسار الانتقال (اختياري): إلى أي حالات يمكن الانتقال من «{s.name}»؟ {s.next?.length ? `(${s.next.length})` : '(أي حالة)'}</summary>
                <div className="chip-set" role="group" aria-label={`الانتقالات المسموحة من ${s.name}`}>
                  {statuses.filter((x) => x.id !== s.id).map((x) => {
                    const on = s.next?.includes(x.id) ?? false;
                    return <button key={x.id} type="button" className={cx('chip', on && 'on')} aria-pressed={on} onClick={() => setStatuses(statuses.map((y, k) => (k === i ? { ...y, next: on ? (y.next ?? []).filter((n) => n !== x.id) : [...(y.next ?? []), x.id] } : y)))}>{x.name}</button>;
                  })}
                </div>
                <small className="muted">بدون اختيار = حرية كاملة. مع الاختيار يمنع الموقع القفز لحالة غير مسموحة (مثل Jira).</small>
              </details>
            </fieldset>
          ))}
          <Button size="sm" icon="plus" onClick={() => setStatuses([...statuses, { id: slugId('s', statuses.map((x) => x.id)), name: `حالة ${statuses.length + 1}`, color: '#596079', category: 'active' }])}>حالة جديدة</Button>
          <p className="muted small">حذف حالة ينقل عناصرها إلى أول حالة في القائمة.</p>
        </div>
      )}
    </Modal>
  );
}
