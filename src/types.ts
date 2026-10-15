/** Tipe data yang dipertukarkan dengan Cloud Bridge Server. */

export interface AdminUser {
  id: string
  email: string
  displayName: string | null
  isAdmin: boolean
  createdAt?: string
}

/** Klien = pemakai aplikasi yang menyewa. */
export interface Client extends AdminUser {
  deviceCount: number
  activeDeviceCount: number
  lastDeviceSeenAt: string | null
}

/** PC yang terdaftar dan mengirim telemetri. */
export interface Device {
  id: string
  name: string
  clientId: string
  clientEmail: string | null
  clientName: string | null
  active: boolean
  lastSeenAt: string | null
  revokedAt: string | null
  createdAt: string
}

export interface Pagination {
  limit: number
  offset: number
  total: number
  hasMore: boolean
}

export interface Page<T> {
  data: T[]
  pagination: Pagination
}

export interface LoginResponse {
  token: string
  user: AdminUser
}

/** Hasil mendaftarkan PC: token hanya muncul sekali di sini. */
export interface CreatedDevice {
  device: Device
  token: string
}
