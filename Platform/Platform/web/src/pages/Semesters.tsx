import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../core/app-context.js';
import { api } from '../lib/api.js';
import { PageHead } from '../ui/page.js';
import { Badge, BulkBar, Button, Card, EmptyState, IconButton, KebabMenu, Skeleton, Unknown, useSelection } from '../ui/ui.js';
import { SemesterForm } from '../forms/lazy.js';
import { Icon } from '../lib/icons.js';
import { phaseOf, semesterStatus, todayMs, weekEndMs } from '../../../shared/semester.js';
import { fmtISOFull, fmtDateShort } from '../lib/format.js';
import { parseISO } from '../../../shared/semester.js';
import type { Semester, SemesterSummary } from '../../../shared/types.js';

export default function Semesters() {
  const { semesters, reloadSemesters, toast, confirm, deleteWithUndo } = useApp();
  const { sel, toggle: toggleSel, clear: clearSel } = useSelection();
  const nav = useNavigate();
  const [sp, setSp] = useSearchParams();
  const [form, setForm] = useState<{ edit?: Semester } | null>(() => (sp.get('new') ? {} : null));
  useEffect(() => {
    if (sp.get('new')) {
      sp.delete('new');
      setSp(sp, { replace: true });
    }
  }, [sp, setSp]);
  const now = todayMs();

  if (!semesters) return <div className="page"><PageHead title="الفصول" icon="layers" /><div className="grid auto"><Skeleton h={220} r={20} /><Skeleton h={220} r={20} /></div></div>;

  const nextSuggestion = (): Partial<Semester> => {
    const last = [...semesters].sort((a, b) => (a.sem_no ?? 0) - (b.sem_no ?? 0)).at(-1);
    const n = (last?.sem_no ?? 0) + 1;
    return { code: `SEM ${n}`, sem_no: n, year_no: last?.sem_no ? Math.ceil(n / 2) : null, weeks: last?.weeks ?? 16, break_weeks: [] } as Partial<Semester>;
  };

  const del = async (s: SemesterSummary): Promise<void> => {
    const ok = await confirm({ title: `حذف ${s.code}؟`, body: <p>سيُحذف الفصل مع {s.course_count} مواد و {s.assessment_rows} تقييم. يمكنك التراجع بعد الحذف مباشرة، وتُحفظ نسخة احتياطية تلقائيًا كل يوم.</p>, confirmLabel: 'حذف الفصل', danger: true });
    if (ok) await deleteWithUndo(s.code, () => api.delSemester(s.id), reloadSemesters);
  };
  const activate = async (s: SemesterSummary): Promise<void> => {
    try {
      await api.activate(s.id);
      await reloadSemesters();
      toast(`${s.code} هو الفصل النشط الآن`, { kind: 'ok' });
    } catch (e) {
      toast((e as Error).message, { kind: 'error' });
    }
  };

  const sorted = [...semesters].sort((a, b) => parseISO(b.start_date) - parseISO(a.start_date));

  return (
    <div className="page">
      <PageHead title="الفصول" icon="layers" crumbs={[{ label: 'الفصول' }]} sub="كل فصولك في مكان واحد. أضف فصلًا جديدًا يدويًا وبدّل بينها." actions={<><Link to="/academic/import" className="btn"><Icon name="upload" size={16} /> استيراد فصل</Link><Button variant="primary" icon="plus" onClick={() => setForm({})}>إضافة فصل</Button></>} />
      {sorted.length === 0 ? (
        <EmptyState icon="calendar" title="لا توجد فصول" text="أضف أول فصل لتبدأ." action={<Button variant="primary" icon="plus" onClick={() => setForm({})}>إضافة فصل</Button>} />
      ) : (
        <>
        <BulkBar count={sel.size} onClear={clearSel}>
          <Button size="sm" variant="danger" icon="trash" onClick={async () => {
            if (!(await confirm({ title: `حذف ${sel.size} فصل؟`, body: 'تُحذف مع موادها وتقييماتها وملاحظاتها ونتائجها. الاستعادة متاحة من سلة المحذوفات 30 يومًا.', danger: true, confirmLabel: 'حذف' }))) return;
            const r = await api.bulkSemesters([...sel]);
            clearSel();
            await reloadSemesters();
            toast(`حُذف ${r.count} فصل`, { kind: 'ok', action: { label: 'تراجع', run: () => void api.undo(r.undo).then(() => reloadSemesters()) } });
          }}>حذف المحدد</Button>
        </BulkBar>
        <div className="grid auto stagger">
          {sorted.map((s, i) => {
            const st = semesterStatus(now, s);
            const ph = phaseOf(now, s);
            const end = weekEndMs(s, s.weeks);
            return (
              <Card key={s.id} hover className={s.is_active ? 'sem-card active' : 'sem-card'} style={{ '--i': i } as never}>
                <div className="sc-top">
                  <div style={{ minWidth: 0 }}>
                    <h2><input type="checkbox" className="sel-box" aria-label={`تحديد ${s.code}`} checked={sel.has(s.id)} onChange={() => toggleSel(s.id)} /> <bdi>{s.code}</bdi></h2>
                    <p className="muted"><bdi>{s.name}</bdi></p>
                  </div>
                  <KebabMenu label={`خيارات ${s.code}`} items={[{ label: 'تعديل الفصل', icon: 'edit', onClick: () => setForm({ edit: s }) }, ...(s.is_active ? [] : [{ label: 'تعيين كفصل نشط', icon: 'star' as const, onClick: () => void activate(s) }]), { label: 'حذف الفصل', icon: 'trash', onClick: () => void del(s), danger: true }]} />
                </div>
                <div className="row" style={{ marginBlock: 'var(--s-3)' }}>
                  {st === 'current' ? <Badge tone="ok">جارٍ{ph.week ? ` · الأسبوع ${ph.week}` : ''}</Badge> : st === 'future' ? <Badge tone="accent">قادم</Badge> : <Badge>منتهٍ</Badge>}
                  {s.is_active && <Badge tone="core"><Icon name="star" size={12} /> النشط</Badge>}
                </div>
                <dl className="kv">
                  <dt>البداية</dt><dd>{fmtISOFull(s.start_date)}</dd>
                  <dt>المحاضرات</dt><dd>{s.weeks} أسبوعًا · حتى {fmtDateShort(end)}</dd>
                  <dt>الإجازة</dt><dd>{s.break_weeks.length ? s.break_weeks.map((w) => `أسبوع ${w}`).join('، ') : <span className="muted">—</span>}</dd>
                  <dt>الامتحانات</dt><dd>{s.exam_start ? `${fmtISOFull(s.exam_start)}${s.exam_end ? ' – ' + fmtDateShort(parseISO(s.exam_end)) : ''}` : <Unknown />}</dd>
                </dl>
                <div className="sc-stats">
                  <span><b className="num">{s.course_count}</b> مواد</span>
                  <span><b className="num">{s.assessment_count}</b> تقييم</span>
                </div>
                <div className="row" style={{ marginBlockStart: 'var(--s-4)' }}>
                  <Link to={`/academic/s/${s.id}`} className="btn primary">فتح الفصل <Icon name="left" size={16} /></Link>
                  {!s.is_active && <Button onClick={() => void activate(s)}>تبديل إليه</Button>}
                </div>
              </Card>
            );
          })}
        </div>
        </>
      )}
      {form && (
        <SemesterForm
          {...(form.edit ? { initial: form.edit } : { suggestion: nextSuggestion() })}
          onClose={() => setForm(null)}
          onSave={async (d) => {
            if (form.edit) {
              await api.editSemester(form.edit.id, d);
              toast('تم الحفظ', { kind: 'ok' });
              await reloadSemesters();
            } else {
              const b = await api.addSemester(d);
              toast(`أُضيف الفصل ${b.semester.code}`, { kind: 'ok' });
              await reloadSemesters();
              nav(`/academic/s/${b.semester.id}`);
            }
          }}
        />
      )}
    </div>
  );
}
void IconButton;
