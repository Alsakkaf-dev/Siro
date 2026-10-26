import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { PageHead } from '../ui/page.js';
import { Badge, Button, Card, EmptyState, Field, Skeleton } from '../ui/ui.js';
import { loadGlossary, useGlossary } from '../glossary/glossary.js';
import { ContentBanner, norm } from '../sports/sportsKit.js';

export default function Glossary() {
  const g = useGlossary(true);
  const { hash } = useLocation();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<string>('all');
  const entries = useMemo(() => g?.doc?.entries ?? [], [g]);
  const cats = useMemo(() => Object.entries(g?.doc?.categories ?? {}).map(([id, v]) => ({ id, name: v.name_ar })), [g]);
  const list = useMemo(() => {
    const nq = norm(q);
    return entries.filter((e) => (cat === 'all' || e.category === cat) && (!nq || norm(`${e.term_ar} ${e.term_en ?? ''} ${e.definition_ar}`).includes(nq)));
  }, [entries, q, cat]);
  useEffect(() => {
    if (!hash || !g) return;
    const el = document.getElementById(hash.slice(1));
    if (el) {
      setCat('all');
      setQ('');
      requestAnimationFrame(() => el.scrollIntoView({ block: 'center' }));
    }
  }, [hash, g]);
  const head = <PageHead title="قاموس المصطلحات" icon="book" sub="تعريفات قصيرة من راشد لمصطلحات الرياضة والمال والعادات ووسوم الثقة." crumbs={[{ label: 'المصطلحات' }]} />;
  if (!g) return <div className="page">{head}<Skeleton h={120} r={16} /></div>;
  if (!g.doc) {
    return (
      <div className="page">
        {head}
        <ContentBanner status={g.status} label="قاموس المصطلحات" />
        <EmptyState icon="book" title="القاموس غير متاح" text={!g.rootExists ? 'مجلد صادرات راشد غير موجود. اضبط المسار من إعدادات الحياة.' : 'ملف القاموس غير متاح أو تغيّر تنسيقه. تظهر المصطلحات في الصفحات كنص عادي دون شرح.'} action={<><Button to="/life/settings" icon="sliders">إعدادات الحياة</Button> <Button onClick={() => void loadGlossary(true)}>إعادة المحاولة</Button></>} />
      </div>
    );
  }
  return (
    <div className="page">
      {head}
      <ContentBanner status={g.status} label="قاموس المصطلحات" />
      <Card>
        <div className="row" style={{ gap: 'var(--s-3)', flexWrap: 'wrap', alignItems: 'end' }}>
          <div style={{ flex: '1 1 240px' }}>
            <Field label="بحث في المصطلحات" htmlFor="gl-q">
              <input id="gl-q" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="مثال: تكرار، streak، الخزينة…" autoComplete="off" />
            </Field>
          </div>
          <div className="seg" role="group" aria-label="التصنيف">
            <button type="button" aria-pressed={cat === 'all'} onClick={() => setCat('all')}>الكل</button>
            {cats.map((c) => <button key={c.id} type="button" aria-pressed={cat === c.id} onClick={() => setCat(c.id)}>{c.name}</button>)}
          </div>
        </div>
        <p className="muted" style={{ margin: 'var(--s-3) 0 0' }} aria-live="polite"><b className="num">{list.length}</b> من <span className="num">{entries.length}</span> مصطلحًا</p>
      </Card>
      {list.length ? (
        <ul className="gl-grid">
          {list.map((e) => (
            <li key={e.id} id={e.id} className="gl-item">
              <h2>{e.term_ar}{e.term_en && <span className="en" lang="en">{e.term_en}</span>}</h2>
              <p>{e.definition_ar}</p>
              <span><Badge dashed>{g.doc?.categories?.[e.category]?.name_ar ?? e.category}</Badge></span>
            </li>
          ))}
        </ul>
      ) : <EmptyState icon="search" title="لا مصطلحات مطابقة" text="جرّب كلمة أخرى أو اعرض كل التصنيفات." action={<Button onClick={() => { setQ(''); setCat('all'); }}>مسح</Button>} />}
    </div>
  );
}
