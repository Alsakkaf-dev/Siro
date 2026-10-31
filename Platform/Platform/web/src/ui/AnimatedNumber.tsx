import { useEffect, useRef, useState } from 'react';

/** عدّاد رقمي: يتدرّج من القيمة السابقة إلى الجديدة (≤450ms، easeOut). بلا مكتبة، ويحترم prefers-reduced-motion. */
export function AnimatedNumber({ value, decimals = 0 }: { value: number; decimals?: number }) {
  const [shown, setShown] = useState(value);
  const from = useRef(value);
  useEffect(() => {
    const start = from.current;
    if (start === value || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      from.current = value;
      setShown(value);
      return;
    }
    const t0 = performance.now();
    let raf = 0;
    const tick = (now: number): void => {
      const p = Math.min(1, (now - t0) / 450);
      const v = start + (value - start) * (1 - (1 - p) ** 3);
      setShown(v);
      if (p < 1) raf = requestAnimationFrame(tick);
      else from.current = value;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <span className="num">{shown.toFixed(decimals)}</span>;
}
