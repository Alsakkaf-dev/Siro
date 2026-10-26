import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../store/AuthContext'
import { useCart } from '../store/CartContext'
import { homeFor, roleLabel } from '../roles'
import { cx } from './ui'

function Logo({ to }: { to: string }) {
  return (
    <Link to={to} className="flex items-center gap-2.5">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 text-lg shadow-glow">🍜</span>
      <span className="text-lg font-extrabold tracking-tight text-ink-900">Food<span className="text-brand-600">Hub</span></span>
    </Link>
  )
}

const ROLE_STYLE: Record<string, string> = {
  Customer: 'bg-brand-50 text-brand-700 ring-brand-200',
  Admin: 'bg-ink-900 text-white ring-ink-700',
  Driver: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
}

export default function Navbar() {
  const { user, isAuthed, logout } = useAuth()
  const { count } = useCart()
  const nav = useNavigate()
  const isCustomer = !user || user.role === 'CUSTOMER'
  const label = roleLabel(user?.role)

  return (
    <header className="sticky top-0 z-40 border-b border-ink-100 bg-white/75 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Logo to={homeFor(user?.role)} />

        {isAuthed ? (
          <nav className="flex items-center gap-2 sm:gap-3">
            <span className={cx('hidden rounded-full px-2.5 py-1 text-xs font-bold ring-1 sm:inline-block', ROLE_STYLE[label])}>{label}</span>

            {isCustomer && (
              <Link
                to="/cart"
                className="relative grid h-10 w-10 place-items-center rounded-xl border border-ink-200 bg-white text-lg hover:border-brand-400"
                aria-label="Cart"
              >
                🛒
                {count > 0 && (
                  <span className="absolute -right-1.5 -top-1.5 grid h-5 min-w-[1.25rem] place-items-center rounded-full bg-brand-600 px-1 text-[11px] font-bold text-white ring-2 ring-white">
                    {count}
                  </span>
                )}
              </Link>
            )}

            <div className="flex items-center gap-2 rounded-xl border border-ink-200 bg-white py-1 pl-1 pr-1.5">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-100 text-sm font-bold text-brand-700">
                {(user?.name ?? '?').charAt(0).toUpperCase()}
              </span>
              <span className="hidden text-sm font-semibold text-ink-700 sm:block">{user?.name?.split(' ')[0]}</span>
              <button
                onClick={() => { logout(); nav('/login') }}
                className="rounded-lg px-2 py-1.5 text-sm font-semibold text-ink-400 hover:bg-rose-50 hover:text-rose-600"
                title="Log out"
              >
                ⎋
              </button>
            </div>
          </nav>
        ) : (
          <Link to="/login" className="btn-primary px-4 py-2 text-sm">Sign in</Link>
        )}
      </div>
    </header>
  )
}
