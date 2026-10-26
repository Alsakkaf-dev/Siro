import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../store/AuthContext'
import { useToast } from '../store/ToastContext'

export default function DriverConsole() {
  const { user } = useAuth()
  const toast = useToast()
  const nav = useNavigate()
  const [orderId, setOrderId] = useState('')

  const open = (e: FormEvent) => {
    e.preventDefault()
    const n = Number(orderId)
    if (!n || n <= 0) { toast('error', 'Enter a valid order number'); return }
    nav(`/track/${n}`)
  }

  return (
    <div className="mx-auto max-w-2xl animate-fade-up">
      <div className="mb-6">
        <span className="rounded-full bg-ink-900 px-3 py-1 text-xs font-bold text-white">DRIVER CONSOLE</span>
        <h1 className="mt-3 text-2xl font-extrabold text-ink-900">On the road, {user?.name?.split(' ')[0]} 🛵</h1>
        <p className="text-sm text-ink-500">Fulfil active deliveries · your GPS updates automatically.</p>
      </div>

      <div className="card mb-4 flex items-center gap-4 p-5">
        <span className="grid h-16 w-16 place-items-center rounded-2xl bg-brand-50 text-4xl">🛵</span>
        <div className="flex-1">
          <p className="text-lg font-extrabold text-ink-900">{user?.name}</p>
          <p className="text-sm text-ink-500">Motorbike · FoodHub rider</p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200">
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" /> On duty
        </span>
      </div>

      <div className="card mb-4 space-y-2 p-5">
        <h2 className="font-bold text-ink-900">How it works</h2>
        <ul className="space-y-1.5 text-sm text-ink-600">
          <li>• Deliveries are <b>auto-assigned</b> to you the moment a customer pays.</li>
          <li>• Your live location is <b>pushed every 10 seconds</b> over WebSocket to the customer.</li>
          <li>• Open an active order below to view its route and mark it delivered.</li>
        </ul>
      </div>

      <form onSubmit={open} className="card space-y-3 p-5">
        <h2 className="font-bold text-ink-900">Manage a delivery</h2>
        <div className="flex gap-2">
          <input
            className="input"
            inputMode="numeric"
            placeholder="Order number (e.g. 1)"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value.replace(/[^0-9]/g, ''))}
          />
          <button className="btn-primary shrink-0 px-5">Open delivery →</button>
        </div>
        <p className="text-xs text-ink-400">Tip: this opens the live tracking map where you can update and complete the delivery.</p>
      </form>
    </div>
  )
}
