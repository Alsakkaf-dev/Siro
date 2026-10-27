import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSem } from '../core/sem-context.js';
import { useApp } from '../core/app-context.js';
import { api } from '../lib/api.js';
import { PageHead } from '../ui/page.js';
import { Badge, Button, Card, CardHead, EmptyState, IconButton, Unknown } from '../ui/ui.js';
import { NoteForm } from '../forms/lazy.js';
import { KIND_LABEL } from '../../../shared/constants.js';
import type { AcademicNote } from '../../../shared/types.js';

export default function Unknowns() {
  const S = useSem();
  const { toast, deleteWithUndo } = useApp();
  /** عمليات جماعية على الملاحظات (حذف المحلولة) مع تراجع */
  const bulkNotes = async (ids: string[], op: 'resolve' | 'delete'): Promise<void> => {
    try {
      const r = await api.bulkNotes(ids, op);
      await S.reload();
      toast(op === 'delete' ? `حُذفت ${r.count} ملاحظة` : `حُلّت ${r.count} ملاحظة`, { kind: 'ok', ...(r.undo ? { action: { label: 'تراجع', run: () => void api.undo(r.undo!).then(() => S.reload()) } } : {}) });
    } catch (e) {
      toast((e as Error).message, { kind: 'error' });
    }
  };
  const base = `/academic/s/${S.sem.id}`;
  const [form, setForm] = useState<AcademicNote | 'new' | null>(null);
  const unkNotes = S.notes.filter((n) => n.tag === 'unk');
  const notes = S.notes.filter((n) => n.tag === 'note');
  const missingCredits = S.courses.filter((c) => c.credits === null);
  const missingLecturer = S.courses.filter((c) => !c.lecturer);
  const total = S.unknownAssessments.length + unkNotes.filter((n) => !n.resolved).length + missingCredits.length;

  const toggleResolved = async (n: AcademicNote): Promise<void> => {
    try {
      await api.editNote(n.id, { resolved: !n.resolved });
      await S.reload();
    } catch (e) {
      toast((e as Error).message, { kind: 'error' });
    }
  };
  const noteCard = (n: AcademicNote) => (
    <li key={n.id} className={`un-item ${n.resolved ? 'done' : ''}`}>
      <label className="check" style={{ alignItems: 'flex-start' }}>
        <input type="checkbox" checked={n.resolved} onChange={() => void toggleResolved(n)} aria-label={`تم حلّها: ${n.text}`} />
        <span>
          <strong>{n.text}</strong>
          {n.course_id && <> <Badge><bdi>{S.courseById.get(n.course_id)?.code}</bdi></Badge></>}
          {n.detail && <><br /><span className="muted">{n.detail}</span></>}
        </span>
      </label>
      <span className="row" style={{ gap: 2 }}>
        <IconButton icon="edit" label="تعديل" sm ghost onClick={() => setForm(n)} />
        <IconButton icon="trash" label="حذف" sm ghost tone="danger" onClick={() => void deleteWithUndo('الملاحظة', () => api.delNote(n.id), S.reload)} />
      </span>
    </li>
  );

  return (
    <div className="page">
      <PageHead title="غير المعروف" icon="help" crumbs={[{ to: '/academic', label: 'الفصول' }, { to: base, label: S.sem.code }, { label: 'غير المعروف' }]} sub="كل ما لا نعرفه بعد — نقول «غير معروف» ولا نخمّن." badge={<Badge tone={total ? 'warn' : 'ok'}>{total}</Badge>} actions={<Button icon="plus" onClick={() => setForm('new')}>إضافة ملاحظة</Button>} />
      <div className="stack stagger" style={{ gap: 'var(--s-5)' }}>
        <Card>
          <CardHead title="تقييمات بلا موعد" icon="clock"><Badge tone="warn">{S.unknownAssessments.length}</Badge></CardHead>
          {S.unknownAssessments.length === 0 ? <EmptyState icon="check" title="كل التقييمات لها موعد" /> : (
            <ul className="plain">
              {S.unknownAssessments.map((a) => (
                <li key={a.id} className="un-item">
                  <span><Link to={`${base}/courses/${a.course_id}#a-${a.id}`}><strong><bdi>{a.title}</bdi></strong></Link> <Badge><bdi>{S.courseById.get(a.course_id)?.code}</bdi></Badge> <Badge dashed>{KIND_LABEL[a.kind]}</Badge> <span className="muted num">{a.weight}%</span></span>
                  <Unknown text="الموعد غير معروف" />
                </li>
              ))}
            </ul>
          )}
        </Card>
        <div className="grid cols-2">
          <Card>
            <CardHead title="أسئلة مفتوحة" icon="help">
              <Badge tone="warn">{unkNotes.filter((n) => !n.resolved).length}</Badge>
              {unkNotes.some((n) => n.resolved) && (
                <button type="button" className="btn sm ghost" onClick={() => void bulkNotes(unkNotes.filter((n) => n.resolved).map((n) => n.id), 'delete')}>حذف المحلولة ({unkNotes.filter((n) => n.resolved).length})</button>
              )}
            </CardHead>
            {unkNotes.length === 0 ? <p className="muted">لا شيء.</p> : <ul className="plain">{unkNotes.map(noteCard)}</ul>}
          </Card>
          <Card>
            <CardHead title="بيانات ناقصة في المواد" icon="book" />
            <ul className="plain">
              {missingCredits.map((c) => (<li key={c.id} className="un-item"><Link to={`${base}/courses/${c.id}`}><bdi>{c.code}</bdi></Link><Unknown text="الساعات المعتمدة" /></li>))}
              {missingLecturer.map((c) => (<li key={c.id} className="un-item"><Link to={`${base}/courses/${c.id}`}><bdi>{c.code}</bdi></Link><Unknown text="المحاضر" /></li>))}
              {missingCredits.length + missingLecturer.length === 0 && <li className="muted">لا شيء.</li>}
            </ul>
          </Card>
        </div>
        {notes.length > 0 && <Card><CardHead title="ملاحظات" icon="file" /><ul className="plain">{notes.map(noteCard)}</ul></Card>}
      </div>
      {form && (
        <NoteForm
          {...(form !== 'new' ? { initial: form } : {})}
          courses={S.courses}
          onClose={() => setForm(null)}
          onSave={async (d) => {
            if (form === 'new') await api.addNote(S.sem.id, d);
            else await api.editNote(form.id, d);
            toast('تم الحفظ', { kind: 'ok' });
            await S.reload();
          }}
        />
      )}
    </div>
  );
}
