import type { DiffResult, EntityDiff } from '../lib/api.js';
import { Badge } from './ui.js';

const ENT: Record<string, string> = { semesters: 'الفصول', courses: 'المواد', assessments: 'التقييمات', notes: 'الملاحظات' };

export function DiffView({ diff }: { diff: DiffResult }) {
  const keys = ['semesters', 'courses', 'assessments', 'notes'] as const;
  return (
    <div className="diff" aria-label="معاينة الفروقات">
      <div className="row" style={{ marginBlockEnd: 'var(--s-3)' }}>
        <Badge tone="ok">+{diff.totals.added} جديد</Badge>
        <Badge tone="warn">~{diff.totals.changed} معدّل</Badge>
        {diff.totals.removed > 0 && <Badge tone="danger">−{diff.totals.removed} غير موجود في الملف</Badge>}
        <Badge>{diff.totals.unchanged} بلا تغيير</Badge>
      </div>
      {keys.map((k) => {
        const d: EntityDiff = diff[k];
        if (!d.added.length && !d.changed.length && !d.removed.length) return null;
        return (
          <details key={k} open={d.added.length + d.changed.length + d.removed.length < 12}>
            <summary><strong>{ENT[k]}</strong> — +{d.added.length} · ~{d.changed.length} · −{d.removed.length}</summary>
            <ul className="plain diff-list">
              {d.added.map((x) => (<li key={x.id} className="add">+ <bdi>{x.label}</bdi></li>))}
              {d.changed.map((x) => (<li key={x.id} className="chg">~ <bdi>{x.label}</bdi> <small className="muted">({x.fields.map((f) => f.field).join('، ')})</small></li>))}
              {d.removed.map((x) => (<li key={x.id} className="rem">− <bdi>{x.label}</bdi></li>))}
            </ul>
          </details>
        );
      })}
    </div>
  );
}

