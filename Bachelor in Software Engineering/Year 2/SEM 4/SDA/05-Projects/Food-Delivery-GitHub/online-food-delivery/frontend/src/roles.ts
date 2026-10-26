import type { Role } from './types'

/** Where each role lands after login (SDD DT-M1-1 A1 "redirect home", per actor). */
export const homeFor = (role?: Role): string =>
  role === 'ADMIN' ? '/admin' : role === 'DRIVER' ? '/driver' : '/'

export const roleLabel = (role?: Role): string =>
  role === 'ADMIN' ? 'Admin' : role === 'DRIVER' ? 'Driver' : 'Customer'
