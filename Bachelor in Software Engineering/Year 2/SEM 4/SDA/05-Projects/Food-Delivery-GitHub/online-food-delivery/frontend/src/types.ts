export type Role = 'CUSTOMER' | 'ADMIN' | 'DRIVER'

export interface User {
  id: number
  name: string
  email: string
  role: Role
}

export interface Restaurant {
  id: number
  name: string
  cuisine: string
  rating: number
  location: string
  isOpen: boolean
}

export interface MenuItem {
  id: number
  name: string
  description: string
  price: number
  isAvailable: boolean
}

export interface CartItem {
  id: number
  menuItemId: number
  name: string
  quantity: number
  unitPrice: number
  lineTotal: number
}

export interface Cart {
  cartId: number
  status: string
  items: CartItem[]
  subtotal: number
}

export interface OrderSummary {
  orderId: number
  status: string
  totalAmount: number
  deliveryAddress: string
  cartId: number
}

export type DeliveryState = 'AWAITING_DRIVER' | 'TRACKING' | 'LAST_KNOWN' | 'DELIVERED'

export interface DeliveryStatus {
  orderId: number
  state: DeliveryState
  message: string
  driverId: number | null
  driverName: string | null
  driverPhone: string | null
  driverVehicle: string | null
  lat: number | null
  lng: number | null
  eta: string | null
}

/** Shape of the API error body our backend returns ({code,message} or {message}). */
export interface ApiError {
  code?: string
  message?: string
  offerRegistration?: boolean
}
