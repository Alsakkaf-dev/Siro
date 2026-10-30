import { useCallback, useEffect, useState } from 'react';
import { useApp } from '../core/app-context.js';
import { PageHead } from '../ui/page.js';
import { Badge, Button, Card, EmptyState, Skeleton } from '../ui/ui.js';
import { wos } from '../lib/wos.js';
import type { TrashEntry } from '../../../shared/wos.js';
import { fmtDateShort } from '../lib/format.js';

const KIND: Record<string, string> = { academic: 'الدراسة', library: 'المكتبة', sports: 'الرياضة', items: 'مساحاتي', space: 'مساحة', view: 'عرض', automation: 'أتمتة', relation: 'رابط' };

/** سلة المحذوفات: كل حذف في الموقع قابل للاستعادة 30 يومًا — لا يضيع شيء بسبب ضغطة خاطئة. */
export default function Trash() {
  const { toast, confirm, reloadSemesters, reloadSpaces } = useApp();
  const [rows, setRows] = useState<(TrashEntry & { count: number })[] | null>(null);
  const load = useCallback(() => void wos.trash().then(setRows).catch(() => setRows([])), []);
  useEffect(load, [load]);
  const restore = async (t: TrashEntry): Promise<void> => {
    try {
      await wos.restore(t.token);
      toast(`استُعيد ${t.label}`, { kind: 'ok' });
      load();
      void reloadSemesters();
      void reloadSpaces();
    } catch (e) {
      toast((e as Error).message, { kind: 'error' });
    }
  };
  return (
    <div className="page">
      <PageHead
        title="سلة المحذوفات"
        icon="trash"
        sub="كل ما تحذفه (فصل، مادة، تقييم، فيديو، تمرين، مساحة، عنصر…) يبقى هنا 30 يومًا ويمكن استعادته كما كان."
        crumbs={[{ to: '/settings', label: 'الإعدادات والبيانات' }, { label: 'سلة المحذوفات' }]}
        actions={rows?.length ? <Button variant="danger" icon="trash" onClick={async () => { if (await confirm({ title: 'إفراغ السلة نهائيًا؟', body: `${rows.length} عنصر لن يمكن استعادته بعد ذلك (النسخ الاحتياطية لا تتأثر).`, danger: true, confirmLabel: 'إفراغ' })) { await wos.purge(); load(); } }}>إفراغ السلة</Button> : undefined}
      />
      <Card>
        {!rows ? <Skeleton h={60} /> : rows.length ? (
          <ul className="plain trash-list">
            {rows.map((t) => (
              <li key={t.token} className="trash-row">
                <div>
                  <b><bdi>{t.label}</bdi></b>
                  <small className="muted">حُذف {fmtDateShort(Date.parse(t.deleted_at))} · {t.count} سجل · يُحذف نهائيًا {fmtDateShort(Date.parse(t.expires_at))}</small>
                </div>
                <Badge>{KIND[t.kind] ?? t.kind}</Badge>
                <Button size="sm" variant="primary" icon="undo" onClick={() => void restore(t)}>استعادة</Button>
              </li>
            ))}
          </ul>
        ) : <EmptyState icon="trash" title="السلة فارغة" text="عندما تحذف شيئًا ستجده هنا لمدة 30 يومًا." />}
      </Card>
    </div>
  );
}
