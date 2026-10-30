import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { useUrlParam } from '../core/useUrlParam.js';
import { CourseCalcPanel } from '../widgets/CourseCalcPanel.js';
import { GradeDialog } from '../widgets/AssessmentQuickActions.js';
import { libraryItemPath, type LibItem } from '../../../shared/library.js';
import type { AcademicNote, Course } from '../../../shared/types.js';
import { useSem } from '../core/sem-context.js';
import { usePageTitle } from '../core/title.js';
import { useApp } from '../core/app-context.js';
import { api, lib } from '../lib/api.js';
import { RelationsCard } from '../widgets/relations.js';
import { PageHead } from '../ui/page.js';
import { Badge, Button, Card, CardHead, EmptyState, IconButton, KebabMenu, Segmented, TrustTag, Unknown, cx } from '../ui/ui.js';
import { AssessmentForm, CourseForm, NoteForm } from '../forms/lazy.js';
import { DocTable, type Col } from '../widgets/catalog.js';
import { Ring, SegBar } from '../widgets/charts.js';
import { Icon } from '../lib/icons.js';
import { KIND_COLOR, KIND_LABEL, STATUS_LABEL } from '../../../shared/constants.js';
import { dueSortMs, weightSum } from '../../../shared/semester.js';
import type { Assessment, AssessmentStatus } from '../../../shared/types.js';
import { daysFrom, fmtNum, prettySchedule, relDays, whenText } from '../lib/format.js';
import { EmptyState as _E } from '../ui/ui.js';
import { AskAi } from '../ai/AskAi.js';

type View = 'list' | 'table' | 'board';
type Tab = 'overview' | 'materials' | 'calc' | 'notes';
const TABS: { id: Tab; label: string }[] = [{ id: 'overview', label: 'نظرة' }, { id: 'materials', label: 'المواد التعليمية' }, { id: 'calc', label: 'الحاسبة' }, { id: 'notes', label: 'ملاحظات' }];
const STATUSES: AssessmentStatus[] = ['unknown', 'pending', 'submitted', 'graded'];

export default function CoursePage() {
  const S = useSem();
  const { courseId = '' } = useParams();
  const { toast, confirm, deleteWithUndo } = useApp();
  const loc = useLocation();
  const base = `/academic/s/${S.sem.id}`;
  const course = S.courseById.get(courseId);
  usePageTitle(course ? `${course.code} — ${course.name}` : null);
  const [view, setView] = useUrlParam<View>('view', 'list', ['list', 'table', 'board']);
  const [tab, setTab] = useUrlParam<Tab>('tab', 'overview', ['overview', 'materials', 'calc', 'notes']);
  const [gradeFor, setGradeFor] = useState<Assessment | null>(null);
  const [edit, setEdit] = useState<Assessment | 'new' | null>(null);
  const [editCourse, setEditCourse] = useState(false);
  const [sel, setSel] = useState<Set<string>>(new Set());

  const items = useMemo(() => [...(S.byCourse.get(courseId) ?? [])].sort((a, b) => (dueSortMs(a, S.sem) ?? Infinity) - (dueSortMs(b, S.sem) ?? Infinity) || a.sort - b.sort), [S.byCourse, courseId, S.sem]);

  useEffect(() => {
    if (!loc.hash) return;
    const el = document.getElementById(loc.hash.slice(1));
    if (el) {
      el.scrollIntoView({ block: 'center' });
      el.classList.add('flash');
      const t = window.setTimeout(() => el.classList.remove('flash'), 1800);
      return () => window.clearTimeout(t);
    }
  }, [loc.hash, items.length, view]);

  if (!course) return <div className="page"><EmptyState icon="warn" title="المادة غير موجودة" action={<Button to={`${base}/courses`}>العودة إلى المواد</Button>} /></div>;

  const calc = S.calcs.get(course.id)!;
  const sum = weightSum(items);
  const notes = S.notes.filter((n) => n.course_id === course.id);
  const kinds = new Map<string, number>();
  for (const a of items) kinds.set(a.kind, (kinds.get(a.kind) ?? 0) + a.weight);

  const del = async (a: Assessment): Promise<void> => {
    const ok = await confirm({ title: 'حذف التقييم؟', body: <p><bdi>{a.title}</bdi> — {a.weight}%</p>, confirmLabel: 'حذف', danger: true });
    if (ok) await deleteWithUndo(a.title, () => api.delAssessment(a.id), S.reload);
  };
  const setStatus = async (a: Assessment, status: AssessmentStatus): Promise<void> => {
    // «تم التصحيح» يفتح إدخال الدرجة: لا مُصحَّح بلا درجة
    if (status === 'graded' && a.score === null) return setGradeFor(a);
    try {
      await api.editAssessment(a.id, { status });
      await S.reload();
    } catch (e) {
      toast((e as Error).message, { kind: 'error' });
    }
  };
  // عملية واحدة على الخادم (معاملة + سجل نشاط) بدل طلب لكل عنصر
  const bulk = async (status: AssessmentStatus): Promise<void> => {
    try {
      const r = await api.bulkAssessments([...sel], 'status', status);
      setSel(new Set());
      await S.reload();
      toast(`تم تحديث ${r.count} إلى «${STATUS_LABEL[status]}»`, { kind: 'ok' });
    } catch (e) {
      toast((e as Error).message, { kind: 'error' });
    }
  };
  const bulkDelete = async (): Promise<void> => {
    try {
      const r = await api.bulkAssessments([...sel], 'delete');
      setSel(new Set());
      await S.reload();
      toast(`حُذف ${r.count} تقييم — في سلة المحذوفات`, { kind: 'ok', action: { label: 'تراجع', run: () => void api.undo(r.undo!).then(() => S.reload()) } });
    } catch (e) {
      toast((e as Error).message, { kind: 'error' });
    }
  };

  const statusBadge = (a: Assessment) => {
    if (a.status === 'graded') return <Badge tone="ok">{a.score !== null ? `${fmtNum(a.score)}/${fmtNum(a.max_score)}` : 'مصحَّح'}</Badge>;
    if (a.status === 'submitted') return <Badge tone="accent">تم التسليم</Badge>;
    if (a.status === 'unknown') return <Unknown />;
    return <Badge>بانتظار</Badge>;
  };
  const whenBadge = (a: Assessment) => {
    if (a.timing === 'unknown') return <Unknown text="الموعد غير معروف" />;
    const t = dueSortMs(a, S.sem);
    return (
      <span className="muted">
        {whenText(a, S.sem)}
        {t !== null && t >= S.now && a.status === 'pending' && <b className="due-chip"> · {relDays(daysFrom(S.now, t))}</b>}
      </span>
    );
  };

  const cols: Col<Assessment>[] = [
    { key: 'title', head: 'التقييم', width: 'minmax(200px,2fr)', cell: (a) => (<span id={`a-${a.id}`}><strong><bdi>{a.title}</bdi></strong>{a.count > 1 && <Badge dashed>×{a.count}</Badge>}{a.weight_assumed && <TrustTag kind="assumed" />}</span>) },
    { key: 'kind', head: 'النوع', width: '110px', cell: (a) => <span className="row" style={{ gap: 6, flexWrap: 'nowrap' }}><i className="dot" style={{ background: KIND_COLOR[a.kind] }} />{KIND_LABEL[a.kind]}</span> },
    { key: 'w', head: 'الوزن', width: '80px', numeric: true, cell: (a) => `${fmtNum(a.weight)}%` },
    { key: 'when', head: 'الموعد', width: 'minmax(180px,1.4fr)', cell: whenBadge },
    { key: 'st', head: 'الحالة', width: '120px', cell: statusBadge },
    { key: 'act', head: '', width: '88px', cell: (a) => (<span className="row" style={{ gap: 2, flexWrap: 'nowrap' }}><IconButton icon="edit" label="تعديل" sm ghost onClick={() => setEdit(a)} /><IconButton icon="trash" label="حذف" sm ghost tone="danger" onClick={() => void del(a)} /></span>) },
  ];

  const card = (a: Assessment) => (
    <article key={a.id} id={`a-${a.id}`} className="as-card" style={{ '--c': KIND_COLOR[a.kind] } as never}>
      <span className="as-w num">{fmtNum(a.weight)}<small>%</small></span>
      <div className="as-main">
        <strong><bdi>{a.title}</bdi></strong>
        <div className="as-meta">
          <Badge>{KIND_LABEL[a.kind]}</Badge>
          {a.count > 1 && <Badge dashed>×{a.count}</Badge>}
          {a.weight_assumed && <TrustTag kind="assumed" />}
          {statusBadge(a)}
        </div>
        <div className="as-when">{whenBadge(a)}{a.venue && <span className="muted"> · <bdi>{a.venue}</bdi></span>}</div>
        {a.note && <p className="as-note">{a.note}</p>}
      </div>
      <KebabMenu label={`خيارات ${a.title}`} items={[{ label: 'تعديل', icon: 'edit', onClick: () => setEdit(a) }, ...STATUSES.filter((s) => s !== a.status).map((s) => ({ label: `تعيين: ${STATUS_LABEL[s]}`, icon: 'check' as const, onClick: () => void setStatus(a, s) })), { label: 'حذف', icon: 'trash', onClick: () => void del(a), danger: true }]} />
    </article>
  );

  return (
    <div className="page">
      <PageHead
        title={<span className="row" style={{ gap: 12, flexWrap: 'nowrap' }}><i className="dot lg" style={{ background: course.color }} /> <bdi>{course.code}</bdi></span>}
        sub={<bdi>{course.name}{course.name_ar ? ` — ${course.name_ar}` : ''}</bdi>}
        crumbs={[{ to: '/academic', label: 'الفصول' }, { to: base, label: S.sem.code }, { to: `${base}/courses`, label: 'المواد' }, { label: course.code }]}
        actions={
          <>
            <AskAi label="حلّل وضعي" prompt="حلّل وضعي في هذه المادة: ما حصلت عليه، ما تبقى، وكم أحتاج لأصل 70% و80%." send />
            <AskAi label="التقاط ذكي" prompt={`استخرج التقييمات من النص التالي وأضفها لهذه المادة (${course.code}) — لا تخمّن أي وزن أو تاريخ غير مذكور:\n\n`} />
            <Button icon="edit" onClick={() => setEditCourse(true)}>تعديل المادة</Button>
            <Button icon="plus" variant="primary" onClick={() => setEdit('new')}>إضافة تقييم</Button>
          </>
        }
      />
      <nav className="tabs page-tabs" aria-label="أقسام المادة" style={{ marginBlockEnd: 'var(--s-5)' }}>
        {TABS.map((t) => (
          <button key={t.id} type="button" className="tab" aria-current={tab === t.id ? 'page' : undefined} onClick={() => setTab(t.id)}>
            {t.label}{t.id === 'notes' && notes.length > 0 ? ` (${notes.length})` : ''}
          </button>
        ))}
      </nav>
      {tab === 'materials' ? <CourseMaterials course={course} /> : tab === 'calc' ? <CourseCalcPanel course={course} /> : tab === 'notes' ? <CourseNotes course={course} notes={notes} /> : (<>
      <div className="course-hero" style={{ '--c': course.color } as never}>
        <div className="ch-info">
          <dl className="kv">
            <dt>الساعات</dt><dd>{course.credits ?? <Unknown />}</dd>
            <dt>المحاضر</dt><dd>{course.lecturer ? <bdi>{course.lecturer}</bdi> : <Unknown />}</dd>
            {course.coordinator && (<><dt>المنسّق</dt><dd><bdi>{course.coordinator}</bdi></dd></>)}
            {course.section && (<><dt>الشعبة</dt><dd><bdi>{course.section}</bdi></dd></>)}
            <dt>المحاضرات</dt><dd>{course.schedule ? <bdi>{prettySchedule(course.schedule)}</bdi> : <Unknown />}</dd>
            {course.room && (<><dt>القاعة</dt><dd><bdi>{course.room}</bdi></dd></>)}
            {course.min_final !== null && (<><dt>حد أدنى للنهائي</dt><dd className="num">{course.min_final}</dd></>)}
          </dl>
          {course.note && <p className="muted">{course.note}</p>}
        </div>
        <div className="ch-stats">
          <Ring value={calc.performance} size={92} stroke={9} color={course.color} label={calc.performance === null ? '—' : `${Math.round(calc.performance)}%`} sub="أداؤك في المصحَّح" />
          <div>
            <small className="muted">أداؤك في المصحَّح</small>
            <div className="row" style={{ gap: 6 }}>
              <strong className="num" style={{ fontSize: 'var(--fs-lg)' }}>{fmtNum(calc.earned)} / {fmtNum(calc.gradedWeight)}</strong>
              <TrustTag kind="calc" />
            </div>
            <small className="muted">الحد الأقصى الممكن {fmtNum(calc.maxPossible)}</small>
          </div>
        </div>
      </div>

      <div className="row" style={{ marginBlock: 'var(--s-4)', justifyContent: 'space-between' }}>
        <div className="row">
          <h2>التقييمات</h2>
          <Badge tone="accent">{items.length}</Badge>
          {items.length > 0 && (Math.abs(sum - 100) > 0.005 ? <Badge tone="warn" title="يجب أن يكون المجموع 100%">مجموع الأوزان {fmtNum(sum)}% ≠ 100</Badge> : <Badge tone="ok">المجموع 100%</Badge>)}
        </div>
        <Segmented<View> label="عرض التقييمات" value={view} onChange={setView} options={[{ value: 'list', label: 'قائمة', icon: 'list' }, { value: 'table', label: 'جدول', icon: 'table' }, { value: 'board', label: 'لوحة', icon: 'board' }]} />
      </div>
      {items.length > 0 && <div style={{ marginBlockEnd: 'var(--s-4)' }}><SegBar segments={[...kinds.entries()].map(([k, w]) => ({ label: KIND_LABEL[k as keyof typeof KIND_LABEL], value: Math.round(w * 10) / 10, color: KIND_COLOR[k as keyof typeof KIND_COLOR] }))} /></div>}

      {items.length === 0 ? (
        <EmptyState icon="list" title="لا توجد تقييمات لهذه المادة" text="أضف الاختبارات والواجبات والنهائي مع أوزانها. إن كان الموعد غير معروف اتركه «غير معروف»." action={<Button variant="primary" icon="plus" onClick={() => setEdit('new')}>إضافة تقييم</Button>} />
      ) : view === 'list' ? (
        <div className="stack stagger" style={{ gap: 'var(--s-3)' }}>{items.map((a, i) => <div key={a.id} style={{ '--i': i } as never}>{card(a)}</div>)}</div>
      ) : view === 'table' ? (
        <>
          {sel.size > 0 && (
            <div className="bulkbar" role="toolbar" aria-label="إجراءات جماعية">
              <strong>{sel.size} محدد</strong>
              {STATUSES.filter((s) => s !== 'graded').map((s) => (<button key={s} className="btn sm" onClick={() => void bulk(s)}>تعيين: {STATUS_LABEL[s]}</button>))}
              <button className="btn sm danger" onClick={() => void bulkDelete()}>حذف المحدد</button>
              <button className="btn sm ghost" onClick={() => setSel(new Set())}>إلغاء</button>
            </div>
          )}
          <DocTable rows={items} cols={cols} selectable selected={sel} onSelect={(id, on) => setSel((p) => { const n = new Set(p); if (on) n.add(id); else n.delete(id); return n; })} />
        </>
      ) : (
        <div className="board">
          {STATUSES.map((s) => {
            const col = items.filter((a) => a.status === s);
            return (
              <section key={s} className="board-col" aria-label={STATUS_LABEL[s]}>
                <h3>{STATUS_LABEL[s]} <Badge>{col.length}</Badge></h3>
                <div className="stack" style={{ gap: 'var(--s-3)' }}>{col.map(card)}{col.length === 0 && <p className="muted center">—</p>}</div>
              </section>
            );
          })}
        </div>
      )}

      {notes.length > 0 && (
        <Card style={{ marginBlockStart: 'var(--s-6)' }}>
          <CardHead title="ملاحظات وغير معروف" icon="help"><button type="button" className="btn sm ghost" onClick={() => setTab('notes')}>إدارة الملاحظات</button></CardHead>
          <ul className="plain">
            {notes.map((n) => (
              <li key={n.id} className="row" style={{ alignItems: 'flex-start', flexWrap: 'nowrap', gap: 10 }}>
                {n.tag === 'unk' ? <Unknown /> : <Badge>ملاحظة</Badge>}
                <span><strong>{n.text}</strong>{n.detail && <><br /><span className="muted">{n.detail}</span></>}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div style={{ marginBlockStart: 'var(--s-6)' }}>
        <RelationsCard refId={`acad:course:${course.id}`} />
      </div>
      </>)}

      {gradeFor && <GradeDialog a={gradeFor} onClose={() => setGradeFor(null)} onDone={() => void S.reload()} />}
      {edit && (
        <AssessmentForm
          {...(edit !== 'new' ? { initial: edit } : {})}
          sem={S.sem}
          onClose={() => setEdit(null)}
          onSave={async (d) => {
            if (edit === 'new') await api.addAssessment(course.id, d);
            else await api.editAssessment(edit.id, d);
            toast(edit === 'new' ? 'أُضيف التقييم' : 'تم الحفظ', { kind: 'ok' });
            await S.reload();
          }}
        />
      )}
      {editCourse && (
        <CourseForm
          initial={course}
          onClose={() => setEditCourse(false)}
          onSave={async (d) => {
            await api.editCourse(course.id, d);
            toast('تم الحفظ', { kind: 'ok' });
            await S.reload();
          }}
        />
      )}
    </div>
  );
}
void cx; void _E;

/** المواد التعليمية للمادة من المكتبة (/api/library/items?course=CODE). */
function CourseMaterials({ course }: { course: Course }) {
  const [items, setItems] = useState<LibItem[] | null>(null);
  const [total, setTotal] = useState(0);
  const [err, setErr] = useState(false);
  useEffect(() => {
    let live = true;
    lib.items({ course: course.code, limit: 50, sort: 'name' }).then((r) => live && (setItems(r.items), setTotal(r.total))).catch(() => live && setErr(true));
    return () => {
      live = false;
    };
  }, [course.code]);
  const actions = (
    <div className="row">
      <Button size="sm" icon="library" to={`/library?course=${encodeURIComponent(course.code)}`}>فتح في المكتبة</Button>
      <Button size="sm" icon="play" to={`/library/youtube?new=1&course=${encodeURIComponent(course.code)}`}>إضافة فيديو YouTube</Button>
    </div>
  );
  if (err) return <EmptyState icon="library" title="تعذّر قراءة المكتبة" text="تأكد من مجلد المكتبة في الإعدادات." action={<Button to="/settings?tab=sources">المصادر</Button>} />;
  if (!items) return <Card><p className="muted">جارٍ التحميل…</p></Card>;
  if (items.length === 0) return <EmptyState icon="library" title="لا مواد لهذه المادة في المكتبة" text="الملفات تُنسب للمادة من اسم المجلد أو الملف (رمز المادة)." action={actions} />;
  return (
    <Card>
      <CardHead title={`ملفات وفيديوهات (${total})`} icon="library">{actions}</CardHead>
      <ul className="plain today-list">
        {items.map((it) => (
          <li key={it.ref}>
            <Link to={libraryItemPath(it.source, it.id)} className="today-row">
              <Icon name={it.source === 'youtube' ? 'video' : 'file'} size={16} />
              <span className="tr-main"><bdi>{it.title}</bdi><small><bdi>{it.folder || 'YouTube'}</bdi>{it.done ? ' · منجز' : it.progress ? ` · ${Math.round(it.progress * 100)}%` : ''}</small></span>
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}

/** ملاحظات المادة: إضافة وتعديل وحلّ من صفحة المادة نفسها. */
function CourseNotes({ course, notes }: { course: Course; notes: AcademicNote[] }) {
  const S = useSem();
  const { toast } = useApp();
  const [form, setForm] = useState<AcademicNote | 'new' | null>(null);
  const toggle = async (n: AcademicNote): Promise<void> => {
    try {
      await api.editNote(n.id, { resolved: !n.resolved });
      await S.reload();
    } catch (e) {
      toast((e as Error).message, { kind: 'error' });
    }
  };
  return (
    <Card>
      <CardHead title="ملاحظات وغير معروف" icon="help"><Button size="sm" variant="primary" icon="plus" onClick={() => setForm('new')}>إضافة ملاحظة</Button></CardHead>
      {notes.length === 0 ? <p className="muted">لا ملاحظات لهذه المادة.</p> : (
        <ul className="plain stack" style={{ gap: 'var(--s-2)' }}>
          {notes.map((n) => (
            <li key={n.id} className={`un-item ${n.resolved ? 'done' : ''}`}>
              <label className="check" style={{ alignItems: 'flex-start' }}>
                <input type="checkbox" checked={n.resolved} onChange={() => void toggle(n)} aria-label={`تم حلّها: ${n.text}`} />
                <span>{n.tag === 'unk' ? <Unknown /> : <Badge>ملاحظة</Badge>} <strong>{n.text}</strong>{n.detail && <><br /><span className="muted">{n.detail}</span></>}</span>
              </label>
              <IconButton icon="edit" label="تعديل" sm ghost onClick={() => setForm(n)} />
            </li>
          ))}
        </ul>
      )}
      {form && (
        <NoteForm
          {...(form !== 'new' ? { initial: form } : {})}
          courses={S.courses}
          defaultCourseId={course.id}
          onClose={() => setForm(null)}
          onSave={async (d) => {
            if (form === 'new') await api.addNote(S.sem.id, d);
            else await api.editNote(form.id, d);
            toast('تم الحفظ', { kind: 'ok' });
            await S.reload();
          }}
        />
      )}
    </Card>
  );
}
