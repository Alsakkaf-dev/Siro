import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api.js';
import { PageHead } from '../ui/page.js';
import { Badge, Card, CardHead, EmptyState, Skeleton } from '../ui/ui.js';
import type { MoreHit, SearchHit } from '../../../shared/types.js';

const MORE_LABEL: Record<MoreHit['kind'], string> = { space: 'مساحاتي', item: 'عناصر المساحات', library: 'المكتبة', youtube: 'YouTube', life: 'الحياة', sports: 'تمارين', workout: 'تماريني', glossary: 'المصطلحات' };

export default function SearchPage() {
  const [sp, setSp] = useSearchParams();
  const q = sp.get('q')?.trim() ?? '';
  const [hits, setHits] = useState<SearchHit[] | null>(null);
  const [more, setMore] = useState<MoreHit[] | null>(null);
  useEffect(() => {
    setHits(null);
    setMore(null);
    if (!q) {
      setHits([]);
      setMore([]);
      return;
    }
    let live = true;
    api.search(q).then((h) => live && setHits(h)).catch(() => live && setHits([]));
    api.searchMore(q).then((m) => live && setMore(m)).catch(() => live && setMore([]));
    return () => {
      live = false;
    };
  }, [q]);
  const [draft, setDraft] = useState(q);
  useEffect(() => setDraft(q), [q]);
  return (
    <div className="page">
      <form className="row" role="search" style={{ marginBlockEnd: 'var(--s-4)' }} onSubmit={(e) => { e.preventDefault(); setSp(draft.trim() ? { q: draft.trim() } : {}); }}>
        <label className="sr-only" htmlFor="search-q">ابحث</label>
        <input id="search-q" className="input" style={{ flex: 1, minInlineSize: 0 }} type="search" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="ابحث في المواد والتقييمات والمكتبة والحياة…" autoFocus />
        <button className="btn primary" type="submit">بحث</button>
      </form>
      <PageHead title={q ? <>نتائج «{q}»</> : 'البحث'} icon="search" sub="في الفصول (مادة، تقييم، محاضر، نوع) وفي المكتبة والحياة والرياضة والمصطلحات." />
      {hits === null || more === null ? <Skeleton h={200} r={20} /> : hits.length === 0 && more.length === 0 ? <EmptyState icon="search" title={q ? 'لا نتائج' : 'اكتب ما تبحث عنه في شريط البحث'} text={q ? 'جرّب كلمة أقصر أو رمز المادة.' : undefined} /> : (
        <div className="stack">
        {hits.length > 0 && <Card>
          <CardHead title="الفصول" icon="calendar" />
          <ul className="plain">
            {hits.map((h) => (
              <li key={`${h.type}${h.id}`}>
                <Link to={`/academic/s/${h.semester_id}/courses/${h.course_id}${h.type === 'assessment' ? `#a-${h.id}` : ''}`} className="hit">
                  <i className="dot" style={{ background: h.color }} />
                  <span><bdi>{h.title}</bdi><small><bdi>{h.subtitle}</bdi></small></span>
                  <span style={{ marginInlineStart: 'auto' }}><Badge>{h.type === 'course' ? 'مادة' : 'تقييم'}</Badge> <Badge dashed><bdi>{h.semester_code}</bdi></Badge></span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>}
        {(Object.keys(MORE_LABEL) as MoreHit['kind'][]).map((k) => { const g = more.filter((m) => m.kind === k); return g.length === 0 ? null : (
          <Card key={k}>
            <CardHead title={MORE_LABEL[k]} icon="search"><Badge>{g.length}</Badge></CardHead>
            <ul className="plain">{g.map((m) => <li key={m.id}><Link to={m.to} className="hit"><span><bdi>{m.title}</bdi><small><bdi>{m.subtitle}</bdi></small></span></Link></li>)}</ul>
          </Card>); })}
        </div>
      )}
    </div>
  );
}
