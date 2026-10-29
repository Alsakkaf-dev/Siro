import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

/** حالة في الرابط (تنجو من التحديث والرجوع): replace لا يملأ التاريخ، ولا كتابة إن لم تتغير القيمة. القيمة الافتراضية لا تُكتب. */
export function useUrlParam<T extends string>(key: string, def: T, allowed?: readonly T[]): [T, (v: T) => void] {
  const [sp, setSp] = useSearchParams();
  const raw = sp.get(key);
  const value = raw !== null && (!allowed || (allowed as readonly string[]).includes(raw)) ? (raw as T) : def;
  const set = useCallback(
    (v: T) => {
      const cur = new URLSearchParams(window.location.search);
      const next = new URLSearchParams(cur);
      if (v === def || v === '') next.delete(key);
      else next.set(key, v);
      if (next.toString() === cur.toString()) return;
      setSp(next, { replace: true });
    },
    [key, def, setSp],
  );
  return [value, set];
}

/** مجموعة قيم في معامل واحد مفصول بفواصل (?course=a,b). */
export function useUrlSet(key: string): [Set<string>, (s: Set<string>) => void] {
  const [v, set] = useUrlParam<string>(key, '');
  const s = new Set<string>(v ? v.split(',').filter(Boolean) : []);
  return [s, (n: Set<string>) => set([...n].join(','))];
}
