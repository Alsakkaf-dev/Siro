const START = { x: 14, y: 80 }
const CTRL = { x: 34, y: 26 }
const DEST = { x: 84, y: 18 }

function Pin({ x, y, emoji, label }: { x: number; y: number; emoji: string; label: string }) {
  return (
    <div className="absolute -translate-x-1/2 -translate-y-full text-center" style={{ left: `${x}%`, top: `${y}%` }}>
      <div className="grid h-9 w-9 place-items-center rounded-full bg-white text-base shadow-soft ring-1 ring-ink-200">{emoji}</div>
      <span className="mt-1 inline-block rounded-md bg-white/90 px-1.5 py-0.5 text-[10px] font-bold text-ink-500 shadow-sm">{label}</span>
    </div>
  )
}

/** A stylised live map: dashed route, a route that "fills" with progress, and a moving driver marker. */
export default function LiveMap({ progress, delivered = false }: { progress: number; delivered?: boolean }) {
  const p = Math.max(0, Math.min(1, delivered ? 1 : progress))
  const bez = (a: number, b: number, c: number) => (1 - p) * (1 - p) * a + 2 * (1 - p) * p * b + p * p * c
  const x = bez(START.x, CTRL.x, DEST.x)
  const y = bez(START.y, CTRL.y, DEST.y)
  const d = `M${START.x} ${START.y} Q${CTRL.x} ${CTRL.y} ${DEST.x} ${DEST.y}`

  return (
    <div className="map-grid relative h-72 w-full overflow-hidden rounded-2xl ring-1 ring-ink-200 sm:h-80">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
        <path d={d} fill="none" stroke="#fdba74" strokeWidth={1.3} strokeDasharray="3 2.5" strokeLinecap="round" />
        <path
          d={d}
          fill="none"
          stroke="#ea580c"
          strokeWidth={1.5}
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1 - p}
          className="transition-all duration-1000 ease-linear"
        />
      </svg>

      <Pin x={START.x} y={START.y} emoji="🍴" label="Restaurant" />
      <Pin x={DEST.x} y={DEST.y} emoji="🏠" label="You" />

      <div
        className="absolute z-10 transition-all duration-1000 ease-linear"
        style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%,-50%)' }}
      >
        {!delivered && <span className="absolute inset-0 -z-10 m-auto h-10 w-10 animate-pulse-ring rounded-full bg-brand-400/50" />}
        <span className="grid h-11 w-11 place-items-center rounded-full bg-white text-2xl shadow-soft ring-2 ring-brand-500">
          {delivered ? '✅' : '🛵'}
        </span>
      </div>

      <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-ink-500 shadow-sm ring-1 ring-ink-100">
        {delivered ? 'Arrived' : `${Math.round(p * 100)}% of the way`}
      </span>
    </div>
  )
}
