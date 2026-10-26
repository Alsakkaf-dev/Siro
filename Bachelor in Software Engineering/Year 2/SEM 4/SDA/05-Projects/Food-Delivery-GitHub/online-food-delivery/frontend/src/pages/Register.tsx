import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../store/AuthContext'
import { useCart } from '../store/CartContext'
import { useToast } from '../store/ToastContext'
import { parseError } from '../api'
import { Spinner } from '../components/ui'

export default function Register() {
  const { register } = useAuth()
  const { refresh } = useCart()
  const toast = useToast()
  const nav = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [busy, setBusy] = useState(false)

  const weak = password.length > 0 && password.length < 8

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    try {
      const u = await register({ name, email, password, phone })
      await refresh()
      toast('success', `Account created — welcome, ${u.name.split(' ')[0]}! 🎉`)
      nav('/', { replace: true })
    } catch (err) {
      toast('error', parseError(err).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid min-h-screen place-items-center px-4 py-10">
      <div className="w-full max-w-md animate-fade-up">
        <div className="mb-6 text-center">
          <span className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 text-3xl shadow-glow">
            🍜
          </span>
          <h1 className="text-2xl font-extrabold tracking-tight text-ink-900">Create your account</h1>
          <p className="mt-1 text-sm text-ink-500">Join FoodHub in a few seconds.</p>
        </div>

        <form onSubmit={submit} className="card space-y-4 p-6">
          <div>
            <label className="label">Full name</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" required />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" required />
          </div>
          <div>
            <label className="label">Password</label>
            <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" required />
            {weak && <p className="mt-1.5 text-xs font-medium text-rose-600">Password must be at least 8 characters.</p>}
          </div>
          <div>
            <label className="label">Phone <span className="font-normal text-ink-400">(optional)</span></label>
            <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="01X-XXX XXXX" />
          </div>

          <button className="btn-primary w-full" disabled={busy || weak}>
            {busy ? <Spinner light /> : 'Create account'}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-ink-500">
          Already have an account? <Link to="/login" className="font-bold text-brand-600 hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
