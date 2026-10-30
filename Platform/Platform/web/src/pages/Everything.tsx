import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApp } from '../core/app-context.js';
import { PageHead } from '../ui/page.js';
import { Button, Card, EmptyState, Skeleton } from '../ui/ui.js';
import { AgendaList, addDays, localToday } from '../widgets/agenda.js';
import { wos, type AgendaEntry, type Space } from '../lib/wos.js';
import { normalizeText } from '../../../shared/text.js';

type Horizon = 'all' | 'overdue' | 'today' | 'week' | 'later' | 'undated' | 'done';
const HORIZONS: { id: Horizon; label: string }[] = [
  { id: 'all', label: 'المفتوح كله' },
  { id: 'overdue', label: 'متأخر' },
  { id: 'today', label: 'اليوم' },
  { id: 'week', label: 'هذا الأسبوع' },
  { id: 'later', label: 'لاحقًا' },
  { id: 'undated', label: 'بلا موعد' },
  { id: 'done', label: 'المنجز' },
];

/** «كل شيء» (ClickUp Everything + Asana My Tasks): كل التقييمات وعناصر المساحات بآفاق زمنية ومرشحات. */
export default function Everything() {
  const { openCreate } = useApp();
  const [sp, setSp] = useSearchParams();
  const horizon = (HORIZONS.some((h) => h.id === sp.get('horizon')) ? sp.get('horizon') : 'all') as Horizon;
  const source = sp.get('source') ?? 'all';
  const q = sp.get('q') ?? '';
  const [data, setData] = useState<{ spaces: Space[]; entries: AgendaEntry[] } | null>(null);
  const load = useCallback(() => void wos.everything().then(setData).catch(() => setData({ spaces: [], entries: [] })), []);
  useEffect(() => {
    load();
    window.addEventListener('platform:items-changed', load);
    return () => window.removeEventListener('platform:items-changed', load);
  }, [load]);
  const today = localToday();
  const week = addDays(today, 6);
  const set = (k: string, v: string | null): void => {
    const n = new URLSearchParams(sp);
    if (v === null || v === '' || v === 'all') n.delete(k);
    else n.set(k, v);
    setSp(n, { replace: true });
  };
  const inH = (e: AgendaEntry, h: Horizon): boolean => {
    if (h === 'done') return e.done;
    if (e.done) return false;
    if (h === 'all') return true;
    if (h === 'undated') return e.date === null;
    if (e.date === null) return false;
    if (h === 'overdue') return e.date < today;
    if (h === 'today') return e.date === today;
    if (h === 'week') return e.date >= today && e.date <= week;
    return e.date > week;
  };
  const nq = normalizeText(q);
  const list = useMemo(() => {
    if (!data) return [];
    return data.entries
      .filter((e) => (source === 'all' ? true : source === 'study' ? e.kind === 'assessment' : e.space_id === source))
      .filter((e) => !nq || normalizeText(`${e.title} ${e.subtitle}`).includes(nq))
      .filter((e) => inH(e, horizon))
      .sort((a, b) => (a.date ?? '9999').localeCompare(b.date ?? '9999') || a.title.localeCompare(b.title, 'ar'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, source, nq, horizon, today]);
  const counts = useMemo(() => Object.fromEntries(HORIZONS.map((h) => [h.id, data?.entries.filter((e) => (source === 'all' ? true : source === 'study' ? e.kind === 'assessment' : e.space_id === source)).filter((e) => inH(e, h.id)).length ?? 0])), [data, source, today]);
  return (
    <div className="page">
      <PageHead title="كل شيء" icon="list" sub="كل التقييمات وعناصر مساحاتك في مكان واحد — حسب الأفق الزمني." actions={<Button variant="primary" icon="plus" onClick={() => openCreate({ kind: 'quick-item' })}>عنصر جديد</Button>} />
      <div className="view-tabs" role="tablist" aria-label="الأفق الزمني">
        {HORIZONS.map((h) => (
          <button key={h.id} role="tab" aria-selected={horizon === h.id} className="vt" onClick={() => set('horizon', h.id)}>
            {h.label} <span className="vt-n">{counts[h.id] ?? 0}</span>
          </button>
        ))}
      </div>
      <div className="toolbar">
        <label className="sr-only" htmlFor="ev-q">تصفية بالنص</label>
        <input id="ev-q" type="search" placeholder="تصفية…" value={q} onChange={(e) => set('q', e.target.value)} />
        <label className="sr-only" htmlFor="ev-src">المصدر</label>
        <select id="ev-src" value={source} onChange={(e) => set('source', e.target.value)}>
          <option value="all">كل المصادر</option>
          <option value="study">الدراسة (التقييمات)</option>
          {data?.spaces.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>
      <Card>
        {!data ? <><Skeleton h={14} /><div style={{ height: 8 }} /><Skeleton h={14} w="60%" /></> : list.length ? <AgendaList entries={list} today={today} onChanged={load} /> : <EmptyState icon="check" title="لا شيء في هذا الأفق" text="جرّب أفقًا آخر أو أنشئ عنصرًا جديدًا." />}
      </Card>
    </div>
  );
}
