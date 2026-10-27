import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useApp } from '../core/app-context.js';
import { wos, type SpaceFull } from '../lib/wos.js';
import { PageHead } from '../ui/page.js';
import { BulkBar, Button, EmptyState, Field, KebabMenu, Modal, Skeleton, Switch, cx, useSelection } from '../ui/ui.js';
import { Icon } from '../lib/icons.js';
import { VIEW_COMPONENTS } from '../views/Views.js';
import { applyView, dateFields, groupableFields } from '../views/engine.js';
import { ItemPanel } from '../views/ItemPanel.js';
import { SpaceSettings } from '../views/SpaceSettings.js';
import { AutomationList } from '../views/Automations.js';
import { VIEW_KINDS, VIEW_KIND_LABEL, type FilterOp, type ViewConfig, type ViewFilter, type ViewKind } from '../../../shared/wos.js';

const KIND_ICON: Record<ViewKind, 'list' | 'board' | 'table' | 'calendar' | 'timer' | 'image' | 'chart'> = { list: 'list', board: 'board', table: 'table', calendar: 'calendar', timeline: 'timer', gallery: 'image', dashboard: 'chart' };
const OPS: { op: FilterOp; label: string }[] = [
  { op: 'is', label: 'يساوي' }, { op: 'is_not', label: 'لا يساوي' }, { op: 'contains', label: 'يحتوي' }, { op: 'empty', label: 'فارغ' }, { op: 'not_empty', label: 'غير فارغ' },
  { op: 'gt', label: 'أكبر من' }, { op: 'lt', label: 'أصغر من' }, { op: 'before', label: 'قبل' }, { op: 'after', label: 'بعد' },
];

export default function Space() {
  const { id = '' } = useParams();
  const [sp, setSp] = useSearchParams();
  const nav = useNavigate();
  const { toast, confirm, reloadSpaces, openCreate, spaces: allSpaces } = useApp();
  const [d, setD] = useState<SpaceFull | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [archived, setArchived] = useState(false);
  const [draft, setDraft] = useState<ViewConfig | null>(null);
  const [q, setQ] = useState('');
  const [modal, setModal] = useState<null | 'settings' | 'automations' | 'share' | 'newview' | 'template' | 'rename'>(null);
  const { sel, toggle, clear, setAll } = useSelection();

  const load = useCallback(async () => {
    try {
      setD(await wos.space(id, archived));
      setErr(null);
    } catch (e) {
      setErr((e as Error).message);
    }
  }, [id, archived]);
  useEffect(() => {
    void load();
    const on = (e: Event): void => {
      const sid = (e as CustomEvent<{ spaceId?: string }>).detail?.spaceId;
      if (!sid || sid === id) void load();
    };
    window.addEventListener('platform:items-changed', on);
    return () => window.removeEventListener('platform:items-changed', on);
  }, [load, id]);
  useEffect(() => { clear(); setDraft(null); }, [id, clear]);

  const viewId = sp.get('view');
  const view = d?.views.find((v) => v.id === viewId) ?? d?.views[0] ?? null;
  const kind: ViewKind = view?.kind ?? 'list';
  const raw: ViewConfig = draft ?? view?.config ?? {};
  // اللوحة/التقويم/المؤشرات تعرض المنجز افتراضيًا (عمود «منجز» لا يبقى فارغًا)؛ القائمة/الجدول تخفيه افتراضيًا
  const cfg: ViewConfig = { ...raw, showDone: raw.showDone ?? (kind === 'board' || kind === 'calendar' || kind === 'dashboard' || kind === 'gallery') };
  const dirty = draft !== null && JSON.stringify(draft) !== JSON.stringify(view?.config ?? {});
  useEffect(() => setDraft(null), [view?.id]);
  const setCfg = (p: Partial<ViewConfig>): void => setDraft({ ...raw, ...p });
  const items = useMemo(() => (d ? applyView(d.items, d.space.type, cfg, q) : []), [d, cfg, q]);
  const itemParam = sp.get('item');
  const setParam = (k: string, v: string | null): void => {
    const n = new URLSearchParams(sp);
    if (v === null) n.delete(k);
    else n.set(k, v);
    setSp(n, { replace: k === 'item' ? false : true });
  };

  if (err) return <div className="page"><EmptyState icon="warn" title="تعذّر فتح المساحة" text={err} action={<Button to="/spaces">كل المساحات</Button>} /></div>;
  if (!d) return <div className="page"><Skeleton h={40} w="35%" /><div style={{ height: 20 }} /><Skeleton h={300} r={20} /></div>;
  const { space } = d;
  const type = space.type;

  const patch = async (itemId: string, b: Parameters<typeof wos.editItem>[1]): Promise<void> => {
    try {
      await wos.editItem(itemId, b);
      await load();
      window.dispatchEvent(new CustomEvent('platform:items-changed', { detail: { spaceId: 'other' } }));
    } catch (e) {
      toast((e as Error).message, { kind: 'error' });
      void load();
    }
  };
  const add = async (b: { title: string; status?: string; due?: string; data?: Record<string, unknown> }): Promise<void> => {
    try {
      await wos.addItem(space.id, b);
      await load();
      void reloadSpaces();
    } catch (e) {
      toast((e as Error).message, { kind: 'error' });
    }
  };
  const bulk = async (op: Parameters<typeof wos.bulk>[1], extra: Parameters<typeof wos.bulk>[2] = {}): Promise<void> => {
    const ids = [...sel];
    try {
      const r = await wos.bulk(ids, op, extra);
      clear();
      await load();
      void reloadSpaces();
      const errs = r.errors?.length ? ` (${r.errors.length} تعذّر: ${r.errors[0]!.error})` : '';
      if (op === 'delete' && r.undo) toast(`حُذف ${ids.length} عنصر — في سلة المحذوفات`, { kind: 'ok', action: { label: 'تراجع', run: () => void wos.restore(r.undo!).then(load) } });
      else toast(`تم على ${r.count} عنصر${errs}`, { kind: r.errors?.length ? 'error' : 'ok' });
    } catch (e) {
      toast((e as Error).message, { kind: 'error' });
    }
  };
  const saveView = async (): Promise<void> => {
    if (!view || !draft) return;
    await wos.editView(view.id, { config: draft });
    setDraft(null);
    await load();
    toast('حُفظ العرض', { kind: 'ok' });
  };
  const onSort = (field: string): void => setCfg({ sort: cfg.sort?.field === field ? (cfg.sort.dir === 'asc' ? { field, dir: 'desc' } : null) : { field, dir: 'asc' } });
  const View = VIEW_COMPONENTS[kind];
  const done = d.items.filter((i) => !i.parent_id && i.done_at).length;
  const total = d.items.filter((i) => !i.parent_id).length;
  const sameType = (allSpaces ?? []).filter((s) => s.id !== space.id && s.type_id === space.type_id);

  return (
    <div className="page" style={{ '--sc': space.color } as never}>
      <PageHead
        title={<><bdi>{space.name}</bdi></>}
        icon={(space.icon || 'layers') as 'layers'}
        sub={<>{space.description ? <><bdi>{space.description}</bdi> · </> : null}{total} {type.name} · {done} منجز{space.archived ? ' · مؤرشفة' : ''}</>}
        crumbs={[{ to: '/spaces', label: 'مساحاتي' }, { label: space.name }]}
        actions={
          <>
            <Button icon="sliders" onClick={() => setModal('settings')}>الحقول والحالات</Button>
            <Button icon="zap" onClick={() => setModal('automations')}>الأتمتة {d.automations.length ? `(${d.automations.length})` : ''}</Button>
            <Button variant="primary" icon="plus" onClick={() => openCreate({ kind: 'quick-item', spaceId: space.id })}>{type.name} جديد</Button>
            <KebabMenu
              label="المزيد من إجراءات المساحة"
              items={[
                { label: 'مشاركة (رابط قراءة فقط)', icon: 'link', onClick: () => setModal('share') },
                { label: 'تصدير JSON', icon: 'download', onClick: () => void (location.href = wos.exportUrl(space.id, 'json')) },
                { label: 'تصدير CSV (Excel)', icon: 'table', onClick: () => void (location.href = wos.exportUrl(space.id, 'csv')) },
                { label: 'طباعة العرض', icon: 'print', onClick: () => window.print() },
                { label: 'حفظ كقالب', icon: 'copy', onClick: () => setModal('template') },
                { label: 'تكرار المساحة', icon: 'copy', onClick: () => void wos.dupSpace(space.id).then((s) => { void reloadSpaces(); nav(`/spaces/${s.id}`); toast('نُسخت المساحة', { kind: 'ok' }); }) },
                { label: space.archived ? 'إلغاء أرشفة المساحة' : 'أرشفة المساحة', icon: 'archive', onClick: () => void wos.editSpace(space.id, { archived: !space.archived }).then(() => { void load(); void reloadSpaces(); }) },
                {
                  label: 'حذف المساحة', icon: 'trash', danger: true, onClick: async () => {
                    if (!(await confirm({ title: `حذف «${space.name}»؟`, body: `سيُحذف ${total} عنصرًا مع العروض والقواعد. يمكنك الاستعادة من سلة المحذوفات خلال 30 يومًا.`, danger: true, confirmLabel: 'حذف' }))) return;
                    const r = await wos.delSpace(space.id);
                    void reloadSpaces();
                    nav('/spaces');
                    toast(`حُذفت «${space.name}»`, { kind: 'ok', action: { label: 'تراجع', run: () => void wos.restore(r.undo).then(() => { void reloadSpaces(); nav(`/spaces/${space.id}`); }) } });
                  },
                },
              ]}
            />
          </>
        }
      />

      <div className="view-tabs">
        <div role="tablist" aria-label="العروض" className="vt-list">
        {d.views.map((v) => (
          <button key={v.id} role="tab" aria-selected={v.id === view?.id} className="vt" onClick={() => setParam('view', v.id)}>
            <span className="vt-ico" aria-hidden="true"><Icon name={KIND_ICON[v.kind]} size={15} /></span>{v.name}
          </button>
        ))}
        </div>
        <button type="button" className="vt add" onClick={() => setModal('newview')}><Icon name="plus" size={15} /> عرض<span className="sr-only"> جديد</span></button>
      </div>

      <div className="toolbar" role="toolbar" aria-label="أدوات العرض">
        <label className="sr-only" htmlFor="sp-q">تصفية بالنص</label>
        <input id="sp-q" type="search" placeholder="تصفية…" value={q} onChange={(e) => setQ(e.target.value)} />
        {(kind === 'list' || kind === 'board') && (
          <label className="tb-l">تجميع
            <select value={cfg.groupBy ?? (kind === 'board' ? 'status' : '')} onChange={(e) => setCfg({ groupBy: e.target.value || null })}>
              {kind === 'list' && <option value="">بلا تجميع</option>}
              {groupableFields(type).map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </label>
        )}
        {(kind === 'calendar' || kind === 'timeline') && kind === 'calendar' && (
          <label className="tb-l">التاريخ
            <select value={cfg.dateField ?? 'due'} onChange={(e) => setCfg({ dateField: e.target.value })}>
              {dateFields(type).map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </label>
        )}
        <label className="tb-l">ترتيب
          <select value={cfg.sort ? `${cfg.sort.field}:${cfg.sort.dir}` : ''} onChange={(e) => { const [f, dir] = e.target.value.split(':'); setCfg({ sort: f ? { field: f, dir: (dir as 'asc' | 'desc') ?? 'asc' } : null }); }}>
            <option value="">يدوي</option>
            {[{ id: 'title', name: 'العنوان' }, { id: 'due', name: 'الموعد' }, { id: 'status', name: 'الحالة' }, { id: 'created_at', name: 'تاريخ الإنشاء' }, ...type.fields.filter((f) => !['longtext', 'relation', 'multiselect'].includes(f.kind))].flatMap((f) => [<option key={`${f.id}a`} value={`${f.id}:asc`}>{f.name} ↑</option>, <option key={`${f.id}d`} value={`${f.id}:desc`}>{f.name} ↓</option>])}
          </select>
        </label>
        <Switch checked={!!cfg.showDone} onChange={(v) => setCfg({ showDone: v })} label="إظهار المنجز" />
        <Switch checked={archived} onChange={setArchived} label="المؤرشف" />
        <FilterBuilder filters={cfg.filters ?? []} onChange={(filters) => setCfg({ filters })} type={type} />
        {dirty && <><Button size="sm" variant="primary" icon="save" onClick={() => void saveView()}>حفظ العرض</Button><Button size="sm" variant="ghost" onClick={() => setDraft(null)}>تجاهل</Button></>}
        {view && (
          <KebabMenu
            label="إجراءات العرض"
            items={[
              { label: 'إعادة تسمية العرض', icon: 'edit', onClick: () => setModal('rename') },
              ...(d.views.length > 1 ? [{ label: 'حذف العرض', icon: 'trash' as const, danger: true, onClick: () => void wos.delView(view.id).then((r) => { setParam('view', null); void load(); toast(`حُذف العرض «${view.name}»`, { kind: 'ok', action: { label: 'تراجع', run: () => void wos.restore(r.undo).then(load) } }); }) }] : []),
            ]}
          />
        )}
      </div>

      <BulkBar count={sel.size} onClear={clear} total={items.length} onAll={() => setAll(items.map((i) => i.id))}>
        <label className="sr-only" htmlFor="bulk-st">تغيير الحالة للمحدد</label>
        <select id="bulk-st" value="" onChange={(e) => e.target.value && void bulk('update', { patch: { status: e.target.value } })}>
          <option value="">الحالة…</option>
          {type.statuses.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        {sameType.length > 0 && (
          <select aria-label="نقل المحدد إلى مساحة" value="" onChange={(e) => e.target.value && void bulk('move', { space_id: e.target.value })}>
            <option value="">نقل إلى…</option>
            {sameType.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        )}
        <Button size="sm" icon="archive" onClick={() => void bulk(archived ? 'unarchive' : 'archive')}>{archived ? 'إلغاء الأرشفة' : 'أرشفة'}</Button>
        <Button size="sm" variant="danger" icon="trash" onClick={() => void bulk('delete')}>حذف</Button>
      </BulkBar>

      <div className={cx('view-host', `vk-${kind}`)}>
        {!d.items.length && !archived && (
          <div className="callout" style={{ marginBlockEnd: 'var(--s-3)' }}>
            <Icon name={(space.icon || 'layers') as 'layers'} size={18} /> <span>لا {type.name} بعد — اكتب في سطر «إضافة…» واضغط Enter، أو استخدم «{type.name} جديد». يمكنك تغيير الحقول والحالات في أي وقت.</span>
          </div>
        )}
        <View type={type} items={items} config={cfg} onOpen={(iid) => setParam('item', iid)} onPatch={patch} onAdd={add} onAddAt={(due) => openCreate({ kind: 'quick-item', spaceId: space.id, due })} sel={sel} toggleSel={toggle} onSort={onSort} {...(kind === 'dashboard' ? { all: d.items } : {})} />
        {d.items.length > 0 && !items.length && kind !== 'dashboard' && <p className="muted" style={{ marginBlockStart: 'var(--s-3)' }}>لا عناصر تطابق المرشحات الحالية{!cfg.showDone ? ' (المنجز مخفي — فعّل «إظهار المنجز»)' : ''}.</p>}
      </div>

      {itemParam && <ItemPanel id={itemParam} onClose={() => setParam('item', null)} onChanged={() => void load()} />}
      {modal === 'settings' && <SpaceSettings space={space} onClose={() => setModal(null)} onSaved={() => void load()} />}
      {modal === 'automations' && <Modal title={<>أتمتة «<bdi>{space.name}</bdi>»</>} onClose={() => setModal(null)} wide><AutomationList space={space} rules={d.automations} onChanged={() => void load()} /></Modal>}
      {modal === 'share' && <ShareModal spaceId={space.id} onClose={() => setModal(null)} viewId={view?.id} />}
      {modal === 'newview' && <NewView onClose={() => setModal(null)} onCreate={async (name, k) => { const v = await wos.addView({ scope: `space:${space.id}`, name, kind: k, config: k === 'board' ? { groupBy: 'status' } : {} }); setModal(null); await load(); setParam('view', v.id); }} />}
      {modal === 'rename' && view && <RenameView name={view.name} onClose={() => setModal(null)} onSave={async (n) => { await wos.editView(view.id, { name: n }); setModal(null); await load(); }} />}
      {modal === 'template' && <SaveTemplate onClose={() => setModal(null)} spaceId={space.id} name={space.name} />}
    </div>
  );
}

function FilterBuilder({ filters, onChange, type }: { filters: ViewFilter[]; onChange: (f: ViewFilter[]) => void; type: SpaceFull['space']['type'] }) {
  const [open, setOpen] = useState(false);
  const fields = [{ id: 'title', name: 'العنوان', kind: 'text' }, { id: 'status', name: 'الحالة', kind: 'status' }, { id: 'due', name: 'الموعد', kind: 'date' }, ...type.fields.filter((f) => f.kind !== 'relation')];
  return (
    <>
      <Button size="sm" icon="filter" onClick={() => setOpen(true)}>مرشحات{filters.length ? ` (${filters.length})` : ''}</Button>
      {open && (
        <Modal title="المرشحات" onClose={() => setOpen(false)} footer={<><Button variant="ghost" onClick={() => onChange([])}>مسح الكل</Button><Button variant="primary" onClick={() => setOpen(false)}>تم</Button></>}>
          <div className="stack">
            {filters.map((f, i) => {
              const fd = fields.find((x) => x.id === f.field);
              const opts = fd?.id === 'status' ? type.statuses.map((s) => ({ id: s.id, name: s.name })) : fd && 'options' in fd ? (fd.options ?? []) : null;
              const set = (p: Partial<ViewFilter>): void => onChange(filters.map((x, k) => (k === i ? { ...x, ...p } : x)));
              return (
                <div key={i} className="filter-row">
                  <select aria-label="الحقل" value={f.field} onChange={(e) => set({ field: e.target.value, value: null })}>{fields.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select>
                  <select aria-label="الشرط" value={f.op} onChange={(e) => set({ op: e.target.value as FilterOp })}>{OPS.map((o) => <option key={o.op} value={o.op}>{o.label}</option>)}</select>
                  {f.op !== 'empty' && f.op !== 'not_empty' && (opts ? (
                    <select aria-label="القيمة" value={String(f.value ?? '')} onChange={(e) => set({ value: e.target.value })}><option value="">—</option>{opts.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}</select>
                  ) : <input aria-label="القيمة" type={fd?.kind === 'date' ? 'date' : 'text'} value={String(f.value ?? '')} onChange={(e) => set({ value: e.target.value })} />)}
                  <button type="button" className="icon-btn sm ghost" aria-label="حذف المرشح" onClick={() => onChange(filters.filter((_, k) => k !== i))}><Icon name="x" size={14} /></button>
                </div>
              );
            })}
            <Button size="sm" icon="plus" onClick={() => onChange([...filters, { field: 'status', op: 'is', value: type.statuses[0]?.id ?? '' }])}>مرشح</Button>
            <p className="muted small">المرشحات تنطبق على هذا العرض؛ اضغط «حفظ العرض» لتثبيتها.</p>
          </div>
        </Modal>
      )}
    </>
  );
}

function NewView({ onClose, onCreate }: { onClose: () => void; onCreate: (name: string, k: ViewKind) => Promise<void> }) {
  const [k, setK] = useState<ViewKind>('board');
  const [name, setName] = useState('');
  return (
    <Modal title="عرض جديد" onClose={onClose} footer={<><Button variant="ghost" onClick={onClose}>إلغاء</Button><Button variant="primary" onClick={() => void onCreate(name.trim() || VIEW_KIND_LABEL[k], k)}>إنشاء</Button></>}>
      <div className="view-kinds" role="radiogroup" aria-label="نوع العرض">
        {VIEW_KINDS.map((x) => (
          <button key={x} type="button" role="radio" aria-checked={k === x} className={cx('vk-opt', k === x && 'on')} onClick={() => setK(x)}><Icon name={KIND_ICON[x]} size={22} /><span>{VIEW_KIND_LABEL[x]}</span></button>
        ))}
      </div>
      <Field label="اسم العرض" htmlFor="nv-name"><input id="nv-name" value={name} onChange={(e) => setName(e.target.value)} placeholder={VIEW_KIND_LABEL[k]} maxLength={60} /></Field>
    </Modal>
  );
}

function ShareModal({ spaceId, viewId, onClose }: { spaceId: string; viewId?: string | undefined; onClose: () => void }) {
  const { toast } = useApp();
  const [rows, setRows] = useState<{ token: string; created_at: string }[] | null>(null);
  const load = useCallback(() => void wos.shares(`space:${spaceId}`).then(setRows), [spaceId]);
  useEffect(load, [load]);
  const url = (t: string): string => `${location.origin}/p/${t}`;
  return (
    <Modal title="مشاركة للقراءة فقط" onClose={onClose}>
      <p className="muted">ينشئ رابطًا يعرض هذه المساحة دون إمكانية التعديل. {location.hostname === '127.0.0.1' || location.hostname === 'localhost' ? 'في نسخة الجهاز يعمل الرابط على هذا الجهاز فقط؛ في النسخة المنشورة يعمل لأي شخص معه الرابط.' : 'يعمل لأي شخص معه الرابط.'} يمكنك إلغاؤه في أي وقت.</p>
      <Button variant="primary" icon="link" onClick={() => void wos.share(`space:${spaceId}`, viewId).then((r) => { load(); void navigator.clipboard?.writeText(url(r.token)).catch(() => undefined); toast('أُنشئ الرابط ونُسخ', { kind: 'ok' }); })}>إنشاء رابط</Button>
      <ul className="plain share-list">
        {(rows ?? []).map((r) => (
          <li key={r.token}>
            <input readOnly value={url(r.token)} aria-label="رابط المشاركة" dir="ltr" onFocus={(e) => e.target.select()} />
            <Button size="sm" variant="ghost" onClick={() => void wos.unshare(r.token).then(load)}>إلغاء</Button>
          </li>
        ))}
      </ul>
    </Modal>
  );
}

function SaveTemplate({ spaceId, name, onClose }: { spaceId: string; name: string; onClose: () => void }) {
  const { toast } = useApp();
  const [n, setN] = useState(name);
  const [desc, setDesc] = useState('');
  const [withItems, setWithItems] = useState(false);
  return (
    <Modal title="حفظ كقالب" onClose={onClose} footer={<><Button variant="ghost" onClick={onClose}>إلغاء</Button><Button variant="primary" onClick={() => void wos.saveTemplate(spaceId, { name: n, description: desc, with_items: withItems }).then(() => { toast('حُفظ القالب — تجده في «القوالب»', { kind: 'ok' }); onClose(); })}>حفظ</Button></>}>
      <div className="form-grid">
        <Field label="اسم القالب" htmlFor="st-n"><input id="st-n" value={n} onChange={(e) => setN(e.target.value)} maxLength={80} /></Field>
        <Field label="وصف" htmlFor="st-d"><input id="st-d" value={desc} onChange={(e) => setDesc(e.target.value)} maxLength={300} /></Field>
        <Switch checked={withItems} onChange={setWithItems} label="تضمين العناصر الحالية" />
      </div>
    </Modal>
  );
}

function RenameView({ name, onClose, onSave }: { name: string; onClose: () => void; onSave: (n: string) => Promise<void> }) {
  const [n, setN] = useState(name);
  return (
    <Modal title="إعادة تسمية العرض" onClose={onClose} footer={<><Button variant="ghost" onClick={onClose}>إلغاء</Button><Button variant="primary" disabled={!n.trim()} onClick={() => void onSave(n.trim())}>حفظ</Button></>}>
      <Field label="اسم العرض" htmlFor="rv-n"><input id="rv-n" value={n} onChange={(e) => setN(e.target.value)} maxLength={60} onKeyDown={(e) => e.key === 'Enter' && n.trim() && void onSave(n.trim())} /></Field>
    </Modal>
  );
}
