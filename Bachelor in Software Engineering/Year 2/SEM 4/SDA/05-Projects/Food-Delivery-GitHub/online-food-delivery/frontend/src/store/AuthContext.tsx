import { createContext, useContext, useState, type ReactNode } from 'react'
import type { User } from '../types'
import { authApi, TOKEN_KEY } from '../api'

const USER_KEY = 'ofd_user'

interface AuthContextValue {
  user: User | null
  isAuthed: boolean
  login: (email: string, password: string) => Promise<User>
  register: (dto: { name: string; email: string; password: string; phone?: string }) => Promise<User>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue>(null as unknown as AuthContextValue)
export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? (JSON.parse(raw) as User) : null
  })

  const persist = (token: string, u: User) => {
    localStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem(USER_KEY, JSON.stringify(u))
    setUser(u)
  }

  const login = async (email: string, password: string) => {
    const r = await authApi.login(email, password)
    persist(r.token, r.user)
    return r.user
  }

  const register = async (dto: { name: string; email: string; password: string; phone?: string }) => {
    const r = await authApi.register(dto)
    persist(r.token, r.user)
    return r.user
  }

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, isAuthed: !!user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
