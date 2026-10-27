import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useSem } from '../core/sem-context.js';
import { useApp } from '../core/app-context.js';
import { api } from '../lib/api.js';
import { PageHead } from '../ui/page.js';
import { Badge, BulkBar, Button, Card, EmptyState, Segmented, Unknown, useSelection } from '../ui/ui.js';
import { CourseCard, DocTable, Facet, FilterChips, type Col } from '../widgets/catalog.js';
import { CourseForm, AssessmentForm } from '../forms/lazy.js';
import { Icon } from '../lib/icons.js';
import { KIND_LABEL } from '../../../shared/constants.js';
import { weightSum, dueSortMs } from '../../../shared/semester.js';
import { normalizeText } from '../../../shared/text.js';
import type { Assessment, Course, Kind } from '../../../shared/types.js';
import { fmtNum, initials } from '../lib/format.js';
import { Avatar } from '../ui/ui.js';

type View = 'grid' | 'list' | 'table';
type Sort = 'code' | 'name' | 'credits' | 'load' | 'next';

export default function Courses() {
  const S = useSem();
  const { toast, confirm, deleteWithUndo } = useApp();
  const { sel, toggle: toggleSel, clear: clearSel } = useSelection();
  const nav = useNavigate();
  const [sp, setSp] = useSearchParams();
  const base = `/academic/s/${S.sem.id}`;
  const [view, setView] = useState<View>(() => (localStorage.getItem('platform.coursesView') as View | null) ?? 'grid');
  const [sort, setSort] = useState<Sort>('code');
  const [q, setQ] = useState('');
  const [kinds, setKinds] = useState<Set<string>>(new Set());
  const [credits, setCredits] = useState<Set<string>>(new Set());
  const [flags, setFlags] = useState<Set<string>>(new Set());
  const [form, setForm] = useState<{ course?: Course } | null>(null);
  const [addFor, setAddFor] = useState<Course | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    if (sp.get('new')) {
      setForm({});
      sp.delete('new');
      setSp(sp, { replace: true });
    }
  }, [sp, setSp]);
  useEffect(() => localStorage.setItem('platform.coursesView', view), [view]);

  const toggle = (set: Set<string>, setter: (s: Set<string>) => void) => (v: string) => {
    const n = new Set(set);
    if (n.has(v)) n.delete(v);
    else n.add(v);
    setter(n);
  };

  const info = useMemo(
    () =>
      S.courses.map((c) => {
        const items = S.byCourse.get(c.id) ?? [];
        const next = items
          .filter((a) => a.status !== 'graded' && a.status !== 'submitted')
          .map((a) => dueSortMs(a, S.sem))
          .filter((t): t is number => t !== null && t >= S.now)
          .sort((a, b) => a - b)[0];
        return {
          c,
          items,
          kinds: new Set(items.map((a) => a.kind)),
          sum: weightSum(items),
          hasUnknown: items.some((a) => a.timing === 'unknown'),
          hasIssue: items.length > 0 && Math.abs(weightSum(items) - 100) > 0.005,
          hasFinal: items.some((a) => a.kind === 'final'),
          next: next ?? Infinity,
          load: items.length,
        };
      }),
    [S.courses, S.byCourse, S.sem, S.now],
  );

  const filtered = useMemo(() => {
    const nq = normalizeText(q);
    let r = info.filter((x) => {
      if (nq && !normalizeText(`${x.c.code} ${x.c.name} ${x.c.name_ar ?? ''} ${x.c.lecturer ?? ''}`).includes(nq)) return false;
      if (kinds.size && ![...kinds].every((k) => x.kinds.has(k as Kind))) return false;
      if (credits.size && !credits.has(x.c.credits === null ? '?' : String(x.c.credits))) return false;
      if (flags.has('unknown') && !x.hasUnknown) return false;
      if (flags.has('issue') && !x.hasIssue) return false;
      if (flags.has('nofinal') && x.hasFinal) return false;
      return true;
    });
    const cmp: Record<Sort, (a: (typeof r)[number], b: (typeof r)[number]) => number> = {
      code: (a, b) => a.c.code.localeCompare(b.c.code),
      name: (a, b) => a.c.name.localeCompare(b.c.name),
      credits: (a, b) => (b.c.credits ?? -1) - (a.c.credits ?? -1),
      load: (a, b) => b.load - a.load,
      next: (a, b) => a.next - b.next,
    };
    r = [...r].sort(cmp[sort]);
    return r;
  }, [info, q, kinds, credits, flags, sort]);

  const kindOpts = (Object.keys(KIND_LABEL) as Kind[]).map((k) => ({ value: k, label: KIND_LABEL[k], count: info.filter((x) => x.kinds.has(k)).length })).filter((o) => o.count > 0);
  const credVals = [...new Set(S.courses.map((c) => (c.credits === null ? '?' : String(c.credits))))].sort();
  const credOpts = credVals.map((v) => ({ value: v, label: v === '?' ? 'غير معروف' : `${v} ساعات`, count: S.courses.filter((c) => (c.credits === null ? '?' : String(c.credits)) === v).length }));
  const flagOpts = [
    { value: 'unknown', label: 'فيها بنود بلا موعد', count: info.filter((x) => x.hasUnknown).length },
    { value: 'issue', label: 'مجموع الأوزان ≠ 100', count: info.filter((x) => x.hasIssue).length },
    { value: 'nofinal', label: 'بدون نهائي', count: info.filter((x) => !x.hasFinal).length },
  ];

  const chips = [
    ...[...kinds].map((k) => ({ key: `k:${k}`, label: KIND_LABEL[k as Kind] })),
    ...[...credits].map((k) => ({ key: `c:${k}`, label: k === '?' ? 'ساعات غير معروفة' : `${k} ساعات` })),
    ...[...flags].map((k) => ({ key: `f:${k}`, label: flagOpts.find((o) => o.value === k)?.label ?? k })),
  ];
  const removeChip = (key: string): void => {
    const [t, v] = [key[0], key.slice(2)];
    if (t === 'k') toggle(kinds, setKinds)(v);
    if (t === 'c') toggle(credits, setCredits)(v);
    if (t === 'f') toggle(flags, setFlags)(v);
  };
  const clear = (): void => {
    setKinds(new Set());
    setCredits(new Set());
    setFlags(new Set());
    setQ('');
  };

  const delCourse = async (c: Course): Promise<void> => {
    const n = (S.byCourse.get(c.id) ?? []).length;
    const ok = await confirm({ title: `حذف ${c.code}؟`, body: <p>سيُحذف معها {n} تقييم. يمكنك التراجع بعد الحذف مباشرة.</p>, confirmLabel: 'حذف', danger: true });
    if (ok) await deleteWithUndo(c.code, () => api.delCourse(c.id), S.reload);
  };

  const cols: Col<(typeof info)[number] & { id: string }>[] = [
    { key: 'code', head: 'المادة', width: 'minmax(220px,2fr)', cell: (r) => (<Link to={`${base}/courses/${r.c.id}`} className="row" style={{ gap: 10, flexWrap: 'nowrap' }}><i className="dot" style={{ background: r.c.color }} /><span><strong><bdi>{r.c.code}</bdi></strong><br /><small className="muted"><bdi>{r.c.name}</bdi></small></span></Link>) },
    { key: 'lec', head: 'المحاضر', width: 'minmax(140px,1.2fr)', cell: (r) => (r.c.lecturer ? <span className="row" style={{ flexWrap: 'nowrap' }}><Avatar text={initials(r.c.lecturer)} color={r.c.color} /> <bdi>{r.c.lecturer}</bdi></span> : <Unknown />) },
    { key: 'cr', head: 'الساعات', width: '90px', numeric: true, cell: (r) => (r.c.credits === null ? <Unknown text="؟" /> : r.c.credits) },
    { key: 'n', head: 'تقييمات', width: '90px', numeric: true, cell: (r) => r.items.length },
    { key: 'sum', head: 'الأوزان', width: '120px', cell: (r) => (r.items.length === 0 ? <span className="muted">—</span> : r.hasIssue ? <Badge tone="warn">{r.sum}%</Badge> : <Badge tone="ok">100%</Badge>) },
    { key: 'unk', head: 'غير معروف', width: '110px', cell: (r) => (r.hasUnknown ? <Unknown text={String(r.items.filter((a) => a.timing === 'unknown').length)} /> : <span className="muted">—</span>) },
  ];

  return (
    <div className="page">
      <PageHead
        title="المواد"
        icon="book"
        crumbs={[{ to: '/academic', label: 'الفصول' }, { to: base, label: S.sem.code }, { label: 'المواد' }]}
        sub={`${S.courses.length} مواد · ${S.credits} ساعة معتمدة${S.creditsUnknown ? ' (+ ساعات غير معروفة)' : ''}`}
        actions={<Button variant="primary" icon="plus" onClick={() => setForm({})}>إضافة مادة</Button>}
      />

      <div className="cat-layout">
        <aside className={`cat-filters ${filtersOpen ? 'open' : ''}`} aria-label="مرشحات">
          <Card className="flat">
            <Facet title="نوع التقييم" options={kindOpts} selected={kinds} onToggle={toggle(kinds, setKinds)} />
            <Facet title="الساعات المعتمدة" options={credOpts} selected={credits} onToggle={toggle(credits, setCredits)} />
            <Facet title="الحالة" options={flagOpts} selected={flags} onToggle={toggle(flags, setFlags)} />
          </Card>
        </aside>
        <section>
          <div className="cat-toolbar">
            <div className="field-inline grow">
              <Icon name="search" size={16} />
              <input className="input" placeholder="ابحث في المواد…" aria-label="ابحث في المواد" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <button className="btn cat-filter-btn" onClick={() => setFiltersOpen((o) => !o)} aria-expanded={filtersOpen}><Icon name="filter" size={16} /> مرشحات{chips.length ? ` (${chips.length})` : ''}</button>
            <label className="field-inline">
              <span className="sr-only">الترتيب</span>
              <Icon name="sort" size={16} />
              <select className="select" value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="الترتيب">
                <option value="code">الرمز</option>
                <option value="name">الاسم</option>
                <option value="credits">الساعات</option>
                <option value="load">عدد التقييمات</option>
                <option value="next">الأقرب موعدًا</option>
              </select>
            </label>
            <Segmented<View> label="طريقة العرض" value={view} onChange={setView} options={[{ value: 'grid', label: 'بطاقات', icon: 'grid' }, { value: 'list', label: 'قائمة', icon: 'list' }, { value: 'table', label: 'جدول', icon: 'table' }]} />
          </div>
          <FilterChips chips={chips} onClear={clear} onRemove={removeChip} />
          <p className="muted" style={{ marginBlock: 'var(--s-3)' }} aria-live="polite">{filtered.length} من {S.courses.length} مواد</p>
          {S.courses.length === 0 ? (
            <EmptyState icon="book" title="لا توجد مواد بعد" text="أضف أول مادة لهذا الفصل لتبدأ بإضافة تقييماتها." action={<Button variant="primary" icon="plus" onClick={() => setForm({})}>إضافة مادة</Button>} />
          ) : filtered.length === 0 ? (
            <EmptyState icon="filter" title="لا مادة تطابق المرشحات" action={<Button onClick={clear}>مسح المرشحات</Button>} />
          ) : view === 'table' ? (
            <>
              <BulkBar count={sel.size} onClear={clearSel}>
                <Button size="sm" variant="danger" icon="trash" onClick={async () => {
                  if (!(await confirm({ title: `حذف ${sel.size} مادة؟`, body: 'تُحذف مع تقييماتها وملاحظاتها ونتائجها. يمكن الاستعادة من سلة المحذوفات 30 يومًا.', danger: true, confirmLabel: 'حذف' }))) return;
                  const r = await api.bulkCourses([...sel]);
                  clearSel();
                  await S.reload();
                  toast(`حُذفت ${r.count} مادة`, { kind: 'ok', action: { label: 'تراجع', run: () => void api.undo(r.undo).then(() => S.reload()) } });
                }}>حذف المحدد</Button>
              </BulkBar>
              <DocTable rows={filtered.map((x) => ({ ...x, id: x.c.id }))} cols={cols} selectable selected={sel} onSelect={(id) => toggleSel(id)} />
            </>
          ) : (
            <div className={view === 'grid' ? 'grid cat-grid stagger' : 'stack stagger'} style={view === 'list' ? { gap: 'var(--s-3)' } : undefined}>
              {filtered.map((x, i) => (
                <div key={x.c.id} style={{ '--i': i } as never}>
                  <CourseCard course={x.c} items={x.items} calc={S.calcs.get(x.c.id)!} sem={S.sem} now={S.now} to={`${base}/courses/${x.c.id}`} view={view} onEdit={() => setForm({ course: x.c })} onDelete={() => void delCourse(x.c)} onAdd={() => setAddFor(x.c)} />
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {form && (
        <CourseForm
          {...(form.course ? { initial: form.course } : {})}
          usedColors={S.courses.map((c) => c.color)}
          onClose={() => setForm(null)}
          onSave={async (d) => {
            if (form.course) await api.editCourse(form.course.id, d);
            else {
              const c = await api.addCourse(S.sem.id, d);
              toast(`أُضيفت المادة ${c.code}`, { kind: 'ok' });
              await S.reload();
              nav(`${base}/courses/${c.id}`);
              return;
            }
            toast('تم الحفظ', { kind: 'ok' });
            await S.reload();
          }}
        />
      )}
      {addFor && (
        <AssessmentForm
          sem={S.sem}
          onClose={() => setAddFor(null)}
          onSave={async (d) => {
            await api.addAssessment(addFor.id, d);
            toast('أُضيف التقييم', { kind: 'ok' });
            await S.reload();
          }}
        />
      )}
    </div>
  );
}
void fmtNum;
export type { Assessment };
