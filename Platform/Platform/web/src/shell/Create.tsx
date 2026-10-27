/** طبقة «إنشاء (+)» العامة: قائمة كل ما يمكن إنشاؤه + نماذج سريعة (عنصر، تقييم، ملاحظة) من أي صفحة. */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../core/app-context.js';
import { PLUGINS } from '../core/plugins.config.js';
import type { CreateAction } from '../core/plugin.js';
import { usePluginCtx } from './Shell.js';
import { Icon } from '../lib/icons.js';
import { api } from '../lib/api.js';
import { wos } from '../lib/wos.js';
import { Button, Field, Modal } from '../ui/ui.js';
import { AssessmentForm, NoteForm } from '../forms/lazy.js';
import type { SemesterBundle } from '../../../shared/types.js';

export default function CreateLayer() {
  const { createCmd, openCreate } = useApp();
  if (!createCmd) return null;
  const close = (): void => openCreate(null);
  if (createCmd.kind === 'menu') return <CreateMenu onClose={close} />;
  if (createCmd.kind === 'quick-item') return <QuickItem onClose={close} spaceId={createCmd.spaceId} due={createCmd.due} />;
  if (createCmd.kind === 'quick-assessment') return <QuickAssessment onClose={close} courseId={createCmd.courseId} />;
  return <QuickNote onClose={close} />;
}

function CreateMenu({ onClose }: { onClose: () => void }) {
  const { openCreate } = useApp();
  const ctx = usePluginCtx();
  const nav = useNavigate();
  const loc = useLocation();
  const inSpace = /^\/spaces\/([A-Za-z0-9_-]+)$/.exec(loc.pathname)?.[1];
  const spaceName = inSpace ? ctx.spaces.find((s) => s.id === inSpace)?.name : undefined;
  const groups = PLUGINS.filter((p) => p.create?.length).map((p) => ({ p, items: p.create! }));
  const run = (a: CreateAction): void => {
    if (a.command) return openCreate(a.command === 'quick-item' ? { kind: 'quick-item', ...(inSpace ? { spaceId: inSpace } : {}) } : { kind: a.command });
    const to = a.to?.(ctx);
    onClose();
    if (to) nav(to);
  };
  const first = useRef<HTMLButtonElement>(null);
  useEffect(() => first.current?.focus(), []);
  return (
    <Modal title="إنشاء جديد" onClose={onClose} wide>
      {spaceName && (
        <button ref={first} type="button" className="create-hero" onClick={() => openCreate({ kind: 'quick-item', spaceId: inSpace! })}>
          <Icon name="plus" size={18} /> <span>عنصر جديد في «<bdi>{spaceName}</bdi>»</span>
        </button>
      )}
      <div className="create-grid">
        {groups.map(({ p, items }, gi) => (
          <section key={p.id} className="create-group" style={{ '--lc': p.color } as never} aria-label={p.name.ar}>
            <h3><i className="lc-dot" aria-hidden="true" /> {p.name.ar}</h3>
            {items.map((a, i) => {
              const disabled = !!a.to && a.to(ctx) === null;
              return (
                <button key={a.id} ref={!spaceName && gi === 0 && i === 0 ? first : undefined} type="button" className="create-opt" disabled={disabled} onClick={() => run(a)}>
                  <Icon name={a.icon} size={18} />
                  <span>{a.label}{a.sub && <small>{a.sub}</small>}</span>
                </button>
              );
            })}
          </section>
        ))}
      </div>
    </Modal>
  );
}

function QuickItem({ onClose, spaceId, due }: { onClose: () => void; spaceId?: string | undefined; due?: string | undefined }) {
  const { spaces, reloadSpaces, toast } = useApp();
  const nav = useNavigate();
  const last = (): string => {
    try {
      return localStorage.getItem('platform.lastSpace') ?? '';
    } catch {
      return '';
    }
  };
  const [sid, setSid] = useState(spaceId ?? '');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(due ?? '');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    if (!sid && spaces?.length) setSid(spaces.find((s) => s.id === last())?.id ?? spaces[0]!.id);
  }, [spaces, sid]);
  const save = async (andOpen: boolean): Promise<void> => {
    if (!title.trim()) return setErr('العنوان مطلوب');
    setBusy(true);
    try {
      let target = sid;
      if (!target) {
        // لا مساحات بعد: ننشئ «مهامي» تلقائيًا من القالب
        target = (await wos.createSpace({ template_id: 'tasks' })).id;
        await reloadSpaces();
      }
      const it = await wos.addItem(target, { title: title.trim(), ...(date ? { due: date } : {}) });
      try {
        localStorage.setItem('platform.lastSpace', target);
      } catch {
        /* تجاهل */
      }
      onClose();
      void reloadSpaces();
      window.dispatchEvent(new CustomEvent('platform:items-changed', { detail: { spaceId: target } }));
      toast(`أُضيف «${it.title}»`, { kind: 'ok', action: { label: 'افتح', run: () => nav(`/spaces/${target}?item=${it.id}`) } });
      if (andOpen) nav(`/spaces/${target}?item=${it.id}`);
    } catch (e) {
      setErr((e as Error).message);
      setBusy(false);
    }
  };
  return (
    <Modal
      title="عنصر جديد"
      onClose={onClose}
      footer={<><Button variant="ghost" onClick={onClose}>إلغاء</Button><Button onClick={() => void save(true)} disabled={busy}>حفظ وفتح</Button><Button variant="primary" onClick={() => void save(false)} disabled={busy}>حفظ</Button></>}
    >
      <form className="form-grid" onSubmit={(e) => { e.preventDefault(); void save(false); }}>
        <Field label="العنوان" full error={err ?? undefined} htmlFor="qi-title">
          <input id="qi-title" autoFocus value={title} onChange={(e) => { setTitle(e.target.value); setErr(null); }} placeholder="مثال: قراءة الفصل 3، التقديم على تدريب…" maxLength={300} />
        </Field>
        <Field label="المساحة" htmlFor="qi-space" hint={spaces?.length ? undefined : 'ستُنشأ مساحة «مهامي» تلقائيًا'}>
          <select id="qi-space" value={sid} onChange={(e) => setSid(e.target.value)} disabled={!spaces?.length}>
            {(spaces ?? []).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            {!spaces?.length && <option value="">مهامي (جديدة)</option>}
          </select>
        </Field>
        <Field label="الموعد (اختياري)" htmlFor="qi-due">
          <input id="qi-due" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <button type="submit" hidden />
      </form>
    </Modal>
  );
}

function useActiveBundle(): SemesterBundle | null {
  const { activeId } = useApp();
  const [b, setB] = useState<SemesterBundle | null>(null);
  useEffect(() => {
    if (activeId) api.bundle(activeId).then(setB).catch(() => setB(null));
  }, [activeId]);
  return b;
}

function QuickAssessment({ onClose, courseId }: { onClose: () => void; courseId?: string | undefined }) {
  const b = useActiveBundle();
  const { toast, reloadSemesters, activeId } = useApp();
  const nav = useNavigate();
  const [cid, setCid] = useState(courseId ?? '');
  const [step, setStep] = useState<'pick' | 'form'>(courseId ? 'form' : 'pick');
  const course = useMemo(() => b?.courses.find((c) => c.id === cid), [b, cid]);
  useEffect(() => {
    if (b && !cid && b.courses[0]) setCid(b.courses[0].id);
  }, [b, cid]);
  if (!b) return <Modal title="تقييم جديد" onClose={onClose}><p className="muted">{activeId ? 'جارٍ التحميل…' : 'لا يوجد فصل نشط بعد — أنشئ فصلًا أولًا من «الفصول».'}</p></Modal>;
  if (step === 'pick' || !course)
    return (
      <Modal title="تقييم جديد — اختر المادة" onClose={onClose} footer={<><Button variant="ghost" onClick={onClose}>إلغاء</Button><Button variant="primary" disabled={!course} onClick={() => setStep('form')}>متابعة</Button></>}>
        <div className="pick-list" role="radiogroup" aria-label="المادة">
          {b.courses.map((c) => (
            <label key={c.id} className={`pick ${cid === c.id ? 'on' : ''}`}>
              <input type="radio" name="qa-course" checked={cid === c.id} onChange={() => setCid(c.id)} />
              <i className="dot" style={{ background: c.color }} aria-hidden="true" />
              <span><bdi>{c.code}</bdi> — <bdi>{c.name}</bdi></span>
            </label>
          ))}
        </div>
      </Modal>
    );
  return (
    <AssessmentForm
      sem={b.semester}
      onClose={onClose}
      onSave={async (d) => {
        await api.addAssessment(course.id, d);
        onClose();
        void reloadSemesters();
        window.dispatchEvent(new CustomEvent('platform:sem-changed'));
        const base = `/academic/s/${b.semester.id}`;
        toast(`أُضيف التقييم إلى ${course.code} — راجع أثره على هدفك`, { kind: 'ok', action: { label: 'الحاسبة', run: () => nav(`${base}/calculator?course=${course.id}`) } });
      }}
    />
  );
}

function QuickNote({ onClose }: { onClose: () => void }) {
  const b = useActiveBundle();
  const { toast } = useApp();
  if (!b) return <Modal title="ملاحظة جديدة" onClose={onClose}><p className="muted">جارٍ التحميل…</p></Modal>;
  return (
    <NoteForm
      courses={b.courses}
      onClose={onClose}
      onSave={async (d) => {
        await api.addNote(b.semester.id, d);
        onClose();
        window.dispatchEvent(new CustomEvent('platform:sem-changed'));
        toast('أُضيفت الملاحظة', { kind: 'ok' });
      }}
    />
  );
}
