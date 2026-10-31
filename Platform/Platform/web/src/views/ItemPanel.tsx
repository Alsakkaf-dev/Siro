/** لوحة تفاصيل العنصر (الجانبية): كل شيء عن العنصر في مكان واحد دون مغادرة العرض. */
import { useCallback, useEffect, useState } from 'react';
import { useApp } from '../core/app-context.js';
import { wos, type ItemFull } from '../lib/wos.js';
import { Button, Drawer, Field, KebabMenu, Skeleton, cx } from '../ui/ui.js';
import { FieldEditor, StatusSelect } from './fields.js';
import { RelationsList } from '../widgets/relations.js';
import { ActivityList } from '../pages/Activity.js';
import { Icon } from '../lib/icons.js';
import type { WosItem } from '../../../shared/wos.js';

export function ItemPanel({ id, onClose, onChanged }: { id: string; onClose: () => void; onChanged: () => void }) {
  const { toast } = useApp();
  const [d, setD] = useState<ItemFull | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [rev, setRev] = useState(0);
  const load = useCallback(() => {
    wos.item(id).then((x) => { setD(x); setTitle(x.item.title); setErr(null); }).catch((e: Error) => setErr(e.message));
  }, [id]);
  useEffect(load, [load]);
  const patch = async (b: Parameters<typeof wos.editItem>[1], target = id): Promise<void> => {
    try {
      await wos.editItem(target, b);
      load();
      setRev((r) => r + 1);
      onChanged();
    } catch (e) {
      toast((e as Error).message, { kind: 'error' });
      load();
    }
  };
  const del = async (): Promise<void> => {
    const r = await wos.delItem(id);
    onChanged();
    onClose();
    toast(`حُذف «${d?.item.title ?? ''}» — في سلة المحذوفات`, { kind: 'ok', action: { label: 'تراجع', run: () => void wos.restore(r.undo).then(onChanged) } });
  };
  if (err) return <Drawer title="العنصر" onClose={onClose}><p className="muted">{err}</p></Drawer>;
  if (!d) return <Drawer title="…" onClose={onClose}><Skeleton h={30} /><div style={{ height: 12 }} /><Skeleton h={200} /></Drawer>;
  const { item, space, children } = d;
  const type = space.type;
  const doneStatus = type.statuses.find((s) => s.category === 'done')?.id;
  const todoStatus = type.statuses.find((s) => s.category === 'todo')?.id ?? type.statuses[0]?.id;
  return (
    <Drawer
      title={<><Icon name={(type.icon || 'layers') as 'layers'} size={18} /> <bdi>{space.name}</bdi></>}
      onClose={onClose}
      actions={
        <KebabMenu
          label="إجراءات العنصر"
          items={[
            { label: 'نسخ الرابط', icon: 'link', onClick: () => void navigator.clipboard?.writeText(`${location.origin}/spaces/${space.id}?item=${item.id}`).then(() => toast('نُسخ الرابط', { kind: 'ok' })) },
            { label: 'تكرار', icon: 'copy', onClick: () => void wos.dupItem(item.id).then(() => { onChanged(); toast('تم التكرار', { kind: 'ok' }); }) },
            { label: item.archived ? 'إلغاء الأرشفة' : 'أرشفة', icon: 'archive', onClick: () => void patch({ archived: !item.archived }) },
            { label: 'حذف', icon: 'trash', danger: true, onClick: () => void del() },
          ]}
        />
      }
    >
      <div className="stack ip">
        <label className="sr-only" htmlFor="ip-title">العنوان</label>
        <textarea id="ip-title" className="ip-title" rows={1} value={title} onChange={(e) => setTitle(e.target.value)} onBlur={() => title.trim() && title !== item.title && void patch({ title: title.trim() })} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); (e.target as HTMLTextAreaElement).blur(); } }} />
        {item.archived && <p className="callout warn">هذا العنصر مؤرشف — لا يظهر في العروض. <button type="button" className="link-btn" onClick={() => void patch({ archived: false })}>إلغاء الأرشفة</button></p>}
        <div className="form-grid ip-core">
          <Field label="الحالة" htmlFor="ip-status">
            <span id="ip-status"><StatusSelect statuses={type.statuses} value={item.status} onChange={(s) => void patch({ status: s })} /></span>
          </Field>
          <Field label="الموعد" htmlFor="ip-due"><input id="ip-due" type="date" value={item.due ?? ''} onChange={(e) => void patch({ due: e.target.value || null })} /></Field>
          <Field label="البداية" htmlFor="ip-start"><input id="ip-start" type="date" value={item.start ?? ''} onChange={(e) => void patch({ start: e.target.value || null })} /></Field>
        </div>
        {type.fields.length > 0 && (
          <section aria-label="الحقول" className="form-grid ip-fields">
            {type.fields.filter((f) => f.kind !== 'relation').map((f) => (
              <Field key={f.id} label={f.name} htmlFor={`ip-f-${f.id}`} full={f.kind === 'longtext'}>
                <FieldEditor f={f} v={item.computed?.[f.id] ?? item.data[f.id]} id={`ip-f-${f.id}`} onChange={(v) => void patch({ data: { [f.id]: v } })} />
              </Field>
            ))}
          </section>
        )}
        <section aria-label="العناصر الفرعية">
          <h3 className="ip-h">العناصر الفرعية <span className="muted num">{children.filter((c) => c.done_at).length}/{children.length}</span></h3>
          <ul className="plain sub-list">
            {children.map((c: WosItem) => (
              <li key={c.id} className={cx(c.done_at && 'done')}>
                <button type="button" className="ag-check" aria-pressed={!!c.done_at} aria-label={c.done_at ? `إلغاء إنجاز «${c.title}»` : `تعليم «${c.title}» كمنجز`} onClick={() => void patch({ status: c.done_at ? todoStatus : doneStatus }, c.id)}>{c.done_at && <Icon name="check" size={14} />}</button>
                <span><bdi>{c.title}</bdi></span>
              </li>
            ))}
          </ul>
          <SubAdd onAdd={async (t) => { await wos.addItem(space.id, { title: t, parent_id: item.id }); load(); onChanged(); }} />
        </section>
        <section aria-label="مرتبط بـ">
          <h3 className="ip-h">مرتبط بـ</h3>
          <RelationsList refId={`wos:${item.id}`} compact />
        </section>
        <section aria-label="النشاط">
          <h3 className="ip-h">النشاط</h3>
          <ActivityList key={rev} refFilter={`wos:${item.id}`} limit={20} compact />
        </section>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <small className="muted">أُنشئ {new Date(item.created_at).toLocaleDateString('ar')}{item.done_at ? ` · أُنجز ${new Date(item.done_at).toLocaleDateString('ar')}` : ''}</small>
          <Button size="sm" variant="ghost" icon="trash" onClick={() => void del()}>حذف</Button>
        </div>
      </div>
    </Drawer>
  );
}

function SubAdd({ onAdd }: { onAdd: (t: string) => Promise<void> }) {
  const [v, setV] = useState('');
  return (
    <form className="quick-add" onSubmit={(e) => { e.preventDefault(); const t = v.trim(); if (t) { setV(''); void onAdd(t); } }}>
      <Icon name="plus" size={15} aria-hidden="true" />
      <input value={v} onChange={(e) => setV(e.target.value)} placeholder="عنصر فرعي… (Enter)" aria-label="إضافة عنصر فرعي" maxLength={300} />
    </form>
  );
}
