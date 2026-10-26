import type { ReactNode } from 'react';
import { PageHead } from '../ui/page.js';
import { Button, EmptyState, Skeleton } from '../ui/ui.js';
import { ContentBanner, type ContentState } from '../sports/sportsKit.js';
import type { IconName } from '../lib/icons.js';

/** هيكل صفحة محتوى راشد: تحميل / خطأ / مجلد مفقود / ملف غير صالح، ثم المحتوى. */
export function ContentPage<T>({ c, title, icon, sub, label, children, actions }: { c: ContentState<T>; title: string; icon: IconName; sub?: ReactNode; label: string; children: (d: T) => ReactNode; actions?: ReactNode }) {
  const head = <PageHead title={title} icon={icon} sub={sub} actions={actions} />;
  if (c.loading) return <div className="page">{head}<Skeleton h={90} r={16} /><div style={{ height: 12 }} /><Skeleton h={300} r={16} /></div>;
  if (c.error) return <div className="page">{head}<EmptyState icon="warn" title="تعذّر الاتصال بالخادم" text={c.error} action={<Button onClick={c.reload}>إعادة المحاولة</Button>} /></div>;
  if (!c.rootExists || !c.data) {
    return (
      <div className="page">
        {head}
        <ContentBanner status={c.status} label={label} />
        <EmptyState icon={icon} title={`${label} غير متاح`} text={!c.rootExists ? 'مجلد صادرات راشد غير موجود. اضبط المسار من إعدادات الحياة.' : 'الملف غير موجود أو تغيّر تنسيقه. اطلب من راشد تحديث الصادرات.'} />
      </div>
    );
  }
  return (
    <div className="page">
      {head}
      <ContentBanner status={c.status} label={label} />
      {children(c.data)}
    </div>
  );
}
