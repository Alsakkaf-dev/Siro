import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../core/app-context.js';
import { PageHead } from '../ui/page.js';
import { Badge, Button, Card, Skeleton } from '../ui/ui.js';
import { wos } from '../lib/wos.js';
import type { HistoryEntry } from '../../../shared/wos.js';

const ACTION: Record<string, { label: string; tone?: 'ok' | 'warn' | 'danger' | 'accent' }> = {
  create: { label: 'إنشاء', tone: 'ok' }, update: { label: 'تعديل', tone: 'accent' }, delete: { label: 'حذف', tone: 'danger' }, restore: { label: 'استعادة', tone: 'ok' },
  link: { label: 'ربط' }, unlink: { label: 'فك ربط' }, share: { label: 'مشاركة' }, template: { label: 'قالب' }, automation: { label: 'أتمتة' },
};
const fmt = (iso: string): string => new Intl.DateTimeFormat('ar', { dateStyle: 'medium', timeStyle: 'short' }).format(Date.parse(iso));

/** سجل النشاط: ما الذي تغيّر ومتى ومن غيّره (أنت أم قاعدة أتمتة) — مع تراجع عن تعديلات العناصر. */
export function ActivityList({ refFilter, limit = 100, compact }: { refFilter?: string; limit?: number; compact?: boolean }) {
  const { toast } = useApp();
  const [rows, setRows] = useState<(HistoryEntry & { title?: string; to?: string | null })[] | null>(null);
  const [more, setMore] = useState(true);
  const load = useCallback(() => {
    void wos.history({ ...(refFilter ? { ref: refFilter } : {}), limit }).then((r) => { setRows(r); setMore(r.length >= limit); }).catch(() => setRows([]));
  }, [refFilter, limit]);
  useEffect(load, [load]);
  if (!rows) return <Skeleton h={50} />;
  if (!rows.length) return <p className="muted" style={{ margin: 0 }}>لا نشاط بعد.</p>;
  return (
    <>
      <ol className="plain act-list">
        {rows.map((h) => (
          <li key={h.id} className="act-row">
            <Badge tone={ACTION[h.action]?.tone}>{ACTION[h.action]?.label ?? h.action}</Badge>
            <div>
              <span><bdi>{h.summary}</bdi></span>
              <small className="muted">{fmt(h.at)}{h.actor.startsWith('automation:') ? ' · بواسطة أتمتة' : ''}{!compact && h.to && h.title ? <> · <Link to={h.to}><bdi>{h.title}</bdi></Link></> : null}{h.reverted ? ' · تم التراجع' : ''}</small>
            </div>
            {h.revertible && <Button size="sm" variant="ghost" icon="undo" onClick={() => void wos.revert(h.id).then(() => { toast('تم التراجع عن التعديل', { kind: 'ok' }); load(); window.dispatchEvent(new CustomEvent('platform:items-changed')); }).catch((e: Error) => toast(e.message, { kind: 'error' }))}>تراجع</Button>}
          </li>
        ))}
      </ol>
      {more && !compact && <Button size="sm" onClick={() => void wos.history({ ...(refFilter ? { ref: refFilter } : {}), limit, before: rows[rows.length - 1]!.at }).then((r) => { setRows([...rows, ...r]); setMore(r.length >= limit); })}>تحميل المزيد</Button>}
    </>
  );
}

export default function Activity() {
  return (
    <div className="page">
      <PageHead title="سجل النشاط" icon="clock" sub="كل إنشاء وتعديل وحذف واستعادة في الموقع — من أنت أو من قاعدة أتمتة. المحذوفات تجدها في سلة المحذوفات." actions={<Button to="/trash" icon="trash">سلة المحذوفات</Button>} />
      <Card><ActivityList /></Card>
    </div>
  );
}
