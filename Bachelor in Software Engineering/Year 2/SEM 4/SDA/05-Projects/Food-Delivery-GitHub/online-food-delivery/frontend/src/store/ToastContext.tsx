import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'

type ToastType = 'success' | 'error' | 'info'
interface Toast { id: number; type: ToastType; msg: string }

const ToastContext = createContext<(type: ToastType, msg: string) => void>(() => {})
export const useToast = () => useContext(ToastContext)

const ICON: Record<ToastType, string> = { success: '✓', error: '✕', info: 'i' }
const RING: Record<ToastType, string> = {
  success: 'ring-emerald-200 text-emerald-600',
  error: 'ring-rose-200 text-rose-600',
  info: 'ring-brand-200 text-brand-600',
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const push = useCallback((type: ToastType, msg: string) => {
    const id = Date.now() + Math.random()
    setToasts((t) => [...t, { id, type, msg }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3800)
  }, [])

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="fixed bottom-5 right-5 z-[60] flex flex-col gap-2.5">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="card flex items-center gap-3 px-4 py-3 pr-5 animate-scale-in max-w-sm"
            role="status"
          >
            <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white ring-2 font-bold ${RING[t.type]}`}>
              {ICON[t.type]}
            </span>
            <p className="text-sm font-medium text-ink-800">{t.msg}</p>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
