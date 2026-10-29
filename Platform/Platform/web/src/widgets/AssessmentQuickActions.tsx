import { useState } from 'react';
import { api } from '../lib/api.js';
import { useApp } from '../core/app-context.js';
import { Button, Field, Modal } from '../ui/ui.js';
import type { Assessment } from '../../../shared/types.js';

/** «تم التسليم» و«أدخل الدرجة» مباشرة من اليوم والمواعيد (PATCH /api/assessments/:id القائم). المُصحَّح يتطلب درجة. */
export function AssessmentQuickActions({ a, onDone }: { a: Assessment; onDone: () => void }) {
  const { toast } = useApp();
  const [busy, setBusy] = useState(false);
  const [grade, setGrade] = useState(false);
  const [score, setScore] = useState('');
  const [max, setMax] = useState(String(a.max_score));
  const [err, setErr] = useState<string | null>(null);

  const patch = async (b: Record<string, unknown>, msg: string): Promise<boolean> => {
    setBusy(true);
    try {
      await api.editAssessment(a.id, b);
      toast(msg, { kind: 'ok' });
      onDone();
      return true;
    } catch (e) {
      setErr((e as Error).message);
      toast((e as Error).message, { kind: 'error' });
      return false;
    } finally {
      setBusy(false);
    }
  };
  const save = async (): Promise<void> => {
    const s = Number(score);
    const m = Number(max);
    if (score.trim() === '' || !Number.isFinite(s) || s < 0) return setErr('أدخل درجة صحيحة');
    if (!Number.isFinite(m) || m <= 0) return setErr('الدرجة الكاملة غير صالحة');
    if (s > m) return setErr('الدرجة أكبر من الدرجة الكاملة');
    if (await patch({ status: 'graded', score: s, max_score: m }, `سُجّلت درجة «${a.title}»`)) setGrade(false);
  };

  return (
    <span className="qa">
      {a.status !== 'submitted' && a.status !== 'graded' && <Button size="sm" icon="check" disabled={busy} onClick={() => void patch({ status: 'submitted' }, `«${a.title}»: تم التسليم`)}>تم التسليم</Button>}
      {a.status !== 'graded' && <Button size="sm" icon="edit" disabled={busy} onClick={() => { setErr(null); setGrade(true); }}>أدخل الدرجة</Button>}
      {grade && (
        <Modal title={<>درجة <bdi>{a.title}</bdi></>} onClose={() => setGrade(false)} footer={<><Button variant="ghost" onClick={() => setGrade(false)}>إلغاء</Button><Button variant="primary" type="submit" form={`qa-${a.id}`} disabled={busy}>حفظ الدرجة</Button></>}>
          <form id={`qa-${a.id}`} className="form-grid" onSubmit={(e) => { e.preventDefault(); void save(); }}>
            <Field label="الدرجة" error={err ?? undefined} htmlFor={`qa-s-${a.id}`}>
              <input id={`qa-s-${a.id}`} className="input" inputMode="decimal" dir="ltr" value={score} onChange={(e) => setScore(e.target.value)} />
            </Field>
            <Field label="من" htmlFor={`qa-m-${a.id}`} hint="الدرجة الكاملة لهذا التقييم">
              <input id={`qa-m-${a.id}`} className="input" inputMode="decimal" dir="ltr" value={max} onChange={(e) => setMax(e.target.value)} />
            </Field>
          </form>
        </Modal>
      )}
    </span>
  );
}
