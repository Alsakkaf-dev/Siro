import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { lib } from '../lib/api.js';
import { Icon } from '../lib/icons.js';
import { PageHead } from '../ui/page.js';
import { Button, EmptyState, Skeleton } from '../ui/ui.js';
import { DocTable } from '../widgets/catalog.js';
import { libCols } from '../library/cols.js';
import { KindTile, itemPath, useLibStatus } from '../library/common.js';
import { StatusBanner } from './Library.js';
import type { LibItem, LibTreeResult } from '../../../shared/library.js';

const cols = libCols({ showFolder: false });

export default function LibraryFolders() {
  const [sp] = useSearchParams();
  const p = (sp.get('p') ?? '').replace(/^\/+|\/+$/g, '');
  const { status, reload } = useLibStatus();
  const [data, setData] = useState<LibTreeResult | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const scanTick = status?.last_scan?.at ?? '';
  useEffect(() => {
    let alive = true;
    setErr(null);
    lib.tree(p).then((r) => alive && setData(r)).catch((e: Error) => alive && setErr(e.message));
    return () => {
      alive = false;
    };
  }, [p, scanTick]);
  const parts = p ? p.split('/') : [];
  const to = (i: number): string => (i < 0 ? '/library/folders' : `/library/folders?p=${encodeURIComponent(parts.slice(0, i + 1).join('/'))}`);

  return (
    <div className="page">
      <PageHead title="المجلدات" icon="folder" sub="تصفّح الهيكل الحقيقي لمجلد المكتبة (قراءة فقط)." actions={<Button to="/library" icon="list">كل الملفات</Button>} />
      {status && <StatusBanner status={status} reload={reload} />}
      <nav className="lib-crumbs" aria-label="مسار المجلد">
        <Link to={to(-1)}><Icon name="folder" size={15} /> الجذر</Link>
        {parts.map((s, i) => (
          <span key={i} className="row" style={{ gap: 4 }}>
            <Icon name="left" size={13} />
            {i === parts.length - 1 ? <strong><bdi>{s}</bdi></strong> : <Link to={to(i)}><bdi>{s}</bdi></Link>}
          </span>
        ))}
      </nav>
      {err ? (
        <div className="callout danger" role="alert">{err}</div>
      ) : !data ? (
        <Skeleton h={200} r={16} />
      ) : data.folders.length === 0 && data.files.length === 0 ? (
        <EmptyState icon="folder" title="المجلد فارغ" text={p ? 'لا توجد ملفات هنا.' : 'لا ملفات بعد — اضبط مجلد المكتبة من الإعدادات ثم افحصه.'} action={p ? <Button to="/library/folders">العودة للجذر</Button> : <Button to="/settings?tab=sources" variant="primary">إعدادات المكتبة</Button>} />
      ) : (
        <>
          {data.folders.length > 0 && (
            <div className="lib-folders stagger">
              {data.folders.map((f, i) => (
                <Link key={f.path} to={`/library/folders?p=${encodeURIComponent(f.path)}`} className="lib-folder" style={{ '--i': i } as never}>
                  <KindTile kind="archive" size={38} />
                  <span style={{ minWidth: 0 }}><strong><bdi>{f.name}</bdi></strong><small className="num">{f.files} ملف</small></span>
                </Link>
              ))}
            </div>
          )}
          {data.files.length > 0 && <div className="lib-table"><DocTable rows={data.files} cols={cols} rowTo={(r) => itemPath(r)} rowLabel={(r) => `فتح ${r.title}`} /></div>}
        </>
      )}
    </div>
  );
}
