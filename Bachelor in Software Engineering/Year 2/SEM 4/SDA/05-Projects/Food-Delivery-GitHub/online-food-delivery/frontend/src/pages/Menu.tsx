import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { cartApi, parseError, restaurantApi } from '../api'
import type { MenuItem, Restaurant } from '../types'
import { PageLoader, Stars, cx, money } from '../components/ui'
import { useAuth } from '../store/AuthContext'
import { useCart } from '../store/CartContext'
import { useToast } from '../store/ToastContext'

const ART: Record<string, { e: string; g: string }> = {
  Malay: { e: '🍛', g: 'from-amber-400 to-orange-500' },
  Japanese: { e: '🍣', g: 'from-rose-400 to-pink-500' },
  Italian: { e: '🍕', g: 'from-red-400 to-rose-500' },
  Indian: { e: '🍲', g: 'from-yellow-400 to-amber-500' },
  American: { e: '🍔', g: 'from-orange-400 to-red-500' },
}
const art = (c?: string) => (c && ART[c]) || { e: '🍴', g: 'from-brand-400 to-brand-600' }

export default function Menu() {
  const { id } = useParams()
  const rid = Number(id)
  const nav = useNavigate()
  const { isAuthed } = useAuth()
  const { refresh } = useCart()
  const toast = useToast()

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [items, setItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState<number | null>(null)

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      try {
        const [browse, menu] = await Promise.all([restaurantApi.browse({}), restaurantApi.menu(rid)])
        setRestaurant(browse.results.find((r) => r.id === rid) ?? null)
        setItems(menu)
      } catch (e) {
        toast('error', parseError(e).message)
      } finally {
        setLoading(false)
      }
    })()
  }, [rid, toast])

  const closed = restaurant ? !restaurant.isOpen : false

  const add = async (item: MenuItem) => {
    if (!isAuthed) {
      nav('/login', { state: { from: `/restaurants/${rid}` } })
      return
    }
    setAdding(item.id)
    try {
      await cartApi.addItem(item.id, 1)
      await refresh()
      toast('success', `Added ${item.name} to cart 🛒`)
    } catch (e) {
      toast('error', parseError(e).message)
    } finally {
      setAdding(null)
    }
  }

  if (loading) return <PageLoader label="Loading menu…" />

  return (
    <div className="animate-fade-up">
      <Link to="/" className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-ink-500 hover:text-brand-600">← All restaurants</Link>

      <div className="card mb-6 overflow-hidden">
        <div className={cx('flex items-center gap-4 bg-gradient-to-br p-6 text-white', art(restaurant?.cuisine).g)}>
          <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-white/20 text-4xl backdrop-blur">{art(restaurant?.cuisine).e}</span>
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-extrabold">{restaurant?.name ?? 'Restaurant'}</h1>
            <p className="mt-0.5 text-white/85">{restaurant?.cuisine} · {restaurant?.location}</p>
            <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-white/95 px-2.5 py-1">
              <Stars rating={restaurant?.rating ?? 0} />
              <span className={cx('text-xs font-bold', closed ? 'text-ink-400' : 'text-emerald-600')}>
                {closed ? '○ Closed' : '● Open'}
              </span>
            </div>
          </div>
        </div>
        {closed && (
          <div className="bg-amber-50 px-6 py-3 text-sm font-semibold text-amber-700">
            🔒 This restaurant is currently closed — you can view the menu, but ordering is disabled.
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {items.map((it) => {
          const disabled = closed || !it.isAvailable
          return (
            <div key={it.id} className="card flex items-center justify-between gap-4 p-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-ink-900">{it.name}</h3>
                  {!it.isAvailable && <span className="rounded-full bg-ink-100 px-2 py-0.5 text-[11px] font-bold text-ink-500">Sold out</span>}
                </div>
                <p className="mt-0.5 line-clamp-2 text-sm text-ink-500">{it.description}</p>
                <p className="mt-2 font-extrabold text-brand-600">{money(it.price)}</p>
              </div>
              <button
                onClick={() => add(it)}
                disabled={disabled || adding === it.id}
                className={cx('btn shrink-0 px-4 py-2.5 text-sm', disabled ? 'cursor-not-allowed bg-ink-100 text-ink-400' : 'btn-primary')}
              >
                {adding === it.id ? '…' : disabled ? 'Unavailable' : '+ Add'}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
