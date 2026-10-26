import { useEffect, useMemo, useState } from 'react'
import { parseError, restaurantApi } from '../api'
import type { Restaurant } from '../types'
import { PageLoader, Stars, cx } from '../components/ui'
import { useAuth } from '../store/AuthContext'
import { useToast } from '../store/ToastContext'

function Stat({ label, value, tone = 'brand' }: { label: string; value: string | number; tone?: 'brand' | 'emerald' | 'ink' }) {
  const tones = { brand: 'from-brand-500 to-brand-600', emerald: 'from-emerald-500 to-emerald-600', ink: 'from-ink-600 to-ink-800' }
  return (
    <div className="card p-5">
      <p className="text-xs font-bold uppercase tracking-wide text-ink-400">{label}</p>
      <p className={cx('mt-1 bg-gradient-to-br bg-clip-text text-3xl font-extrabold text-transparent', tones[tone])}>{value}</p>
    </div>
  )
}

export default function AdminConsole() {
  const { user } = useAuth()
  const toast = useToast()
  const [list, setList] = useState<Restaurant[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      try {
        setList((await restaurantApi.browse({})).results)
      } catch (e) {
        toast('error', parseError(e).message)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const stats = useMemo(() => {
    const open = list.filter((r) => r.isOpen).length
    const cuisines = new Set(list.map((r) => r.cuisine)).size
    const avg = list.length ? list.reduce((s, r) => s + Number(r.rating), 0) / list.length : 0
    return { total: list.length, open, closed: list.length - open, cuisines, avg: avg.toFixed(1) }
  }, [list])

  if (loading) return <PageLoader label="Loading admin console…" />

  return (
    <div className="animate-fade-up">
      <div className="mb-6">
        <span className="rounded-full bg-ink-900 px-3 py-1 text-xs font-bold text-white">ADMIN CONSOLE</span>
        <h1 className="mt-3 text-2xl font-extrabold text-ink-900">Welcome, {user?.name?.split(' ')[0]} 👋</h1>
        <p className="text-sm text-ink-500">Manage restaurant listings and the delivery fleet · monitor analytics.</p>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Restaurants" value={stats.total} />
        <Stat label="Open now" value={stats.open} tone="emerald" />
        <Stat label="Cuisines" value={stats.cuisines} tone="ink" />
        <Stat label="Avg rating" value={`★ ${stats.avg}`} />
      </div>

      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4">
          <h2 className="font-bold text-ink-900">Restaurant listings</h2>
          <span className="text-xs font-semibold text-ink-400">{stats.open} open · {stats.closed} closed</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-ink-50 text-xs uppercase tracking-wide text-ink-400">
              <tr>
                <th className="px-5 py-3 font-bold">Restaurant</th>
                <th className="px-5 py-3 font-bold">Cuisine</th>
                <th className="px-5 py-3 font-bold">Location</th>
                <th className="px-5 py-3 font-bold">Rating</th>
                <th className="px-5 py-3 font-bold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {list.map((r) => (
                <tr key={r.id} className="hover:bg-ink-50">
                  <td className="px-5 py-3 font-bold text-ink-900">{r.name}</td>
                  <td className="px-5 py-3 text-ink-600">{r.cuisine}</td>
                  <td className="px-5 py-3 text-ink-600">{r.location}</td>
                  <td className="px-5 py-3"><Stars rating={r.rating} /></td>
                  <td className="px-5 py-3">
                    <span className={cx('rounded-full px-2.5 py-1 text-xs font-bold ring-1',
                      r.isOpen ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 'bg-ink-100 text-ink-500 ring-ink-200')}>
                      {r.isOpen ? '● Open' : '○ Closed'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="mt-4 text-center text-xs text-ink-400">
        Delivery fleet is auto-dispatched by the system after each payment (drivers update GPS live via WebSocket).
      </p>
    </div>
  )
}
