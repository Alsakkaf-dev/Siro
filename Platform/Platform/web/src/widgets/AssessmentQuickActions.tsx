import { useState } from 'react';
import { api } from '../lib/api.js';
import { useApp } from '../core/app-context.js';
import { Button, Field, Modal } from '../ui/ui.js';
import type { Assessment } from '../../../shared/types.js';

/** نافذة إدخال الدرجة: «مُصحَّح» يتطلب درجة دائمًا (لا حالة graded بلا score). */
export function GradeDialog({ a, onClose, onDone }: { a: Assessment; onClose: () => void; onDone: () => void }) {
  const { toast } = useApp();
  const [busy, setBusy] = useState(false);
  const [score, setScore] = useState(a.score !== null ? String(a.score) : '');
  const [max, setMax] = useState(String(a.max_score));
  const [err, setErr] = useState<string | null>(null);
  const save = async (): Promise<void> => {
    const s = Number(score);
    const m = Number(max);
    if (score.trim() === '' || !Number.isFinite(s) || s < 0) return setErr('أدخل درجة صحيحة');
    if (!Number.isFinite(m) || m <= 0) return setErr('الدرجة الكاملة غير صالحة');
    if (s > m) return setErr('الدرجة أكبر من الدرجة الكاملة');
    setBusy(true);
    try {
      await api.editAssessment(a.id, { status: 'graded', score: s, max_score: m });
      toast(`سُجّلت درجة «${a.title}»`, { kind: 'ok' });
      onClose();
      onDone();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal title={<>درجة <bdi>{a.title}</bdi></>} onClose={onClose} footer={<><Button variant="ghost" onClick={onClose}>إلغاء</Button><Button variant="primary" type="submit" form={`qa-${a.id}`} disabled={busy}>حفظ الدرجة</Button></>}>
      <form id={`qa-${a.id}`} className="form-grid" onSubmit={(e) => { e.preventDefault(); void save(); }}>
        <Field label="الدرجة" error={err ?? undefined} htmlFor={`qa-s-${a.id}`}>
          <input id={`qa-s-${a.id}`} className="input" inputMode="decimal" dir="ltr" value={score} onChange={(e) => setScore(e.target.value)} />
        </Field>
        <Field label="من" htmlFor={`qa-m-${a.id}`} hint="الدرجة الكاملة لهذا التقييم">
          <input id={`qa-m-${a.id}`} className="input" inputMode="decimal" dir="ltr" value={max} onChange={(e) => setMax(e.target.value)} />
        </Field>
      </form>
    </Modal>
  );
}

/** «تم التسليم» و«أدخل الدرجة» مباشرة من اليوم والمواعيد والقائمة (PATCH /api/assessments/:id القائم). */
export function AssessmentQuickActions({ a, onDone }: { a: Assessment; onDone: () => void }) {
  const { toast } = useApp();
  const [busy, setBusy] = useState(false);
  const [grade, setGrade] = useState(false);
  const submitted = async (): Promise<void> => {
    setBusy(true);
    try {
      await api.editAssessment(a.id, { status: 'submitted' });
      toast(`«${a.title}»: تم التسليم`, { kind: 'ok' });
      onDone();
    } catch (e) {
      toast((e as Error).message, { kind: 'error' });
    } finally {
      setBusy(false);
    }
  };
  return (
    <span className="qa">
      {a.status !== 'submitted' && a.status !== 'graded' && <Button size="sm" icon="check" disabled={busy} onClick={() => void submitted()}>تم التسليم</Button>}
      {a.status !== 'graded' && <Button size="sm" icon="edit" disabled={busy} onClick={() => setGrade(true)}>أدخل الدرجة</Button>}
      {grade && <GradeDialog a={a} onClose={() => setGrade(false)} onDone={onDone} />}
    </span>
  );
}
