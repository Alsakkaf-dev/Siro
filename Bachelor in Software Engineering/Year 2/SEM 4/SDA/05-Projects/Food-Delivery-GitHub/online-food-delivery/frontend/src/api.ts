import axios, { AxiosError } from 'axios'
import type { Cart, DeliveryStatus, MenuItem, OrderSummary, Restaurant, User, ApiError } from './types'

export const TOKEN_KEY = 'ofd_token'

const rawApiBase = import.meta.env.VITE_API_URL || '/api'
const apiBase = rawApiBase.endsWith('/api') ? rawApiBase : `${rawApiBase}/api`
const api = axios.create({ baseURL: apiBase })

api.interceptors.request.use((cfg) => {
  const t = localStorage.getItem(TOKEN_KEY)
  if (t) cfg.headers.Authorization = `Bearer ${t}`
  return cfg
})

/** Pull a friendly message + code out of an Axios error. */
export function parseError(e: unknown): { code?: string; message: string; status?: number; offerRegistration?: boolean } {
  const ax = e as AxiosError<ApiError>
  const data = ax.response?.data
  return {
    code: data?.code,
    message: data?.message || ax.message || 'Something went wrong',
    status: ax.response?.status,
    offerRegistration: data?.offerRegistration,
  }
}

interface AuthResponse { token: string; user: User }

// ── M1: auth + browsing ──────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    api.post<AuthResponse>('/auth/login', { email, password }).then((r) => r.data),
  register: (dto: { name: string; email: string; password: string; phone?: string }) =>
    api.post<AuthResponse>('/auth/register', dto).then((r) => r.data),
}

export const restaurantApi = {
  browse: (params: { loc?: string; cuisine?: string; rating?: number }) =>
    api.get<{ results: Restaurant[]; message?: string }>('/restaurants', { params }).then((r) => r.data),
  menu: (id: number) => api.get<MenuItem[]>(`/restaurants/${id}/menu`).then((r) => r.data),
}

// ── M2: cart + checkout ──────────────────────────────────────────────────────
export const cartApi = {
  get: () => api.get<Cart>('/cart').then((r) => r.data),
  addItem: (menuItemId: number, quantity: number) =>
    api.post<Cart>('/cart/items', { menuItemId, quantity }).then((r) => r.data),
  updateItem: (id: number, quantity: number) =>
    api.patch<Cart>(`/cart/items/${id}`, { quantity }).then((r) => r.data),
}

export const orderApi = {
  checkout: (address: string) => api.post<OrderSummary>('/checkout', { address }).then((r) => r.data),
  get: (id: number) => api.get<OrderSummary>(`/orders/${id}`).then((r) => r.data),
}

// ── M3: payment + delivery tracking ─────────────────────────────────────────
export interface PaymentResponse {
  status?: string
  code?: string
  message?: string
  transactionId?: number
  gatewayRef?: string
}

export const paymentApi = {
  pay: (orderId: number, token: string, amount: number) =>
    api.post<PaymentResponse>('/payments', { orderId, token, amount }).then((r) => r.data),
}

export const deliveryApi = {
  track: (orderId: number) => api.get<DeliveryStatus>(`/deliveries/${orderId}`).then((r) => r.data),
  deliver: (orderId: number) => api.post<DeliveryStatus>(`/deliveries/${orderId}/deliver`).then((r) => r.data),
}

export default api
