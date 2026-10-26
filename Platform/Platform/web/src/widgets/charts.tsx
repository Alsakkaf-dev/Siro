import { useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { cx } from '../ui/ui.js';

const css = (c: string): CSSProperties => ({ '--c': c }) as CSSProperties;

/* ───────── Ring (d01 d03 d05 d08) ───────── */
export function Ring({ value, size = 56, stroke = 6, color = 'var(--accent)', label, sub }: { value: number | null; size?: number; stroke?: number; color?: string; label?: ReactNode; sub?: string }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = value === null ? 0 : Math.max(0, Math.min(100, value));
  return (
    <span className="ring" style={{ width: size, height: size }} role="img" aria-label={sub ?? `${Math.round(v)}%`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--heat-0)" strokeWidth={stroke} />
        <circle className="ring-fg" cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - v / 100)} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      </svg>
      <span className="ring-l num">{label ?? (value === null ? '—' : Math.round(v))}</span>
    </span>
  );
}

/* ───────── Donut + legend rows (d03 d04 d14) ───────── */
export interface Seg { label: string; value: number; color: string }
export function Donut({ segments, centerTop, centerBottom, size = 168 }: { segments: Seg[]; centerTop: ReactNode; centerBottom?: string; size?: number }) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const r = size / 2 - 14;
  const c = 2 * Math.PI * r;
  let acc = 0;
  return (
    <div className="donut" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={segments.map((s) => `${s.label} ${Math.round((s.value / total) * 100)}%`).join('، ')}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--heat-0)" strokeWidth={22} />
        {segments.map((s, i) => {
          const len = (s.value / total) * c;
          const el = (
            <circle key={i} className="donut-seg" style={{ animationDelay: `${i * 90}ms` }} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={s.color} strokeWidth={22} strokeDasharray={`${Math.max(0, len - 3)} ${c}`} strokeDashoffset={-acc} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
          );
          acc += len;
          return el;
        })}
      </svg>
      <div className="donut-c">
        <strong className="num">{centerTop}</strong>
        {centerBottom && <small>{centerBottom}</small>}
      </div>
    </div>
  );
}
export function LegendRows({ rows }: { rows: { label: string; value: number; max: number; color: string; right?: ReactNode }[] }) {
  return (
    <div className="legend-rows">
      {rows.map((r, i) => (
        <div key={i} className="lr">
          <span className="dot" style={{ background: r.color }} />
          <span className="lr-main">
            <span className="lr-top"><bdi>{r.label}</bdi><b className="num">{r.right ?? r.value}</b></span>
            <span className="bar-track thin"><i className="bar-fill" style={{ ...css(r.color), '--p': r.max ? Math.min(1, r.value / r.max) : 0 } as CSSProperties} /></span>
          </span>
        </div>
      ))}
    </div>
  );
}

/* ───────── Segmented-arc gauge (d12) ───────── */
export function Gauge({ value, target, ticks = 25, label, sub }: { value: number; target?: number; ticks?: number; label: ReactNode; sub?: ReactNode }) {
  const v = Math.max(0, Math.min(100, value));
  const lit = Math.round((v / 100) * ticks);
  return (
    <div className="gauge" dir="ltr">
      <svg viewBox="0 0 220 128" role="img" aria-label={`${Math.round(v)} من 100`}>
        {Array.from({ length: ticks }, (_, i) => {
          const ang = (i / (ticks - 1)) * 180;
          const on = i < lit;
          const hue = i / (ticks - 1);
          return (
            <g key={i} transform={`translate(110 112) rotate(${ang})`}>
              <rect className={cx('g-tick', on && 'on')} style={{ animationDelay: `${i * 22}ms`, fill: on ? `color-mix(in srgb, var(--accent) ${100 - hue * 100}%, var(--lime))` : 'var(--heat-0)' }} x={-100} y={-6} width={26} height={12} rx={6} />
            </g>
          );
        })}
        {target !== undefined && (
          <g transform={`translate(110 112) rotate(${(Math.min(100, target) / 100) * 180})`}>
            <rect x={-104} y={-1.5} width={36} height={3} rx={1.5} fill="var(--ink)" />
          </g>
        )}
      </svg>
      <div className="gauge-c">
        <strong className="num">{label}</strong>
        {sub && <small>{sub}</small>}
      </div>
    </div>
  );
}

/* ───────── Capsule bars: hatched inactive + solid selected + dark tooltip (d06 d10 d12 d13) ───────── */
export interface CapDatum { key: string; label: string; sub?: string; value: number; tip?: string; hot?: boolean; muted?: boolean; color?: string }
export function CapsuleBars({ data, selected, onSelect, height = 190, unit = '', ariaLabel }: { data: CapDatum[]; selected: string | null; onSelect: (k: string) => void; height?: number; unit?: string; ariaLabel: string }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="caps" style={{ height }} role="group" aria-label={ariaLabel}>
      {data.map((d, i) => {
        const on = selected === d.key;
        const h = d.value === 0 ? 0.06 : 0.12 + 0.88 * (d.value / max);
        return (
          <button key={d.key} type="button" className={cx('cap', on && 'on', d.hot && 'hot', d.muted && 'muted')} onMouseEnter={() => onSelect(d.key)} onFocus={() => onSelect(d.key)} onClick={() => onSelect(d.key)} aria-pressed={on} style={css(d.color ?? 'var(--accent)')}>
            <span className="cap-tip" aria-hidden="true">{d.tip ?? `${d.value}${unit}`}</span>
            <span className="cap-track">
              <i className={cx('cap-bar', !on && 'hatch')} style={{ transform: `scaleY(${h})`, animationDelay: `${i * 28}ms` }} />
            </span>
            <span className="cap-l">{d.label}</span>
            <span className="sr-only">{`: ${d.value}${unit}${d.tip ? ' — ' + d.tip : ''}`}</span>
            {d.sub && <span className="cap-s">{d.sub}</span>}
          </button>
        );
      })}
    </div>
  );
}

/* ───────── Grouped bars, two series (d04 d08) ───────── */
export function GroupedBars({ labels, series, max = 100, height = 200, unit = '%' }: { labels: string[]; series: { name: string; color: string; values: (number | null)[] }[]; max?: number; height?: number; unit?: string }) {
  return (
    <div>
      <div className="gb" style={{ height }}>
        <div className="gb-grid" aria-hidden="true">
          {[100, 75, 50, 25, 0].map((t) => (
            <span key={t}><em>{Math.round((t / 100) * max)}{unit}</em></span>
          ))}
        </div>
        <div className="gb-cols">
          {labels.map((l, i) => (
            <div key={i} className="gb-col">
              <div className="gb-bars">
                {series.map((s) => {
                  const v = s.values[i];
                  return (
                    <i key={s.name} className="gb-bar" title={`${s.name}: ${v === null || v === undefined ? '—' : v + unit}`} style={{ background: s.color, transform: `scaleY(${v ? Math.min(1, v / max) : 0.02})`, animationDelay: `${i * 60}ms` }} />
                  );
                })}
              </div>
              <span className="gb-l"><bdi>{l}</bdi></span>
            </div>
          ))}
        </div>
      </div>
      <div className="legend">
        {series.map((s) => (
          <span key={s.name}><i className="dot" style={{ background: s.color }} /> {s.name}</span>
        ))}
      </div>
    </div>
  );
}

/* ───────── Sparkline (d03 d04 d08) ───────── */
export function Sparkline({ values, color = 'var(--accent)', w = 90, h = 32, fill = true }: { values: number[]; color?: string; w?: number; h?: number; fill?: boolean }) {
  const max = Math.max(1, ...values);
  const n = Math.max(1, values.length - 1);
  const pts = values.map((v, i) => [w - (i / n) * w, h - 3 - (v / max) * (h - 8)] as const);
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
  return (
    <svg className="spark" width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      {fill && <path d={`${d} L0 ${h} L${w} ${h} Z`} fill={color} opacity={0.14} />}
      <path className="spark-l" d={d} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" pathLength={1} />
    </svg>
  );
}

/* ───────── Area/line with hover tooltip (d03 d04 d08 d14) ───────── */
export function AreaLine({ values, labels, color = 'var(--accent)', unit = '%', height = 180, hotIdx }: { values: number[]; labels: string[]; color?: string; unit?: string; height?: number; hotIdx?: number }) {
  const W = 560;
  const H = height;
  const pad = 26;
  const max = Math.max(1, ...values);
  const [hover, setHover] = useState<number | null>(hotIdx ?? null);
  const n = Math.max(1, values.length - 1);
  const pts = useMemo(() => values.map((v, i) => [W - pad - (i / n) * (W - 2 * pad), H - 28 - (v / max) * (H - 56)] as const), [values, n, max, H]);
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
  const hp = hover !== null ? pts[hover] : undefined;
  return (
    <div className="area" style={{ height }}>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label="مخطط تراكمي">
        {[0, 0.5, 1].map((t) => (
          <line key={t} x1={pad} x2={W - pad} y1={H - 28 - t * (H - 56)} y2={H - 28 - t * (H - 56)} stroke="var(--border)" strokeDasharray="3 5" />
        ))}
        <path d={`${d} L${pts[pts.length - 1]?.[0] ?? 0} ${H - 28} L${pts[0]?.[0] ?? 0} ${H - 28} Z`} fill={color} opacity={0.12} className="area-fill" />
        <path d={d} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="area-l" pathLength={1} />
        {hp && (
          <g>
            <line x1={hp[0]} x2={hp[0]} y1={12} y2={H - 28} stroke={color} strokeDasharray="3 4" opacity={0.6} />
            <circle cx={hp[0]} cy={hp[1]} r={6} fill="var(--surface)" stroke={color} strokeWidth={3} />
          </g>
        )}
        {pts.map((p, i) => (
          <rect key={i} x={p[0] - (W - 2 * pad) / n / 2} y={0} width={(W - 2 * pad) / n} height={H} fill="transparent" onMouseEnter={() => setHover(i)} />
        ))}
      </svg>
      {hp && hover !== null && (
        <span className="tip-pill" style={{ insetInlineStart: `${(hp[0] / W) * 100}%`, top: Math.max(0, (hp[1] / H) * 100 - 16) + '%' }}>
          {labels[hover]}: {Math.round((values[hover] ?? 0) * 10) / 10}{unit}
        </span>
      )}
      <div className="area-x" aria-hidden="true">
        {labels.map((l, i) => (
          <span key={i}>{l}</span>
        ))}
      </div>
    </div>
  );
}

/* ───────── Scatter (d03) ───────── */
export interface ScatterPt { x: number; y: number; color: string; shape: 'c' | 's' | 't'; label: string }
export function Scatter({ points, xMax, yMax, height = 220 }: { points: ScatterPt[]; xMax: number; yMax: number; height?: number }) {
  const W = 520;
  const H = height;
  const pl = 34;
  const pb = 26;
  const X = (x: number): number => W - 14 - (x / xMax) * (W - pl - 14);
  const Y = (y: number): number => H - pb - (y / yMax) * (H - pb - 10);
  return (
    <svg className="scatter" style={{ direction: 'ltr' }} viewBox={`0 0 ${W} ${H}`} role="img" aria-label="مخطط تشتت: الأسبوع مقابل الوزن">
      {[0, 0.25, 0.5, 0.75, 1].map((t) => (
        <g key={t}>
          <line x1={pl} x2={W - 14} y1={Y(t * yMax)} y2={Y(t * yMax)} stroke="var(--border)" strokeDasharray="3 5" />
          <text x={pl - 6} y={Y(t * yMax) + 4} fontSize="10" textAnchor="end" fill="var(--text-3)">{Math.round(t * yMax)}%</text>
        </g>
      ))}
      {[0, 4, 8, 12, 16].filter((w) => w <= xMax).map((w) => (
        <text key={w} x={X(w)} y={H - 8} fontSize="10" textAnchor="middle" fill="var(--text-3)">{w === 0 ? '؟' : `W${w}`}</text>
      ))}
      {points.map((p, i) => {
        const cx0 = X(p.x);
        const cy0 = Y(p.y);
        return (
          <g key={i} className="sc-pt" style={{ animationDelay: `${i * 14}ms` }}>
            <title>{p.label}</title>
            {p.shape === 'c' && <circle cx={cx0} cy={cy0} r={6} fill={p.color} opacity={0.9} />}
            {p.shape === 's' && <rect x={cx0 - 5.5} y={cy0 - 5.5} width={11} height={11} rx={2.5} fill={p.color} opacity={0.9} />}
            {p.shape === 't' && <path d={`M${cx0} ${cy0 - 7} L${cx0 + 7} ${cy0 + 5} L${cx0 - 7} ${cy0 + 5} Z`} fill={p.color} opacity={0.9} />}
          </g>
        );
      })}
    </svg>
  );
}

/* ───────── Dot matrix (d13 x05) ───────── */
export function DotMatrix({ columns, height = 5, color = 'var(--accent)', hot }: { columns: { label: string; dots: number; tip?: string }[]; height?: number; color?: string; hot?: number }) {
  return (
    <div className="dotm" role="img" aria-label="مصفوفة نقاط الحمل الأسبوعي">
      {columns.map((c, ci) => (
        <div key={ci} className="dm-col" title={c.tip}>
          <div className="dm-dots">
            {Array.from({ length: height }, (_, r) => {
              const on = r < Math.min(height, c.dots);
              return <i key={r} className={cx('dm-dot', on && 'on', hot === ci && on && 'hot')} style={{ ...(on ? { background: hot === ci ? 'var(--lime)' : color } : {}), animationDelay: `${ci * 30 + r * 40}ms` }} />;
            })}
          </div>
          <span className="dm-l">{c.label}</span>
        </div>
      ))}
    </div>
  );
}

/* ───────── Tick bar (d10) ───────── */
export function TickBar({ value, max, ticks = 24, color = 'var(--accent)' }: { value: number; max: number; ticks?: number; color?: string }) {
  const on = Math.round((Math.max(0, Math.min(max, value)) / (max || 1)) * ticks);
  return (
    <span className="tickbar" role="img" aria-label={`${value} من ${max}`}>
      {Array.from({ length: ticks }, (_, i) => (
        <i key={i} className={cx(i < on && 'on')} style={{ ...(i < on ? { background: color } : {}), animationDelay: `${i * 18}ms` }} />
      ))}
    </span>
  );
}

/* ───────── Segmented breakdown bar with legend (d06) ───────── */
export function SegBar({ segments }: { segments: Seg[] }) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  return (
    <div>
      <div className="segbar" role="img" aria-label={segments.map((s) => `${s.label}: ${s.value}`).join('، ')}>
        {segments.filter((s) => s.value > 0).map((s, i) => (
          <i key={i} className={cx(s.label.includes('غير') && 'hatch')} style={{ flexGrow: s.value / total, background: s.label.includes('غير') ? undefined : s.color, animationDelay: `${i * 80}ms` }} title={`${s.label}: ${s.value}`} />
        ))}
      </div>
      <div className="legend">
        {segments.map((s) => (
          <span key={s.label}><i className="dot" style={{ background: s.color }} /> {s.label} <b className="num">{s.value}</b></span>
        ))}
      </div>
    </div>
  );
}

/* ───────── Funnel with hatched bars (d13) ───────── */
export function Funnel({ steps }: { steps: { label: string; value: number; sub?: string }[] }) {
  const max = Math.max(1, ...steps.map((s) => s.value));
  return (
    <div className="funnel">
      {steps.map((s, i) => (
        <div key={i} className="fn-col">
          <small>{s.label}</small>
          <strong className="num">{s.sub ?? s.value}</strong>
          <span className="fn-track"><i className={cx('fn-bar', i > 0 && 'hatch')} style={{ transform: `scaleY(${Math.max(0.05, s.value / max)})`, animationDelay: `${i * 90}ms`, ...(i === 0 ? { background: 'var(--accent)' } : {}) }} /></span>
        </div>
      ))}
    </div>
  );
}

/* ───────── Sankey (d14): المواد (يمين) → أنواع التقييم (يسار) ───────── */
export interface SankeyNode { id: string; label: string; value: number; color: string }
export function Sankey({ left, right, links, height = 300 }: { left: SankeyNode[]; right: SankeyNode[]; links: { from: string; to: string; value: number }[]; height?: number }) {
  const VW = 720;
  const H = height;
  const gap = 8;
  const nw = 12;
  const lab = 170;
  const total = left.reduce((s, n) => s + n.value, 0) || 1;
  const layout = (nodes: SankeyNode[], tot: number): Map<string, { y: number; h: number }> => {
    const usable = H - gap * Math.max(0, nodes.length - 1);
    let y = 0;
    const m = new Map<string, { y: number; h: number }>();
    for (const n of nodes) {
      const h = Math.max(4, (n.value / tot) * usable);
      m.set(n.id, { y, h });
      y += h + gap;
    }
    return m;
  };
  const rTotal = right.reduce((s, n) => s + n.value, 0) || 1;
  const L = layout(left, total);
  const R = layout(right, rTotal);
  const offL = new Map<string, number>();
  const offR = new Map<string, number>();
  const x1 = VW - lab - nw; // حافة عقدة المادة (يمين)
  const x2 = lab + nw; // حافة عقدة النوع (يسار)
  const mx = (x1 + x2) / 2;
  const [hov, setHov] = useState<string | null>(null);
  const scaleL = (H - gap * Math.max(0, left.length - 1)) / total;
  const scaleR = (H - gap * Math.max(0, right.length - 1)) / rTotal;
  return (
    <div className="sankey">
      <svg direction="ltr" style={{ direction: 'ltr' }} viewBox={`0 0 ${VW} ${H}`} role="img" aria-label="تدفق الأوزان من المواد إلى أنواع التقييم" preserveAspectRatio="xMidYMid meet">
        {links.map((lk, i) => {
          const a = L.get(lk.from);
          const b = R.get(lk.to);
          if (!a || !b) return null;
          const tl = lk.value * scaleL;
          const tr = lk.value * scaleR;
          const ya = a.y + (offL.get(lk.from) ?? 0);
          const yb = b.y + (offR.get(lk.to) ?? 0);
          offL.set(lk.from, (offL.get(lk.from) ?? 0) + tl);
          offR.set(lk.to, (offR.get(lk.to) ?? 0) + tr);
          const col = left.find((n) => n.id === lk.from)?.color ?? 'var(--accent)';
          const on = hov === null || hov === lk.from || hov === lk.to;
          return <path key={i} className="sk-link" style={{ animationDelay: `${i * 18}ms` }} d={`M${x1} ${ya} C${mx} ${ya}, ${mx} ${yb}, ${x2} ${yb} L${x2} ${yb + tr} C${mx} ${yb + tr}, ${mx} ${ya + tl}, ${x1} ${ya + tl} Z`} fill={col} opacity={on ? 0.34 : 0.07} />;
        })}
        {left.map((n) => {
          const p = L.get(n.id)!;
          return (
            <g key={n.id} onMouseEnter={() => setHov(n.id)} onMouseLeave={() => setHov(null)}>
              <rect x={x1} y={p.y} width={nw} height={p.h} rx={5} fill={n.color} />
              <text x={x1 + nw + 8} y={p.y + p.h / 2 + 4} fontSize="12" fill="var(--text)" fontWeight="600">{n.label}</text>
            </g>
          );
        })}
        {right.map((n) => {
          const p = R.get(n.id)!;
          return (
            <g key={n.id} onMouseEnter={() => setHov(n.id)} onMouseLeave={() => setHov(null)}>
              <rect x={x2 - nw} y={p.y} width={nw} height={p.h} rx={5} fill={n.color} />
              <text x={x2 - nw - 8} y={p.y + p.h / 2 + 4} fontSize="12" fill="var(--text)" textAnchor="end" fontWeight="600">{n.label} · {Math.round(n.value * 10) / 10}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
