import { Skeleton } from '../ui/ui.js';

/** هيكل تحميل بشكل الصفحة النموذجية: يقلّل القفز عند وصول المحتوى. */
export function PageSkeleton() {
  return (
    <div className="page-skel" aria-busy="true">
      <div><Skeleton h={14} w="18%" /><div style={{ height: 10 }} /><Skeleton h={26} w="34%" r={8} /></div>
      <div className="row3"><Skeleton h={86} r={12} /><Skeleton h={86} r={12} /><Skeleton h={86} r={12} /></div>
      <div className="row2"><Skeleton h={260} r={12} /><Skeleton h={260} r={12} /></div>
    </div>
  );
}
