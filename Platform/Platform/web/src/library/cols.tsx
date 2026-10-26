import type { Col } from '../widgets/catalog.js';
import type { LibItem } from '../../../shared/library.js';
import { CourseBadge, KindTile, ProgressBar, TagChips, fmtDate, fmtSize, kindLabel, pctOf, typeLabel } from './common.js';

export type Row = LibItem & { id: string };

/** أعمدة جدول المكتبة (مشتركة بين «كل الملفات» و«المجلدات») — ضيقة عمدًا لتناسب عرض الجوال. */
export function libCols(opts: { sortable?: boolean; showFolder?: boolean } = {}): Col<Row>[] {
  const s = opts.sortable ? { sort: () => 0 } : {};
  return [
    { key: 'name', head: 'الاسم', width: 'minmax(200px,3fr)', ...s, cell: (r) => (
      <span className="row" style={{ flexWrap: 'nowrap', gap: 10 }}>
        <KindTile kind={r.kind} size={36} />
        <span className="lib-name">
          <strong><bdi>{r.title}</bdi></strong>
          {opts.showFolder !== false && <small>{r.source === 'youtube' ? 'YouTube' : r.folder || '/'}</small>}
          <TagChips tags={r.tags} />
        </span>
      </span>
    ) },
    { key: 'kind', head: 'النوع', width: '96px', ...s, cell: (r) => <span>{kindLabel(r.kind)}{r.type ? <><br /><small className="muted">{typeLabel(r.type)}</small></> : null}</span> },
    { key: 'course', head: 'المادة', width: '104px', cell: (r) => <span><CourseBadge it={r} />{r.sem ? <><br /><small className="muted"><bdi>{r.sem}</bdi></small></> : null}</span> },
    { key: 'size', head: 'الحجم', width: '84px', ...s, cell: (r) => (r.source === 'youtube' ? <span className="muted">—</span> : <span><bdi dir="ltr">{fmtSize(r.size)}</bdi><br /><small className="muted">{fmtDate(r.mtime)}</small></span>) },
    { key: 'progress', head: 'التقدّم', width: '84px', cell: (r) => <ProgressBar value={pctOf(r)} /> },
  ];
}
