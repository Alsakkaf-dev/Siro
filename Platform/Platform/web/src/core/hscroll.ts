/**
 * تمرير الأشرطة الأفقية (شريط القسم، التبويبات، المبدّلات) كما في المواقع الاحترافية:
 * عجلة الفأرة العمودية تحرّك الشريط أفقيًا، والسحب بالفأرة يعمل، والنشط يتوسّط، وتلاشٍ عند الحواف حين يوجد مزيد.
 */
import { useEffect, type RefObject } from 'react';

const SEL = '.hscroll, .tabs, .switcher';
const canScroll = (el: HTMLElement): boolean => el.scrollWidth > el.clientWidth + 1;
/** المسافة من بداية الشريط (تعمل في RTL حيث scrollLeft سالب) */
const pos = (el: HTMLElement): number => Math.abs(el.scrollLeft);

let installed = false;
/** مستمعات مفوَّضة واحدة على المستند: عجلة + سحب. */
export function installHScroll(): void {
  if (installed || typeof document === 'undefined') return;
  installed = true;
  document.addEventListener(
    'wheel',
    (e) => {
      if (e.ctrlKey || Math.abs(e.deltaX) >= Math.abs(e.deltaY)) return;
      const el = (e.target as Element | null)?.closest<HTMLElement>(SEL);
      if (!el || !canScroll(el)) return;
      const max = el.scrollWidth - el.clientWidth;
      const forward = e.deltaY > 0;
      if ((forward && pos(el) >= max - 1) || (!forward && pos(el) <= 1)) return; // عند الحافة يتابع تمرير الصفحة
      e.preventDefault();
      el.scrollBy({ left: getComputedStyle(el).direction === 'rtl' ? -e.deltaY : e.deltaY });
    },
    { passive: false },
  );
  let drag: { el: HTMLElement; x: number; s: number; moved: boolean } | null = null;
  document.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    const el = (e.target as Element | null)?.closest<HTMLElement>(SEL);
    if (el && canScroll(el)) drag = { el, x: e.clientX, s: el.scrollLeft, moved: false };
  });
  document.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.x;
    if (!drag.moved && Math.abs(dx) > 5) {
      drag.moved = true;
      drag.el.classList.add('dragging');
    }
    if (drag.moved) drag.el.scrollLeft = drag.s - dx;
  });
  const end = (): void => {
    if (drag?.moved) {
      drag.el.classList.remove('dragging');
      const stop = (ev: Event): void => ev.stopPropagation();
      document.addEventListener('click', stop, { capture: true, once: true });
      window.setTimeout(() => document.removeEventListener('click', stop, true), 0);
    }
    drag = null;
  };
  document.addEventListener('pointerup', end);
  document.addEventListener('pointercancel', end);
}

/** تلاشي الحواف (data-fade-start/end) وتوسيط العنصر النشط عند تغيّر key. */
export function useBarFade(ref: RefObject<HTMLElement | null>, key: string): void {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = (): void => {
      const max = el.scrollWidth - el.clientWidth;
      el.toggleAttribute('data-fade-start', max > 1 && pos(el) > 2);
      el.toggleAttribute('data-fade-end', max > 1 && pos(el) < max - 2);
    };
    const active = el.querySelector<HTMLElement>('[aria-current="page"]');
    if (active && canScroll(el)) {
      const a = active.getBoundingClientRect();
      const r = el.getBoundingClientRect();
      el.scrollLeft += a.left + a.width / 2 - (r.left + r.width / 2);
    }
    update();
    el.addEventListener('scroll', update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', update);
      ro.disconnect();
    };
  }, [ref, key]);
}
