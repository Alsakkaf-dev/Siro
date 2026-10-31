/** «مرتبط بـ»: روابط أي كيان بأي كيان آخر عبر كل الخطوط، مع الروابط العكسية (backlinks). */
import { useCallback, useEffect, useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../core/app-context.js';
import { wos } from '../lib/wos.js';
import { Icon } from '../lib/icons.js';
import { Card, CardHead, IconButton } from '../ui/ui.js';
import { RefPicker } from '../views/fields.js';
import { RELATION_KINDS, RELATION_LABEL, type LinkView, type RelationKind } from '../../../shared/wos.js';

export function RelationsList({ refId, compact }: { refId: string; compact?: boolean }) {
  const { toast } = useApp();
  const id = useId();
  const [links, setLinks] = useState<LinkView[] | null>(null);
  const [kind, setKind] = useState<RelationKind>('relates');
  const load = useCallback(() => void wos.links(refId).then(setLinks).catch(() => setLinks([])), [refId]);
  useEffect(load, [load]);
  const add = async (dst: string): Promise<void> => {
    try {
      await wos.link(refId, dst, kind);
      load();
    } catch (e) {
      toast((e as Error).message, { kind: 'error' });
    }
  };
  const remove = async (l: LinkView): Promise<void> => {
    const r = await wos.unlink(l.id);
    load();
    toast(`أُزيل الرابط مع «${l.other.title}»`, { kind: 'ok', action: { label: 'تراجع', run: () => void wos.restore(r.undo).then(load) } });
  };
  return (
    <div className="wrel">
      {links === null ? <p className="muted small">…</p> : links.length ? (
        <ul className="plain rel-list">
          {links.map((l) => (
            <li key={l.id} className={l.other.missing ? 'missing' : undefined}>
              <span className="rel-kind">{l.label}</span>
              {l.other.to ? <Link to={l.other.to}><Icon name={(l.other.icon ?? 'link') as 'link'} size={14} /> <bdi>{l.other.title}</bdi></Link> : <span className="muted"><bdi>{l.other.title}</bdi></span>}
              {l.other.subtitle && !compact && <small className="muted"><bdi>{l.other.subtitle}</bdi></small>}
              <IconButton icon="x" sm ghost label={`إزالة الرابط مع «${l.other.title}»`} onClick={() => void remove(l)} />
            </li>
          ))}
        </ul>
      ) : <p className="muted small" style={{ margin: 0 }}>لا روابط بعد. اربط هذا بأي شيء: عنصر، مادة، تقييم، ملف، فيديو، تمرين.</p>}
      <div className="rel-add">
        <label className="sr-only" htmlFor={`${id}-k`}>نوع الرابط</label>
        <select id={`${id}-k`} value={kind} onChange={(e) => setKind(e.target.value as RelationKind)}>
          {RELATION_KINDS.map((k) => <option key={k} value={k}>{RELATION_LABEL[k]}</option>)}
        </select>
        <RefPicker id={`${id}-p`} label="ربط بعنصر من أي مكان" placeholder="اربط بـ… (ابحث في كل الموقع)" exclude={[refId, ...(links ?? []).map((l) => l.other.ref)]} onPick={(r) => r && void add(r.ref)} />
      </div>
    </div>
  );
}

export function RelationsCard({ refId, title = 'مرتبط بـ' }: { refId: string; title?: string }) {
  return (
    <Card>
      <CardHead title={title} icon="link" info="روابط في الاتجاهين: ما تربطه هنا يظهر أيضًا في صفحة الطرف الآخر." />
      <RelationsList refId={refId} />
    </Card>
  );
}
