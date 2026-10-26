import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { orderApi, parseError, paymentApi } from '../api'
import type { OrderSummary } from '../types'
import { PageLoader, Spinner, StatusBadge, cx, money } from '../components/ui'
import { useAuth } from '../store/AuthContext'
import { useToast } from '../store/ToastContext'

const SCENARIOS = [
  { key: 'tok_ok', label: 'Approve', hint: 'Successful charge', emoji: '✅' },
  { key: 'tok_declined', label: 'Decline', hint: 'Card declined', emoji: '⛔' },
  { key: 'tok_timeout', label: 'Timeout', hint: 'Gateway timeout → pending', emoji: '⏱️' },
]

export default function Payment() {
  const { orderId } = useParams()
  const oid = Number(orderId)
  const nav = useNavigate()
  const toast = useToast()
  const { user } = useAuth()

  const [order, setOrder] = useState<OrderSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState('tok_ok')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    ;(async () => {
      try {
        setOrder(await orderApi.get(oid))
      } catch (e) {
        toast('error', parseError(e).message)
      } finally {
        setLoading(false)
      }
    })()
  }, [oid])

  const pay = async () => {
    if (!order) return
    setBusy(true)
    try {
      const res = await paymentApi.pay(oid, token, order.totalAmount)
      if (res.status === 'APPROVED') {
        toast('success', 'Payment approved — your order is confirmed! 🎉')
        nav(`/track/${oid}`, { replace: true })
      } else {
        toast('info', res.message || 'Payment is pending — we will reconcile it.')
      }
    } catch (e) {
      const { code, message } = parseError(e)
      if (code === 'NOT_PAYABLE') {
        toast('info', 'This order is already paid.')
        nav(`/track/${oid}`, { replace: true })
      } else {
        toast('error', message)
      }
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <PageLoader label="Loading payment…" />
  if (!order) return null

  if (order.status !== 'PENDING_PAYMENT') {
    return (
      <div className="mx-auto max-w-md py-10 text-center">
        <div className="card animate-fade-up p-8">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-emerald-50 text-3xl">✅</div>
          <h1 className="mt-4 text-xl font-extrabold text-ink-900">Order already confirmed</h1>
          <p className="mt-1 text-sm text-ink-500">Order #{order.orderId} · <StatusBadge status={order.status} /></p>
          <Link to={`/track/${oid}`} className="btn-primary mt-6 w-full">Track your delivery →</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl animate-fade-up">
      <h1 className="mb-1 text-2xl font-extrabold text-ink-900">Payment</h1>
      <p className="mb-5 text-sm text-ink-500">Order #{order.orderId} · pay to confirm your order.</p>

      <div className="grid gap-6 md:grid-cols-[1fr_15rem]">
        <div className="card space-y-5 p-6">
          {/* Card visual */}
          <div className="relative h-48 overflow-hidden rounded-2xl bg-gradient-to-br from-ink-800 via-ink-900 to-brand-800 p-5 text-white shadow-soft">
            <div className="flex items-center justify-between">
              <span className="text-2xl">💳</span>
              <span className="text-lg font-bold italic tracking-wide">VISA</span>
            </div>
            <div className="mt-5 h-7 w-11 rounded-md bg-gradient-to-br from-yellow-200 to-yellow-400" />
            <div className="mt-3 font-mono text-lg tracking-[0.2em]">4242 4242 4242 4242</div>
            <div className="mt-4 flex justify-between text-xs">
              <div><div className="text-[9px] uppercase text-white/50">Card holder</div>{user?.name ?? 'Customer'}</div>
              <div><div className="text-[9px] uppercase text-white/50">Expires</div>12/28</div>
            </div>
          </div>

          {/* Test scenarios (demo the DT-M3-1 outcomes) */}
          <div>
            <p className="label">Test outcome</p>
            <div className="grid grid-cols-3 gap-2">
              {SCENARIOS.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setToken(s.key)}
                  className={cx('rounded-xl border p-3 text-center transition', token === s.key ? 'border-brand-500 bg-brand-50 shadow-glow' : 'border-ink-200 bg-white hover:border-brand-300')}
                >
                  <div className="text-xl">{s.emoji}</div>
                  <div className="mt-1 text-sm font-bold text-ink-800">{s.label}</div>
                  <div className="text-[10px] text-ink-400">{s.hint}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-700">
            🔒 Encrypted &amp; tokenised — card details are never stored on our servers (PCI DSS).
          </div>
        </div>

        <aside className="md:sticky md:top-24 md:self-start">
          <div className="card space-y-3 p-5">
            <h2 className="font-bold text-ink-900">To pay</h2>
            <div className="text-3xl font-extrabold text-brand-600">{money(order.totalAmount)}</div>
            <p className="text-xs text-ink-400">Delivered to: {order.deliveryAddress}</p>
            <button onClick={pay} className="btn-primary w-full" disabled={busy}>
              {busy ? <Spinner light /> : `Pay ${money(order.totalAmount)}`}
            </button>
          </div>
        </aside>
      </div>
    </div>
  )
}
