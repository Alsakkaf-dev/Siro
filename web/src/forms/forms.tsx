import { useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react';
import { ApiError } from '../lib/api.js';
import { Button, Field, Modal } from '../ui/ui.js';
import { COURSE_COLORS, KINDS, KIND_LABEL, NOTE_TAG_LABEL, STATUS_LABEL, TIMING_LABEL } from '../../../shared/constants.js';
import { assessmentSchema, courseSchema, noteSchema, normalizeAssessment, parseOrThrow, semesterSchema, ValidationError } from '../../../shared/validation.js';
import type { AcademicNote, Assessment, Course, Semester } from '../../../shared/types.js';
import { toISO, todayMs } from '../../../shared/semester.js';

type Errs = Record<string, string>;

const AR_DIGITS = '٠١٢٣٤٥٦٧٨٩';
const latin = (s: string): string => s.replace(/[٠-٩]/g, (d) => String(AR_DIGITS.indexOf(d))).replace(/[،؛]/g, ',');
const str = (v: unknown): string => (v === null || v === undefined ? '' : String(v));

function useFormShell<T>(onSave: (data: T) => Promise<void>, onClose: () => void) {
  const [errors, setErrors] = useState<Errs>({});
  const [saving, setSaving] = useState(false);
  const submit = async (e: FormEvent, build: () => T): Promise<void> => {
    e.preventDefault();
    if (saving) return;
    setErrors({});
    let data: T;
    try {
      data = build();
    } catch (err) {
      if (err instanceof ValidationError) setErrors(err.fields);
      else setErrors({ _: (err as Error).message });
      return;
    }
    setSaving(true);
    try {
      await onSave(data);
      onClose();
    } catch (err) {
      if (err instanceof ApiError) setErrors({ ...err.fields, ...(Object.keys(err.fields).length ? {} : { _: err.message }) });
      else setErrors({ _: (err as Error).message });
      setSaving(false);
    }
  };
  return { errors, saving, submit };
}

const parseOr = parseOrThrow;

function FormModal({ title, onClose, saving, error, formId, children, saveLabel, onSubmit }: { onSubmit: (e: FormEvent) => void; title: string; onClose: () => void; saving: boolean; error?: string | undefined; formId: string; children: ReactNode; saveLabel: string }) {
  return (
    <Modal
      title={title}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>إلغاء</Button>
          <button type="submit" form={formId} className="btn primary" disabled={saving}>
            {saving ? 'جارٍ الحفظ…' : saveLabel}
          </button>
        </>
      }
    >
      <form id={formId} onSubmit={onSubmit} noValidate>
        {error && <div className="callout danger" role="alert" style={{ marginBlockEnd: 'var(--s-4)' }}>{error}</div>}
        <div className="form-grid">{children}</div>
      </form>
    </Modal>
  );
}

/* ───────── Semester ───────── */
export function SemesterForm({ initial, onSave, onClose, suggestion }: { initial?: Semester; onSave: (d: Record<string, unknown>) => Promise<void>; onClose: () => void; suggestion?: Partial<Semester> }) {
  const base = initial ?? suggestion;
  const [f, setF] = useState({
    code: str(base?.code),
    name: str(base?.name),
    year_no: str(base?.year_no),
    sem_no: str(base?.sem_no),
    start_date: str(base?.start_date ?? toISO(todayMs())),
    weeks: str(base?.weeks ?? 16),
    break_weeks: (base?.break_weeks ?? []).join(', '),
    exam_start: str(base?.exam_start),
    exam_end: str(base?.exam_end),
    note: str(base?.note),
  });
  const { errors, saving, submit } = useFormShell<Record<string, unknown>>(onSave, onClose);
  const set = (k: keyof typeof f) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF((p) => ({ ...p, [k]: e.target.value }));
  const build = (): Record<string, unknown> => {
    const bw = latin(f.break_weeks)
      .split(/[,\s]+/)
      .filter(Boolean)
      .map(Number);
    if (bw.some((n) => !Number.isInteger(n))) throw new ValidationError({ break_weeks: 'اكتب أرقام الأسابيع مفصولة بفواصل، مثل: 8, 9' });
    return parseOr(semesterSchema, { ...f, break_weeks: bw }) as Record<string, unknown>;
  };
  return (
    <FormModal onSubmit={(e) => void submit(e, build)} title={initial ? `تعديل ${initial.code}` : 'إضافة فصل جديد'} onClose={onClose} saving={saving} error={errors['_']} formId="sem-form" saveLabel={initial ? 'حفظ التعديلات' : 'إضافة الفصل'}>
      <Field label="رمز الفصل" error={errors['code']} hint="مثال: SEM 6" htmlFor="s-code"><input id="s-code" className="input" value={f.code} onChange={set('code')} aria-invalid={!!errors['code']} /></Field>
      <Field label="الاسم" error={errors['name']} hint="مثال: Semester II 2026/27" htmlFor="s-name"><input id="s-name" className="input" value={f.name} onChange={set('name')} aria-invalid={!!errors['name']} /></Field>
      <Field label="السنة (1–8)" error={errors['year_no']} htmlFor="s-y"><input id="s-y" className="input" inputMode="numeric" value={f.year_no} onChange={set('year_no')} /></Field>
      <Field label="رقم الفصل" error={errors['sem_no']} htmlFor="s-n"><input id="s-n" className="input" inputMode="numeric" value={f.sem_no} onChange={set('sem_no')} /></Field>
      <Field label="تاريخ بداية الفصل (الأسبوع 1)" error={errors['start_date']} htmlFor="s-sd"><input id="s-sd" type="date" className="input" value={f.start_date} onChange={set('start_date')} aria-invalid={!!errors['start_date']} /></Field>
      <Field label="عدد الأسابيع" error={errors['weeks']} htmlFor="s-w"><input id="s-w" className="input" inputMode="numeric" value={f.weeks} onChange={set('weeks')} /></Field>
      <Field label="أسابيع الإجازة" error={errors['break_weeks']} hint="مفصولة بفواصل، مثل: 8" htmlFor="s-bw" full><input id="s-bw" className="input" value={f.break_weeks} onChange={set('break_weeks')} aria-invalid={!!errors['break_weeks']} /></Field>
      <Field label="بداية الامتحانات" error={errors['exam_start']} hint="اتركه فارغًا إن لم يُعلن" htmlFor="s-es"><input id="s-es" type="date" className="input" value={f.exam_start} onChange={set('exam_start')} /></Field>
      <Field label="نهاية الامتحانات" error={errors['exam_end']} htmlFor="s-ee"><input id="s-ee" type="date" className="input" value={f.exam_end} onChange={set('exam_end')} /></Field>
      <Field label="ملاحظة" error={errors['note']} full htmlFor="s-note"><textarea id="s-note" className="textarea" value={f.note} onChange={set('note')} /></Field>
    </FormModal>
  );
}

/* ───────── Course ───────── */
export function CourseForm({ initial, onSave, onClose, usedColors }: { initial?: Course; onSave: (d: Record<string, unknown>) => Promise<void>; onClose: () => void; usedColors?: string[] }) {
  const free = COURSE_COLORS.find((c) => !usedColors?.includes(c)) ?? COURSE_COLORS[0]!;
  const [f, setF] = useState({
    code: str(initial?.code),
    name: str(initial?.name),
    name_ar: str(initial?.name_ar),
    credits: str(initial?.credits),
    section: str(initial?.section),
    lecturer: str(initial?.lecturer),
    coordinator: str(initial?.coordinator),
    room: str(initial?.room),
    schedule: str(initial?.schedule),
    color: initial?.color ?? free,
    min_final: str(initial?.min_final),
    note: str(initial?.note),
  });
  const { errors, saving, submit } = useFormShell<Record<string, unknown>>(onSave, onClose);
  const set = (k: keyof typeof f) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF((p) => ({ ...p, [k]: e.target.value }));
  const build = (): Record<string, unknown> => parseOr(courseSchema, { ...f, clos: initial?.clos ?? [], slt: initial?.slt ?? null, source_file: initial?.source_file ?? null }) as Record<string, unknown>;
  return (
    <FormModal onSubmit={(e) => void submit(e, build)} title={initial ? `تعديل ${initial.code}` : 'إضافة مادة'} onClose={onClose} saving={saving} error={errors['_']} formId="course-form" saveLabel={initial ? 'حفظ التعديلات' : 'إضافة المادة'}>
        <Field label="رمز المادة" error={errors['code']} hint="مثال: SCSE3103" htmlFor="c-code"><input id="c-code" className="input ltr-in" value={f.code} onChange={set('code')} aria-invalid={!!errors['code']} /></Field>
        <Field label="الاسم (إنجليزي)" error={errors['name']} htmlFor="c-name"><input id="c-name" className="input" value={f.name} onChange={set('name')} aria-invalid={!!errors['name']} /></Field>
        <Field label="الاسم بالعربية" error={errors['name_ar']} htmlFor="c-ar"><input id="c-ar" className="input" value={f.name_ar} onChange={set('name_ar')} /></Field>
        <Field label="الساعات المعتمدة" error={errors['credits']} hint="اتركها فارغة إن كانت غير معروفة" htmlFor="c-cr"><input id="c-cr" className="input" inputMode="decimal" value={f.credits} onChange={set('credits')} /></Field>
        <Field label="المحاضر" error={errors['lecturer']} htmlFor="c-lec"><input id="c-lec" className="input" value={f.lecturer} onChange={set('lecturer')} /></Field>
        <Field label="الشعبة" error={errors['section']} htmlFor="c-sec"><input id="c-sec" className="input" value={f.section} onChange={set('section')} /></Field>
        <Field label="القاعة" error={errors['room']} htmlFor="c-room"><input id="c-room" className="input" value={f.room} onChange={set('room')} /></Field>
        <Field label="حد أدنى لعلامة النهائي (اختياري)" error={errors['min_final']} hint="مثال: 20 — تستخدمه الحاسبة" htmlFor="c-mf"><input id="c-mf" className="input" inputMode="decimal" value={f.min_final} onChange={set('min_final')} /></Field>
        <Field label="أوقات المحاضرات" error={errors['schedule']} hint="مثال: Mon 11:00–13:00 · Wed 08:00–10:00" full htmlFor="c-sch"><input id="c-sch" className="input ltr-in" value={f.schedule} onChange={set('schedule')} /></Field>
        <div className="field full">
          <span className="lab">اللون</span>
          <div className="swatches" role="radiogroup" aria-label="لون المادة">
            {COURSE_COLORS.map((c) => (
              <button key={c} type="button" role="radio" aria-checked={f.color === c} aria-label={c} className="swatch" style={{ '--c': c } as never} onClick={() => setF((p) => ({ ...p, color: c }))} />
            ))}
          </div>
          {errors['color'] && <span className="err">{errors['color']}</span>}
        </div>
        <Field label="ملاحظة" error={errors['note']} full htmlFor="c-note"><textarea id="c-note" className="textarea" value={f.note} onChange={set('note')} /></Field>
    </FormModal>
  );
}

/* ───────── Assessment ───────── */
export function AssessmentForm({ initial, sem, onSave, onClose }: { initial?: Assessment; sem: Semester; onSave: (d: Record<string, unknown>) => Promise<void>; onClose: () => void }) {
  const [f, setF] = useState({
    kind: initial?.kind ?? 'test',
    title: str(initial?.title),
    weight: str(initial?.weight),
    count: str(initial?.count ?? 1),
    timing: initial?.timing ?? 'unknown',
    week_no: str(initial?.week_no),
    week_from: str(initial?.week_from),
    due_date: str(initial?.due_date),
    due_time: str(initial?.due_time),
    venue: str(initial?.venue),
    status: initial?.status ?? 'pending',
    score: str(initial?.score),
    max_score: str(initial?.max_score),
    weight_assumed: initial?.weight_assumed ?? false,
    crowd: initial?.crowd ?? true,
    note: str(initial?.note),
  });
  const { errors, saving, submit } = useFormShell<Record<string, unknown>>(onSave, onClose);
  const set = (k: keyof typeof f) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setF((p) => ({ ...p, [k]: e.target.value }));
  const build = (): Record<string, unknown> => {
    const parsed = parseOr(assessmentSchema, { ...f, weight: latin(f.weight), score: latin(f.score), max_score: latin(f.max_score), week_no: latin(f.week_no), week_from: latin(f.week_from) }) as Parameters<typeof normalizeAssessment>[0];
    return normalizeAssessment(parsed, sem) as unknown as Record<string, unknown>;
  };
  const t = f.timing;
  return (
    <FormModal onSubmit={(e) => void submit(e, build)} title={initial ? 'تعديل التقييم' : 'إضافة تقييم'} onClose={onClose} saving={saving} error={errors['_']} formId="ass-form" saveLabel={initial ? 'حفظ التعديلات' : 'إضافة التقييم'}>
        <Field label="العنوان" error={errors['title']} htmlFor="a-title" full><input id="a-title" className="input" value={f.title} onChange={set('title')} aria-invalid={!!errors['title']} /></Field>
        <Field label="النوع" error={errors['kind']} htmlFor="a-kind">
          <select id="a-kind" className="select" value={f.kind} onChange={set('kind')}>
            {KINDS.map((k) => (<option key={k} value={k}>{KIND_LABEL[k]}</option>))}
          </select>
        </Field>
        <Field label="الوزن % (من 100)" error={errors['weight']} htmlFor="a-w"><input id="a-w" className="input" inputMode="decimal" value={f.weight} onChange={set('weight')} aria-invalid={!!errors['weight']} /></Field>
        <Field label="الموعد" error={errors['timing']} htmlFor="a-timing">
          <select id="a-timing" className="select" value={t} onChange={set('timing')}>
            {(['unknown', 'week', 'date', 'exam'] as const).map((k) => (<option key={k} value={k}>{TIMING_LABEL[k]}</option>))}
          </select>
        </Field>
        <Field label="العدد (كم تقييمًا يمثّل هذا الصف)" error={errors['count']} htmlFor="a-count"><input id="a-count" className="input" inputMode="numeric" value={f.count} onChange={set('count')} /></Field>
        {t === 'week' && <Field label="رقم الأسبوع" error={errors['week_no']} hint={`1 – ${sem.weeks}`} htmlFor="a-wk"><input id="a-wk" className="input" inputMode="numeric" value={f.week_no} onChange={set('week_no')} aria-invalid={!!errors['week_no']} /></Field>}
        {t === 'date' && <Field label="التاريخ" error={errors['due_date']} htmlFor="a-dd"><input id="a-dd" type="date" className="input" value={f.due_date} onChange={set('due_date')} aria-invalid={!!errors['due_date']} /></Field>}
        {(t === 'week' || t === 'date') && <Field label="من أسبوع (اختياري)" error={errors['week_from']} hint="لتقييم يمتد عدة أسابيع" htmlFor="a-wf"><input id="a-wf" className="input" inputMode="numeric" value={f.week_from} onChange={set('week_from')} /></Field>}
        {t !== 'unknown' && <Field label="الوقت" error={errors['due_time']} hint="مثال: 23:59" htmlFor="a-tm"><input id="a-tm" className="input ltr-in" value={f.due_time} onChange={set('due_time')} /></Field>}
        <Field label="المكان" error={errors['venue']} htmlFor="a-venue"><input id="a-venue" className="input" value={f.venue} onChange={set('venue')} /></Field>
        <Field label="الحالة" error={errors['status']} htmlFor="a-status">
          <select id="a-status" className="select" value={f.status} onChange={set('status')}>
            {(['unknown', 'pending', 'submitted', 'graded'] as const).map((k) => (<option key={k} value={k}>{STATUS_LABEL[k]}</option>))}
          </select>
        </Field>
        <Field label="الدرجة التي حصلت عليها" error={errors['score']} hint="اتركها فارغة إن لم تصدر" htmlFor="a-sc"><input id="a-sc" className="input" inputMode="decimal" value={f.score} onChange={set('score')} aria-invalid={!!errors['score']} /></Field>
        <Field label="الدرجة الكاملة" error={errors['max_score']} hint="الافتراضي = الوزن" htmlFor="a-ms"><input id="a-ms" className="input" inputMode="decimal" value={f.max_score} onChange={set('max_score')} /></Field>
        <label className="check full"><input type="checkbox" checked={f.weight_assumed} onChange={(e) => setF((p) => ({ ...p, weight_assumed: e.target.checked }))} /> الوزن افتراض غير مؤكد</label>
        <label className="check full"><input type="checkbox" checked={f.crowd} onChange={(e) => setF((p) => ({ ...p, crowd: e.target.checked }))} /> يُحتسب في ازدحام الأسبوع</label>
        <Field label="ملاحظة" error={errors['note']} full htmlFor="a-note"><textarea id="a-note" className="textarea" value={f.note} onChange={set('note')} /></Field>
    </FormModal>
  );
}

/* ───────── Note ───────── */
export function NoteForm({ initial, courses, onSave, onClose }: { initial?: AcademicNote; courses: Course[]; onSave: (d: Record<string, unknown>) => Promise<void>; onClose: () => void }) {
  const [f, setF] = useState({ course_id: str(initial?.course_id), tag: initial?.tag ?? 'unk', text: str(initial?.text), detail: str(initial?.detail), resolved: initial?.resolved ?? false });
  const { errors, saving, submit } = useFormShell<Record<string, unknown>>(onSave, onClose);
  const build = (): Record<string, unknown> => parseOr(noteSchema, f) as Record<string, unknown>;
  return (
    <FormModal onSubmit={(e) => void submit(e, build)} title={initial ? 'تعديل الملاحظة' : 'إضافة ملاحظة'} onClose={onClose} saving={saving} error={errors['_']} formId="note-form" saveLabel="حفظ">
        <Field label="النوع" htmlFor="n-tag">
          <select id="n-tag" className="select" value={f.tag} onChange={(e) => setF((p) => ({ ...p, tag: e.target.value as 'unk' | 'note' }))}>
            {(['unk', 'note'] as const).map((k) => (<option key={k} value={k}>{NOTE_TAG_LABEL[k]}</option>))}
          </select>
        </Field>
        <Field label="المادة" htmlFor="n-c">
          <select id="n-c" className="select" value={f.course_id} onChange={(e) => setF((p) => ({ ...p, course_id: e.target.value }))}>
            <option value="">— عامة —</option>
            {courses.map((c) => (<option key={c.id} value={c.id}>{c.code}</option>))}
          </select>
        </Field>
        <Field label="النص" error={errors['text']} full htmlFor="n-t"><input id="n-t" className="input" value={f.text} onChange={(e) => setF((p) => ({ ...p, text: e.target.value }))} aria-invalid={!!errors['text']} /></Field>
        <Field label="تفاصيل" error={errors['detail']} full htmlFor="n-d"><textarea id="n-d" className="textarea" value={f.detail} onChange={(e) => setF((p) => ({ ...p, detail: e.target.value }))} /></Field>
        <label className="check full"><input type="checkbox" checked={f.resolved} onChange={(e) => setF((p) => ({ ...p, resolved: e.target.checked }))} /> تم حلّها</label>
    </FormModal>
  );
}
