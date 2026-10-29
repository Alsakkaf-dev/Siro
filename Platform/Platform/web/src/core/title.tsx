import { createContext, useContext, useEffect, type ReactNode } from 'react';

/** تجاوز عنوان الصفحة: تأثير الابن يسبق تأثير الأب، لذا تضع الصفحة تجاوزها هنا ويحسب Shell العنوان النهائي. */
const Ctx = createContext<(t: string | null) => void>(() => undefined);

export function TitleProvider({ set, children }: { set: (t: string | null) => void; children: ReactNode }) {
  return <Ctx.Provider value={set}>{children}</Ctx.Provider>;
}

/** للصفحات الديناميكية (مادة، عنصر مكتبة): العنوان بدل تسمية السجل، ويُنظَّف عند الفك. */
export function usePageTitle(t: string | null | undefined): void {
  const set = useContext(Ctx);
  useEffect(() => {
    set(t ?? null);
    return () => set(null);
  }, [t, set]);
}
