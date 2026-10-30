import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../core/app-context.js';
import { PageHead } from '../ui/page.js';
import { Badge, Button, Card, EmptyState, Skeleton, cx } from '../ui/ui.js';
import { wos } from '../lib/wos.js';
import type { InboxEntry } from '../../../shared/wos.js';
import { fmtDateShort } from '../lib/format.js';

/** الوارد: صندوق فرز واحد لتنبيهات الأتمتة وغيرها (Asana Inbox). مواعيد الفصل في الجرس وفي «اليوم». */
export default function Inbox() {
  const { toast } = useApp();
  const [rows, setRows] = useState<InboxEntry[] | null>(null);
  const load = useCallback(() => void wos.inbox().then(setRows).catch(() => setRows([])), []);
  useEffect(load, [load]);
  const unread = rows?.filter((r) => !r.read).length ?? 0;
  return (
    <div className="page">
      <PageHead
        title="الوارد"
        icon="bell"
        sub="تنبيهات قواعد الأتمتة (مثل «ذكّرني قبل الموعد») وأي ملاحظة توجّهها لنفسك."
        badge={unread ? <Badge tone="accent">{unread} جديد</Badge> : undefined}
        actions={<><Button to="/week" icon="calendar">المواعيد</Button><Button icon="check" disabled={!unread} onClick={() => void wos.readInbox().then(() => { load(); toast('عُلّم الكل كمقروء', { kind: 'ok' }); })}>تعليم الكل كمقروء</Button></>}
      />
      <Card>
        {!rows ? <Skeleton h={60} /> : rows.length ? (
          <ul className="plain inbox-list">
            {rows.map((r) => (
              <li key={r.id} className={cx('inbox-row', !r.read && 'unread')}>
                <span className="dot" aria-hidden="true" />
                <div>
                  {r.to ? <Link to={r.to} onClick={() => void wos.readInbox([r.id])}><bdi>{r.title}</bdi></Link> : <bdi>{r.title}</bdi>}
                  {r.body && <small className="muted"><bdi>{r.body}</bdi></small>}
                </div>
                <small className="muted num">{fmtDateShort(Date.parse(r.at))}</small>
                {!r.read && <Button size="sm" variant="ghost" onClick={() => void wos.readInbox([r.id]).then(load)}>مقروء<span className="sr-only"> — {r.title}</span></Button>}
              </li>
            ))}
          </ul>
        ) : <EmptyState icon="bell" title="الوارد فارغ" text="أضف قاعدة «عندما يقترب الموعد ← نبّهني» في أي مساحة لتصلك التنبيهات هنا." action={<Button to="/spaces/automations">الأتمتة</Button>} />}
      </Card>
    </div>
  );
}
