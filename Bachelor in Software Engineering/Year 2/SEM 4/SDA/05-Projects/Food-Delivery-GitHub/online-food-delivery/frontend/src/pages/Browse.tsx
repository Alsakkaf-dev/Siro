import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { parseError, restaurantApi } from '../api'
import type { Restaurant } from '../types'
import { EmptyState, Stars, cx } from '../components/ui'
import { useToast } from '../store/ToastContext'

const CUISINES = ['All', 'Malay', 'Japanese', 'Italian', 'Indian', 'American']
const RATINGS: { label: string; value: number }[] = [
  { label: 'Any rating', value: 0 },
  { label: '4.0+', value: 4 },
  { label: '4.5+', value: 4.5 },
]
const ART: Record<string, { e: string; g: string }> = {
  Malay: { e: '🍛', g: 'from-amber-400 to-orange-500' },
  Japanese: { e: '🍣', g: 'from-rose-400 to-pink-500' },
  Italian: { e: '🍕', g: 'from-red-400 to-rose-500' },
  Indian: { e: '🍲', g: 'from-yellow-400 to-amber-500' },
  American: { e: '🍔', g: 'from-orange-400 to-red-500' },
}
const art = (c: string) => ART[c] ?? { e: '🍴', g: 'from-brand-400 to-brand-600' }
const etaMin = (id: number) => 20 + ((id * 7) % 16) // deterministic delivery-time estimate (min)

export default function Browse() {
  const toast = useToast()
  const [loc, setLoc] = useState('')
  const [cuisine, setCuisine] = useState('All')
  const [minRating, setMinRating] = useState(0)
  const [list, setList] = useState<Restaurant[]>([])
  const [message, setMessage] = useState<string | undefined>()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const t = setTimeout(async () => {
      setLoading(true)
      try {
        const data = await restaurantApi.browse({
          loc: loc || undefined,
          cuisine: cuisine === 'All' ? undefined : cuisine,
          rating: minRating || undefined,
        })
        setList(data.results)
        setMessage(data.message)
      } catch (e) {
        toast('error', parseError(e).message)
      } finally {
        setLoading(false)
      }
    }, 250)
    return () => clearTimeout(t)
  }, [loc, cuisine, minRating, toast])

  return (
    <div className="animate-fade-up">
      <section className="card mb-6 overflow-hidden">
        <div className="bg-gradient-to-br from-brand-500 to-brand-700 p-6 text-white sm:p-8">
          <h1 className="text-2xl font-extrabold sm:text-3xl">Craving something delicious? 🍔</h1>
          <p className="mt-1 text-white/85">Discover great restaurants near you — then track every bite live.</p>
          <div className="mt-5 flex items-center gap-1 rounded-xl bg-white p-1.5 shadow-soft">
            <span className="pl-2 text-lg">📍</span>
            <input
              className="flex-1 bg-transparent px-2 py-2 text-ink-900 outline-none placeholder-ink-400"
              placeholder="Search a location — try “Kuala Lumpur”"
              value={loc}
              onChange={(e) => setLoc(e.target.value)}
            />
          </div>
        </div>
      </section>

      <div className="mb-5 flex flex-wrap items-center gap-2">
        {CUISINES.map((c) => (
          <button key={c} className={cuisine === c ? 'chip-on' : 'chip-off'} onClick={() => setCuisine(c)}>
            {c !== 'All' && art(c).e} {c}
          </button>
        ))}
        <span className="mx-1 h-6 w-px bg-ink-200" />
        {RATINGS.map((r) => (
          <button key={r.value} className={minRating === r.value ? 'chip-on' : 'chip-off'} onClick={() => setMinRating(r.value)}>
            {r.value > 0 && '★'} {r.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton h-60" />)}
        </div>
      ) : list.length === 0 ? (
        <EmptyState icon="🔍" title="No restaurants found" note={message ?? 'Try widening your search or clearing the filters.'} />
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((r) => (
            <Link
              key={r.id}
              to={`/restaurants/${r.id}`}
              className={cx('card group overflow-hidden transition hover:-translate-y-1 hover:shadow-glow', !r.isOpen && 'opacity-90')}
            >
              <div className={cx('relative flex h-28 items-center justify-center bg-gradient-to-br text-5xl', art(r.cuisine).g)}>
                <span className="drop-shadow">{art(r.cuisine).e}</span>
                <span className="absolute right-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-xs font-bold text-ink-800 shadow-sm">
                  <Stars rating={r.rating} />
                </span>
                {!r.isOpen && (
                  <span className="absolute left-3 top-3 rounded-full bg-ink-900/80 px-2.5 py-1 text-xs font-bold text-white">Closed</span>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-bold text-ink-900 group-hover:text-brand-600">{r.name}</h3>
                <p className="mt-0.5 text-sm text-ink-500">{r.cuisine} · {r.location}</p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="inline-flex items-center gap-2 text-xs font-bold">
                    <span className={r.isOpen ? 'text-emerald-600' : 'text-ink-400'}>{r.isOpen ? '● Open' : '○ Closed'}</span>
                    <span className="font-semibold text-ink-400">· 🕒 ~{etaMin(r.id)} min</span>
                  </span>
                  <span className="text-sm font-bold text-brand-600">View menu →</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
