import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { cartApi } from '../api'
import { useAuth } from './AuthContext'

interface CartContextValue {
  count: number
  subtotal: number
  refresh: () => Promise<void>
}

const CartContext = createContext<CartContextValue>({ count: 0, subtotal: 0, refresh: async () => {} })
export const useCart = () => useContext(CartContext)

export function CartProvider({ children }: { children: ReactNode }) {
  const { isAuthed } = useAuth()
  const [count, setCount] = useState(0)
  const [subtotal, setSubtotal] = useState(0)

  const refresh = useCallback(async () => {
    if (!isAuthed) {
      setCount(0)
      setSubtotal(0)
      return
    }
    try {
      const c = await cartApi.get()
      setCount(c.items.reduce((s, i) => s + i.quantity, 0))
      setSubtotal(c.subtotal)
    } catch {
      /* ignore — badge just stays as-is */
    }
  }, [isAuthed])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return <CartContext.Provider value={{ count, subtotal, refresh }}>{children}</CartContext.Provider>
}
