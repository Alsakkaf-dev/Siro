import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { cartApi, parseError } from '../api'
import type { Cart as CartType } from '../types'
import { EmptyState, PageLoader, cx, money } from '../components/ui'
import { useCart } from '../store/CartContext'
import { useToast } from '../store/ToastContext'

const DELIVERY_FEE = 0 // order total is the subtotal (SDD ORDERS.total_amount) — delivery is free

export default function Cart() {
  const nav = useNavigate()
  const toast = useToast()
  const { refresh } = useCart()
  const [cart, setCart] = useState<CartType | null>(null)
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<number | null>(null)

  const load = async () => {
    try {
      setCart(await cartApi.get())
    } catch (e) {
      toast('error', parseError(e).message)
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { void load() }, [])

  const setQty = async (id: number, qty: number) => {
    if (qty < 1 || qty > 20) return
    setBusyId(id)
    try {
      setCart(await cartApi.updateItem(id, qty))
      await refresh()
    } catch (e) {
      toast('error', parseError(e).message)
    } finally {
      setBusyId(null)
    }
  }

  if (loading) return <PageLoader label="Loading your cart…" />

  const items = cart?.items ?? []
  const subtotal = cart?.subtotal ?? 0

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-lg py-8">
        <EmptyState
          icon="🛒"
          title="Your cart is empty"
          note="Browse restaurants and add some tasty items to get started."
          action={<Link to="/" className="btn-primary">Browse restaurants</Link>}
        />
      </div>
    )
  }

  return (
    <div className="animate-fade-up">
      <h1 className="mb-5 text-2xl font-extrabold text-ink-900">Your cart</h1>
      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-3">
          {items.map((it) => (
            <div key={it.id} className="card flex items-center gap-4 p-4">
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-brand-50 text-2xl">🍽️</span>
              <div className="min-w-0 flex-1">
                <h3 className="truncate font-bold text-ink-900">{it.name}</h3>
                <p className="text-sm text-ink-500">{money(it.unitPrice)} each</p>
              </div>
              <div className="flex items-center gap-1 rounded-xl border border-ink-200 p-1">
                <button onClick={() => setQty(it.id, it.quantity - 1)} disabled={busyId === it.id || it.quantity <= 1}
                  className="grid h-8 w-8 place-items-center rounded-lg text-lg font-bold text-ink-600 hover:bg-ink-100 disabled:opacity-40">−</button>
                <span className="w-8 text-center font-bold">{it.quantity}</span>
                <button onClick={() => setQty(it.id, it.quantity + 1)} disabled={busyId === it.id || it.quantity >= 20}
                  className="grid h-8 w-8 place-items-center rounded-lg text-lg font-bold text-ink-600 hover:bg-ink-100 disabled:opacity-40">+</button>
              </div>
              <div className="w-20 text-right font-extrabold text-ink-900">{money(it.lineTotal)}</div>
            </div>
          ))}
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="card space-y-3 p-5">
            <h2 className="font-bold text-ink-900">Order summary</h2>
            <Row label="Subtotal" value={money(subtotal)} />
            <Row label="Delivery fee" value="Free" />
            <div className="border-t border-dashed border-ink-200 pt-3">
              <Row label="Total" value={money(subtotal + DELIVERY_FEE)} strong />
            </div>
            <button onClick={() => nav('/checkout')} className="btn-primary mt-2 w-full">Proceed to checkout →</button>
            <Link to="/" className="block text-center text-sm font-semibold text-ink-500 hover:text-brand-600">Add more items</Link>
          </div>
        </aside>
      </div>
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
