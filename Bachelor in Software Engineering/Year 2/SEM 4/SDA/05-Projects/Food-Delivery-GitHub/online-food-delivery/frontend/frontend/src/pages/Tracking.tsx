import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Client } from '@stomp/stompjs'
import { deliveryApi, parseError } from '../api'
import type { DeliveryStatus } from '../types'
import LiveMap from '../components/LiveMap'
import { PageLoader, Spinner, cx } from '../components/ui'
import { useToast } from '../store/ToastContext'

const START_LAT = 3.139
const SPAN = 0.02
const STEPS = ['Confirmed', 'Preparing', 'On the way', 'Delivered']

function stepIndex(state?: string): number {
  if (state === 'DELIVERED') return 3
  if (state === 'TRACKING' || state === 'LAST_KNOWN') return 2
  return 1 // AWAITING_DRIVER → confirmed + preparing
}

export default function Tracking() {
  const { orderId } = useParams()
  const oid = Number(orderId)
  const toast = useToast()

  const [status, setStatus] = useState<DeliveryStatus | null>(null)
  const [lat, setLat] = useState<number | null>(null)
  const [live, setLive] = useState(false)
  const [loading, setLoading] = useState(true)
  const [delivering, setDelivering] = useState(false)
  const [rating, setRating] = useState(0)

  // Poll the tracking status (baseline — works even without WebSocket)
  useEffect(() => {
    let active = true
    const tick = async () => {
      try {
        const s = await deliveryApi.track(oid)
        if (!active) return
        setStatus(s)
        if (s.lat != null) setLat(s.lat)
      } catch {
        /* ignore transient errors */
      } finally {
        if (active) setLoading(false)
      }
    }
    void tick()
    const iv = setInterval(tick, 3000)
    return () => { active = false; clearInterval(iv) }
  }, [oid])

  // Live GPS over STOMP/WebSocket (bonus real-time push every 10s)
  useEffect(() => {
    const proto = location.protocol === 'https:' ? 'wss' : 'ws'
    const client = new Client({
      brokerURL: `${proto}://${location.host}/ws/tracking`,
      reconnectDelay: 5000,
      onConnect: () => {
        setLive(true)
        client.subscribe(`/topic/order/${oid}`, (msg) => {
          try {
            const ev = JSON.parse(msg.body) as { lat: number }
            if (ev.lat != null) setLat(ev.lat)
          } catch {
            /* ignore */
          }
        })
      },
      onWebSocketClose: () => setLive(false),
      onStompError: () => setLive(false),
    })
    client.activate()
    return () => { void client.deactivate() }
  }, [oid])

  const markDelivered = async () => {
    setDelivering(true)
    try {
      const s = await deliveryApi.deliver(oid)
      setStatus(s)
      toast('success', 'Order delivered — enjoy your meal! 🎉')
    } catch (e) {
      toast('error', parseError(e).message)
    } finally {
      setDelivering(false)
    }
  }

  if (loading) return <PageLoader label="Locating your order…" />

  const state = status?.state
  const delivered = state === 'DELIVERED'
  const awaiting = state === 'AWAITING_DRIVER'
  const progress = lat != null ? (lat - START_LAT) / SPAN : 0
  const current = stepIndex(state)

  return (
    <div className="animate-fade-up">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <Link to="/" className="text-sm font-semibold text-ink-500 hover:text-brand-600">← Home</Link>
          <h1 className="text-2xl font-extrabold text-ink-900">Track order #{oid}</h1>
        </div>
        <span className={cx('inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ring-1',
          live ? 'bg-emerald-50 text-emerald-600 ring-emerald-200' : 'bg-ink-100 text-ink-500 ring-ink-200')}>
          <span className={cx('h-2 w-2 rounded-full', live ? 'animate-pulse bg-emerald-500' : 'bg-ink-400')} />
          {live ? 'Live' : 'Reconnecting…'}
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-4">
          <LiveMap progress={progress} delivered={delivered} />
          <div className="card p-5">
            <p className="text-sm font-semibold text-ink-500">{status?.message}</p>
            <div className="mt-4 flex items-center justify-between">
              {STEPS.map((label, i) => (
                <div key={label} className="flex flex-1 flex-col items-center text-center">
                  <div className="flex w-full items-center">
                    <span className={cx('h-1 flex-1 rounded', i === 0 ? 'bg-transparent' : i <= current ? 'bg-brand-500' : 'bg-ink-200')} />
                    <span className={cx('grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-bold ring-2',
                      i <= current ? 'bg-brand-500 text-white ring-brand-200' : 'bg-white text-ink-400 ring-ink-200')}>
                      {i < current ? '✓' : i + 1}
                    </span>
                    <span className={cx('h-1 flex-1 rounded', i === STEPS.length - 1 ? 'bg-transparent' : i < current ? 'bg-brand-500' : 'bg-ink-200')} />
                  </div>
                  <span className={cx('mt-1.5 text-[11px] font-bold', i <= current ? 'text-ink-800' : 'text-ink-400')}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="card p-5">
            <h2 className="mb-3 font-bold text-ink-900">{awaiting ? 'Finding a rider…' : 'Your rider'}</h2>
            {awaiting ? (
              <div className="flex items-center gap-3 text-ink-500">
                <Spinner /> <span className="text-sm font-medium">Assigning the nearest driver</span>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-3xl">🛵</span>
                <div>
                  <p className="font-bold text-ink-900">{status?.driverName ?? `Rider #${status?.driverId}`}</p>
                  <p className="text-sm text-ink-500">{status?.driverVehicle ?? 'Motorbike'}</p>
                </div>
              </div>
            )}
            {!awaiting && status?.driverPhone && (
              <a href={`tel:${status.driverPhone}`} className="btn-outline mt-4 w-full py-2.5 text-sm">
                📞 Contact driver · {status.driverPhone}
              </a>
            )}
          </div>

          <div className="card p-5">
            <p className="text-xs font-bold uppercase tracking-wide text-ink-400">Estimated arrival</p>
            <p className="mt-1 text-3xl font-extrabold text-brand-600">{delivered ? 'Arrived' : (status?.eta ?? '—')}</p>
          </div>

          {delivered ? (
            <div className="card p-5 text-center">
              <div className="text-3xl">🎉</div>
              <p className="mt-1 font-bold text-ink-900">Delivered!</p>
              <p className="text-sm text-ink-500">Rate your driver</p>
              <div className="mt-2 flex justify-center gap-1 text-3xl">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    onClick={() => { setRating(n); toast('success', `Thanks for rating ${n}★!`) }}
                    className={cx('transition hover:scale-110', n <= rating ? 'text-amber-400' : 'text-ink-200')}
                    aria-label={`${n} stars`}
                  >
                    ★
                  </button>
                ))}
              </div>
              <Link to="/" className="btn-primary mt-4 w-full">Order again</Link>
            </div>
          ) : awaiting ? null : (
            <button onClick={markDelivered} className="btn-primary w-full" disabled={delivering}>
              {delivering ? <Spinner light /> : 'Mark as delivered'}
            </button>
          )}
        </aside>
      </div>
    </div>
  )
}
