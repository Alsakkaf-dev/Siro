import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useApp } from '../core/app-context.js';
import { lib } from '../lib/api.js';
import { Icon } from '../lib/icons.js';
import { PageHead } from '../ui/page.js';
import { BulkBar, Button, Card, EmptyState, Pager, Segmented, Skeleton, useDebounced, useSelection } from '../ui/ui.js';
import { DocTable, Facet, FilterChips } from '../widgets/catalog.js';
import { libCols } from '../library/cols.js';
import { StatTile } from '../widgets/tiles.js';
import { CourseBadge, KindTile, ProgressBar, fmtWhen, itemPath, pctOf, useLibStatus } from '../library/common.js';
import { DOCTYPE_LABELS, type LibItem, type LibListResult } from '../../../shared/library.js';

type Tab = 'all' | 'course' | 'sem' | 'type';
const FILTERS = ['kind', 'sem', 'course', 'type', 'tag'] as const;
type FilterKey = (typeof FILTERS)[number];
const FILTER_LABEL: Record<FilterKey, string> = { kind: 'النوع', sem: 'الفصل', course: 'المادة', type: 'التصنيف', tag: 'وسم' };

export function StatusBanner({ status, reload }: { status: NonNullable<ReturnType<typeof useLibStatus>['status']>; reload: () => void }) {
  void reload;
  if (!status.root_exists || !status.root_is_dir) {
    return (
      <div className="callout warn lib-status" role="alert">
        <Icon name="warn" size={18} />
        <span style={{ flex: 1, minWidth: 0, overflowWrap: 'anywhere' }}>
          مجلد المكتبة غير موجود على هذا الجهاز: <bdi className="ltr-in" style={{ direction: 'ltr', unicodeBidi: 'isolate' }}>{status.root}</bdi>. لن يظهر أي ملف حتى تحدّد مجلدًا صحيحًا.
        </span>
        <Button size="sm" to="/settings?tab=sources">تحديد المجلد</Button>
      </div>
    );
  }
  if (status.last_scan?.truncated) {
    return <div className="callout warn lib-status" role="status"><Icon name="warn" size={18} /><span>المجلد كبير: توقّف الفحص عند الحد الأقصى للملفات، فقد لا تظهر بعض الملفات.</span></div>;
  }
  return null;
}

export default function Library() {
  const { toast } = useApp();
  const [sp, setSp] = useSearchParams();
  const { status, reload } = useLibStatus();
  const tab = ((sp.get('group') ?? sp.get('tab')) as Tab | null) ?? 'all';
  const f: Record<FilterKey, string> = { kind: sp.get('kind') ?? '', sem: sp.get('sem') ?? '', course: sp.get('course') ?? '', type: sp.get('type') ?? '', tag: sp.get('tag') ?? '' };
  const [q, setQ] = useState(sp.get('q') ?? '');
  const dq = useDebounced(q, 250);
  const sort = sp.get('sort') ?? 'name';
  const dir = sp.get('dir') ?? '';
  const page = Number(sp.get('page') ?? 1) || 1;
  const [data, setData] = useState<LibListResult | null>(null);
  const [all, setAll] = useState<LibListResult | null>(null);
  const [recent, setRecent] = useState<LibItem[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const scanTick = status?.last_scan?.at ?? '';
  const [tick, setTick] = useState(0);
  const { sel, toggle: toggleSel, clear: clearSel, setAll: setAllSel } = useSelection();
  const [tagIn, setTagIn] = useState('');
  const bulk = async (op: 'tag' | 'untag' | 'done' | 'undone'): Promise<void> => {
    const refs = (data?.items ?? []).filter((i) => sel.has(i.id)).map((i) => i.ref);
    try {
      const r = await lib.bulk(refs, op, op === 'tag' || op === 'untag' ? tagIn : undefined);
      clearSel();
      setTick((t) => t + 1);
      toast(`تم على ${r.count} عنصر`, { kind: 'ok' });
    } catch (e) {
      toast((e as Error).message, { kind: 'error' });
    }
  };

  const patch = useCallback((p: Record<string, string | null>): void => {
    setSp((cur) => {
      const n = new URLSearchParams(cur);
      for (const [k, v] of Object.entries(p)) {
        if (v === null || v === '') n.delete(k);
        else n.set(k, v);
      }
      if (!('page' in p)) n.delete('page');
      return n;
    }, { replace: true, flushSync: true });
  }, [setSp]);

  useEffect(() => {
    if ((sp.get('q') ?? '') !== dq) patch({ q: dq || null });
  }, [dq]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    let alive = true;
    setErr(null);
    lib.items({ q: sp.get('q') ?? '', ...f, sort, dir, page, limit: 30, yt: true }).then((r) => alive && setData(r)).catch((e: Error) => alive && setErr(e.message));
    return () => {
      alive = false;
    };
  }, [sp, scanTick, tick]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    let alive = true;
    void lib.recent(8).then((r) => alive && setRecent(r)).catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [scanTick]);
  useEffect(() => {
    if (tab === 'all') return;
    let alive = true;
    void lib.items({ limit: 1, yt: true }).then((r) => alive && setAll(r)).catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [tab, scanTick]);

  const startScan = async (): Promise<void> => {
    try {
      await lib.scan();
      toast('بدأ فحص المجلد…');
      reload();
    } catch (e) {
      toast((e as Error).message, { kind: 'error' });
    }
  };

  const chips = FILTERS.filter((k) => f[k]).map((k) => ({ key: k, label: `${FILTER_LABEL[k]}: ${data?.facets[k].find((o) => o.value === f[k])?.label ?? f[k]}` }));
  const clear = (): void => {
    setQ('');
    setSp(new URLSearchParams(tab !== 'all' ? { group: tab } : {}), { replace: true });
  };
  const setFilter = (k: FilterKey) => (v: string): void => patch({ [k]: f[k] === v ? null : v });
  const onSort = (key: string): void => patch({ sort: key, dir: sort === key && dir !== 'asc' ? 'asc' : sort === key ? 'desc' : '' });

  const cols = useMemo(() => libCols({ sortable: true }), []);

  const total = status?.counts;
  const noFiles = status && total && total.files === 0 && total.youtube === 0;
  const facets = data?.facets;
  const groupCards = (key: 'course' | 'sem' | 'type'): { value: string; label: string; count: number }[] => all?.facets[key] ?? [];

  return (
    <div className="page">
      <PageHead
        title="المكتبة"
        icon="library"
        sub={total ? `${total.files} ملف${total.missing ? ` (${total.missing} مفقود)` : ''} · ${total.youtube} فيديو YouTube` : undefined}
        actions={
          <>
            <Button icon="refresh" onClick={() => void startScan()} disabled={status?.scanning}>{status?.scanning ? 'جارٍ الفحص…' : 'فحص المجلد'}</Button>
            <Button icon="sliders" to="/settings?tab=sources">إعدادات المصادر</Button>
          </>
        }
      />
      {status && <StatusBanner status={status} reload={reload} />}

      <div className="grid cols-4 stagger" style={{ marginBlockEnd: 'var(--s-5)' }}>
        <StatTile tone="blue" icon="file" label="ملفات" value={total ? total.files : <Skeleton h={28} w={50} />} sub={total ? `${(total.by_kind['pdf'] ?? 0)} PDF` : undefined} />
        <StatTile tone="purple" icon="video" label="فيديو محلي" value={total ? (total.by_kind['video'] ?? 0) : <Skeleton h={28} w={50} />} sub={total ? `${total.by_kind['audio'] ?? 0} صوت` : undefined} />
        <StatTile tone="pink" icon="play" label="YouTube" value={total ? total.youtube : <Skeleton h={28} w={50} />} to="/library/youtube" />
        <StatTile tone="green" icon="clock" label="آخر فحص" value={status?.last_scan ? <span style={{ fontSize: 'var(--fs-lg)' }}>{fmtWhen(status.last_scan.at)}</span> : '—'} sub={status?.last_scan ? `${status.last_scan.scanned} ملف · ${status.last_scan.ms} مللي ثانية` : 'لم يتم فحص بعد'} />
      </div>

      {recent.length > 0 && (
        <section style={{ marginBlockEnd: 'var(--s-5)' }} aria-label="فُتحت مؤخرًا">
          <h2 className="h3" style={{ marginBlockEnd: 'var(--s-3)' }}>فُتحت مؤخرًا</h2>
          <div className="lib-recent">
            {recent.map((it) => (
              <Link key={it.ref} to={itemPath(it)} className="lib-rc">
                <span className="row" style={{ justifyContent: 'space-between' }}><KindTile kind={it.kind} size={34} /><CourseBadge it={it} /></span>
                <strong><bdi>{it.title}</bdi></strong>
                <ProgressBar value={pctOf(it)} />
                <small>{it.opened_at ? fmtWhen(it.opened_at) : ''}</small>
              </Link>
            ))}
          </div>
        </section>
      )}

      {noFiles && status?.root_exists ? (
        <EmptyState icon="library" title="المكتبة فارغة" text="لم يُعثر على ملفات في المجلد المحدد بعد. اضغط «فحص المجلد» أو أضف فيديو YouTube." action={<Button variant="primary" icon="refresh" onClick={() => void startScan()}>فحص المجلد</Button>} />
      ) : (
        <>
          <div className="hub-tabs" style={{ marginBlockEnd: 'var(--s-4)' }}>
            <Segmented<Tab> label="التجميع" value={tab} onChange={(v) => patch({ tab: null, group: v === 'all' ? null : v })} options={[{ value: 'all', label: 'بلا تجميع', icon: 'list' }, { value: 'course', label: 'حسب المادة', icon: 'book' }, { value: 'sem', label: 'حسب الفصل', icon: 'layers' }, { value: 'type', label: 'حسب التصنيف', icon: 'tag' }]} />
          </div>

          {tab !== 'all' ? (
            <section aria-live="polite">
              {groupCards(tab).length === 0 ? (
                <EmptyState icon="tag" title="لا يوجد تصنيف بعد" text="لا تحتوي أسماء المجلدات على معلومات كافية لاستنتاج هذا التصنيف (رمز مادة، Year/Semester، Lectures/Labs…)." />
              ) : (
                <div className="lib-group-grid stagger">
                  {groupCards(tab).map((g, i) => (
                    <button key={g.value} className="lib-group" style={{ '--i': i } as CSSProperties} onClick={() => patch({ tab: null, group: null, [tab]: g.value })}>
                      <strong><bdi>{tab === 'type' ? DOCTYPE_LABELS[g.value as keyof typeof DOCTYPE_LABELS] ?? g.label : g.label}</bdi></strong>
                      <span className="num">{g.count} عنصر</span>
                    </button>
                  ))}
                </div>
              )}
              <p className="muted" style={{ marginBlockStart: 'var(--s-3)' }}>التصنيف مُستنتج من أسماء المجلدات والملفات (تقدير) وليس معلومة مؤكدة.</p>
            </section>
          ) : (
            <div className="cat-layout">
              <aside className={`cat-filters ${filtersOpen ? 'open' : ''}`} aria-label="مرشحات">
                <Card className="flat">
                  {facets && facets.kind.length > 0 && <Facet title="النوع" options={facets.kind} selected={new Set(f.kind ? [f.kind] : [])} onToggle={setFilter('kind')} />}
                  {facets && facets.course.length > 0 && <Facet title="المادة" options={facets.course} selected={new Set(f.course ? [f.course] : [])} onToggle={setFilter('course')} />}
                  {facets && facets.sem.length > 0 && <Facet title="الفصل" options={facets.sem} selected={new Set(f.sem ? [f.sem] : [])} onToggle={setFilter('sem')} />}
                  {facets && facets.type.length > 0 && <Facet title="التصنيف" options={facets.type} selected={new Set(f.type ? [f.type] : [])} onToggle={setFilter('type')} />}
                  {facets && facets.tag.length > 0 && <Facet title="الوسوم" options={facets.tag} selected={new Set(f.tag ? [f.tag] : [])} onToggle={setFilter('tag')} />}
                  {facets && FILTERS.every((k) => facets[k].length === 0) && <p className="muted">لا مرشحات متاحة بعد.</p>}
                </Card>
              </aside>
              <section>
                <div className="cat-toolbar">
                  <div className="field-inline grow">
                    <Icon name="search" size={16} />
                    <input className="input" type="search" placeholder="ابحث في الأسماء والوسوم والملاحظات…" aria-label="ابحث في المكتبة" value={q} onChange={(e) => setQ(e.target.value)} />
                  </div>
                  <label className="field-inline">
                    <span className="sr-only">الترتيب</span>
                    <Icon name="sort" size={16} />
                    <select className="select" aria-label="الترتيب" value={sort} onChange={(e) => patch({ sort: e.target.value, dir: null })}>
                      <option value="name">الاسم</option>
                      <option value="mtime">الأحدث تعديلًا</option>
                      <option value="size">الأكبر حجمًا</option>
                      <option value="kind">النوع</option>
                      <option value="opened">آخر فتح</option>
                      <option value="path">المسار</option>
                    </select>
                  </label>
                  <button className="btn cat-filter-btn" onClick={() => setFiltersOpen((o) => !o)} aria-expanded={filtersOpen}><Icon name="filter" size={16} /> مرشحات{chips.length ? ` (${chips.length})` : ''}</button>
                </div>
                <FilterChips chips={chips} onClear={clear} onRemove={(k) => patch({ [k]: null })} />
                <p className="muted" style={{ marginBlock: 'var(--s-3)' }} aria-live="polite">{data ? `${data.total} عنصر` : 'جارٍ التحميل…'}</p>
                {err ? (
                  <div className="callout danger" role="alert">{err}</div>
                ) : !data ? (
                  <Skeleton h={220} r={16} />
                ) : data.items.length === 0 ? (
                  <EmptyState icon="filter" title="لا نتائج" text="جرّب كلمات أخرى أو امسح المرشحات." action={<Button onClick={clear}>مسح المرشحات</Button>} />
                ) : (
                  <>
                    <BulkBar count={sel.size} onClear={clearSel} total={data.items.length} onAll={() => setAllSel(data.items.map((i) => i.id))}>
                      <Button size="sm" icon="check" onClick={() => void bulk('done')}>تم</Button>
                      <Button size="sm" onClick={() => void bulk('undone')}>لم يتم</Button>
                      <label className="sr-only" htmlFor="lib-bulk-tag">وسم للمحدد</label>
                      <input id="lib-bulk-tag" value={tagIn} onChange={(e) => setTagIn(e.target.value)} placeholder="وسم…" style={{ width: 110, height: 34 }} />
                      <Button size="sm" icon="tag" disabled={!tagIn.trim()} onClick={() => void bulk('tag')}>وسم</Button>
                      <Button size="sm" disabled={!tagIn.trim()} onClick={() => void bulk('untag')}>إزالة الوسم</Button>
                    </BulkBar>
                    <div className="lib-table"><DocTable rows={data.items} cols={cols} sortKey={sort} sortDir={dir === 'asc' ? 1 : -1} onSort={onSort} rowTo={(r) => itemPath(r)} rowLabel={(r) => `فتح ${r.title}`} selectable selected={sel} onSelect={(id) => toggleSel(id)} /></div>
                    <Pager page={data.page} pages={data.pages} total={data.total} from={(data.page - 1) * 30 + 1} to={Math.min(data.total, data.page * 30)} onPage={(p) => { patch({ page: String(p) }); window.scrollTo({ top: 0 }); }} />
                  </>
                )}
              </section>
            </div>
          )}
        </>
      )}
    </div>
  );
}
