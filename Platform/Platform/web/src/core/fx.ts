/**
 * تأثيرات تفاعلية خفيفة بلا مكتبة: إضاءة تتبع المؤشر على العناصر القابلة للضغط (--mx/--my)، تُرسم بـ CSS فقط.
 * مستمع واحد مفوَّض على المستند، يتجاهل اللمس، ويحترم prefers-reduced-motion.
 */
const SEL = '.card.hover, a.tile, a.space-card, .lib-group, .ex-card, .cc';
let on = false;
export function installFx(): void {
  if (on || typeof document === 'undefined') return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  on = true;
  document.addEventListener(
    'pointermove',
    (e) => {
      if (e.pointerType !== 'mouse') return;
      const el = (e.target as Element | null)?.closest<HTMLElement>(SEL);
      if (!el) return;
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', `${e.clientX - r.left}px`);
      el.style.setProperty('--my', `${e.clientY - r.top}px`);
    },
    { passive: true },
  );
}
