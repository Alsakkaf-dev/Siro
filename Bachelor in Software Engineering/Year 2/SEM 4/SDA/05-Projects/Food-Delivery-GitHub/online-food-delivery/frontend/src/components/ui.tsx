import type { ReactNode } from 'react'

export const money = (n: number) => `RM ${Number(n ?? 0).toFixed(2)}`
export const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(' ')

export function Spinner({ light = false, className = '' }: { light?: boolean; className?: string }) {
  return (
    <span
      className={cx(
        'inline-block h-5 w-5 animate-spin rounded-full border-2',
        light ? 'border-white/40 border-t-white' : 'border-brand-200 border-t-brand-600',
        className,
      )}
    />
  )
}

export function PageLoader({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="grid place-items-center py-24 text-ink-400">
      <Spinner className="h-8 w-8" />
      <p className="mt-3 text-sm font-medium">{label}</p>
    </div>
  )
}

export function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-1 text-sm font-semibold text-amber-500">
      <span aria-hidden>★</span>
      <span className="text-ink-700">{Number(rating).toFixed(1)}</span>
    </span>
  )
}

const STATUS_STYLE: Record<string, string> = {
  PENDING_PAYMENT: 'bg-amber-50 text-amber-700 ring-amber-200',
  CONFIRMED: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  OUT_FOR_DELIVERY: 'bg-brand-50 text-brand-700 ring-brand-200',
  DELIVERED: 'bg-ink-100 text-ink-700 ring-ink-200',
  CANCELLED: 'bg-rose-50 text-rose-700 ring-rose-200',
  AWAITING_DRIVER: 'bg-amber-50 text-amber-700 ring-amber-200',
  TRACKING: 'bg-brand-50 text-brand-700 ring-brand-200',
  LAST_KNOWN: 'bg-slate-100 text-slate-700 ring-slate-200',
}

export function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLE[status] ?? 'bg-ink-100 text-ink-700 ring-ink-200'
  return (
    <span className={cx('inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ring-1', style)}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status.replace(/_/g, ' ')}
    </span>
  )
}

export function EmptyState({ icon, title, note, action }: { icon: string; title: string; note?: string; action?: ReactNode }) {
  return (
    <div className="card grid place-items-center px-6 py-16 text-center animate-fade-up">
      <div className="grid h-16 w-16 place-items-center rounded-2xl bg-brand-50 text-3xl">{icon}</div>
      <h3 className="mt-4 text-lg font-bold text-ink-800">{title}</h3>
      {note && <p className="mt-1 max-w-sm text-sm text-ink-500">{note}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
