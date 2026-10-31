import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { wos } from '../lib/wos.js';
import { VIEW_COMPONENTS } from '../views/Views.js';
import { applyView } from '../views/engine.js';
import { Icon } from '../lib/icons.js';
import { EmptyState, Skeleton } from '../ui/ui.js';
import { APP_NAME } from '../../../shared/constants.js';

/** صفحة المشاركة العامة (قراءة فقط) — خارج إطار الموقع: لا قائمة ولا بحث ولا أي تعديل. */
export default function PublicShare() {
  const { token = '' } = useParams();
  const [d, setD] = useState<Awaited<ReturnType<typeof wos.publicView>> | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => void wos.publicView(token).then((x) => { setD(x); document.title = `${x.space.name} · ${APP_NAME}`; }).catch((e: Error) => setErr(e.message)), [token]);
  if (err) return <main className="public-page"><EmptyState icon="lock" title="الرابط غير متاح" text={err} /></main>;
  if (!d) return <main className="public-page"><Skeleton h={300} r={20} /></main>;
  const kind = d.view?.kind === 'dashboard' || !d.view ? 'table' : d.view.kind;
  const cfg = { ...(d.view?.config ?? {}), showDone: true };
  const View = VIEW_COMPONENTS[kind];
  return (
    <main className="public-page" id="main">
      <header className="page-head">
        <div>
          <h1><span className="h-ico" style={{ background: d.space.color }}><Icon name={(d.space.icon || 'layers') as 'layers'} size={22} /></span><bdi>{d.space.name}</bdi></h1>
          {d.space.description && <p><bdi>{d.space.description}</bdi></p>}
          <p className="muted small"><Icon name="lock" size={13} /> عرض للقراءة فقط · {d.items.filter((i) => !i.parent_id).length} عنصر</p>
        </div>
      </header>
      <View type={d.type} items={applyView(d.items, d.type, cfg)} config={cfg} onOpen={() => undefined} onPatch={() => undefined} readonly />
      <footer className="muted small" style={{ marginBlockStart: 'var(--s-6)' }}>{APP_NAME}</footer>
    </main>
  );
}
