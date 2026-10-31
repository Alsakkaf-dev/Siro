import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../core/app-context.js';
import { flagEnabled } from '../core/flags.js';
import { AREAS, hrefFor } from '../core/registry.js';
import { Icon } from '../lib/icons.js';
import { Button, EmptyState } from '../ui/ui.js';

/** 404 مفيد: رجوع، بحث، وروابط الأقسام. */
export default function NotFound() {
  const nav = useNavigate();
  const { activeId } = useApp();
  const [q, setQ] = useState('');
  const back = (): void => {
    if (window.history.length > 1) nav(-1);
    else nav('/');
  };
  return (
    <div className="page">
      <EmptyState
        icon="search"
        title="الصفحة غير موجودة"
        text="الرابط غير صحيح أو أن العنصر حُذف. ارجع، أو ابحث، أو اختر قسمًا."
        action={
          <div className="stack nf-actions">
            <div className="row" style={{ justifyContent: 'center' }}>
              <Button variant="primary" icon="arrowLeft" onClick={back}>رجوع</Button>
              <Button to="/" icon="sparkle">اليوم</Button>
            </div>
            <form className="row" style={{ justifyContent: 'center' }} role="search" onSubmit={(e) => { e.preventDefault(); if (q.trim()) nav(`/search?q=${encodeURIComponent(q.trim())}`); }}>
              <input className="input" style={{ maxInlineSize: 280 }} value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث في المنصة…" aria-label="ابحث في المنصة" />
              <Button type="submit" icon="search">بحث</Button>
            </form>
            <nav className="row" style={{ justifyContent: 'center' }} aria-label="الأقسام">
              {AREAS.filter((a) => !a.flag || flagEnabled(a.flag)).map((a) => (
                <Link key={a.id} to={hrefFor(a.entry, activeId)} className="chip"><Icon name={a.icon} size={14} /> {a.label}</Link>
              ))}
            </nav>
          </div>
        }
      />
    </div>
  );
}
