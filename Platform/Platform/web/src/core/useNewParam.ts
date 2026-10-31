import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

/** الإنشاء السريع: ?new=<قيمة> يُقرأ مرة ويُحذف من الرابط بـ replace (فلا يتكرر عند الرجوع). */
export function useNewParam(onNew: (value: string) => void): void {
  const [sp, setSp] = useSearchParams();
  const v = sp.get('new');
  useEffect(() => {
    if (!v) return;
    onNew(v);
    const next = new URLSearchParams(sp);
    next.delete('new');
    setSp(next, { replace: true });
  }, [v]);
}
