import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { cartApi, orderApi, parseError } from '../api'
import type { Cart } from '../types'
import { PageLoader, Spinner, cx, money } from '../components/ui'
import { useCart } from '../store/CartContext'
import { useToast } from '../store/ToastContext'

const DELIVERY_FEE = 0 // order total is the subtotal (SDD ORDERS.total_amount) — delivery is free

export default function Checkout() {
  const nav = useNavigate()
  const toast = useToast()
  const { refresh } = useCart()
  const [cart, setCart] = useState<Cart | null>(null)
  const [address, setAddress] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    ;(async () => {
      try {
        const c = await cartApi.get()
        if (c.items.length === 0) { nav('/cart', { replace: true }); return }
        setCart(c)
      } catch (e) {
        toast('error', parseError(e).message)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const placeOrder = async (e: FormEvent) => {
    e.preventDefault()
    if (!address.trim()) { toast('error', 'Please enter a delivery address'); return }
    setBusy(true)
    try {
      const order = await orderApi.checkout(address.trim())
      await refresh()
      toast('success', 'Order placed! Complete payment to confirm. 💳')
      nav(`/payment/${order.orderId}`, { replace: true })
    } catch (e) {
      toast('error', parseError(e).message)
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <PageLoader label="Preparing checkout…" />

  const subtotal = cart?.subtotal ?? 0

  return (
    <div className="animate-fade-up">
      <h1 className="mb-5 text-2xl font-extrabold text-ink-900">Checkout</h1>
      <form onSubmit={placeOrder} className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="card space-y-4 p-6">
          <div>
            <label className="label">Delivery address</label>
            <textarea
              className="input min-h-[7rem] resize-none"
              placeholder="Unit / floor, street, city…"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
            <p className="mt-1.5 text-xs text-ink-400">Your driver will use this to reach you.</p>
          </div>
          <div className="rounded-xl bg-ink-50 p-4">
            <h3 className="mb-2 text-sm font-bold text-ink-700">Items ({cart?.items.length})</h3>
            <ul className="space-y-1.5">
              {cart?.items.map((it) => (
                <li key={it.id} className="flex justify-between text-sm text-ink-600">
                  <span>{it.quantity} × {it.name}</span>
                  <span className="font-semibold text-ink-800">{money(it.lineTotal)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="card space-y-3 p-5">
            <h2 className="font-bold text-ink-900">Summary</h2>
            <Row label="Subtotal" value={money(subtotal)} />
            <Row label="Delivery fee" value="Free" />
            <div className="border-t border-dashed border-ink-200 pt-3">
              <Row label="Total" value={money(subtotal + DELIVERY_FEE)} strong />
            </div>
            <button className="btn-primary mt-2 w-full" disabled={busy}>
              {busy ? <Spinner light /> : 'Place order →'}
            </button>
          </div>
        </aside>
      </form>
    </div>
  )
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={cx('flex items-center justify-between text-sm', strong ? 'text-lg font-extrabold text-ink-900' : 'text-ink-600')}>
      <span>{label}</span>
      <span className={strong ? 'text-brand-600' : 'font-semibold text-ink-800'}>{value}</span>
    </div>
  )
}
