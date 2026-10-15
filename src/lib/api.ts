import type {
  AdminUser,
  Client,
  CreatedDevice,
  Device,
  LoginResponse,
  Page,
} from '../types'

/**
 * Semua akses ke Cloud Bridge lewat sini.
 *
 * BASE kosong berarti memakai origin yang sama — saat development sudah
 * di-proxy oleh Vite (lihat vite.config.ts), saat produksi di-proxy nginx.
 * Jadi CORS tidak perlu diaktifkan di server.
 */
const BASE = import.meta.env.VITE_API_BASE ?? ''

export class ApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'DELETE'
  body?: unknown
  token?: string | null
  signal?: AbortSignal
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, token, signal } = options

  let response: Response
  try {
    response = await fetch(`${BASE}${path}`, {
      method,
      signal,
      headers: {
        ...(body ? { 'content-type': 'application/json' } : {}),
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new ApiError(
      'Tidak bisa menghubungi server. Pastikan Cloud Bridge berjalan.',
      0,
    )
  }

  const text = await response.text()
  let payload: unknown = null
  if (text) {
    try {
      payload = JSON.parse(text)
    } catch {
      payload = null
    }
  }

  if (!response.ok) {
    throw new ApiError(extractError(payload, response.status), response.status)
  }

  return payload as T
}

function extractError(payload: unknown, status: number): string {
  if (payload && typeof payload === 'object' && 'error' in payload) {
    return String((payload as { error: unknown }).error)
  }
  return `Permintaan gagal (HTTP ${status})`
}

export const api = {
  login(email: string, password: string) {
    return request<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body: { email, password },
    })
  },

  async me(token: string) {
    const result = await request<{ user: AdminUser }>('/api/me', { token })
    return result.user
  },

  listClients(token: string, search: string) {
    const query = new URLSearchParams({ limit: '100' })
    if (search.trim()) query.set('search', search.trim())
    return request<Page<Client>>(`/api/admin/clients?${query.toString()}`, { token })
  },

  createClient(
    token: string,
    body: { email: string; password: string; displayName?: string },
  ) {
    return request<{ client: Client }>('/api/admin/clients', {
      method: 'POST',
      body,
      token,
    })
  },

  listDevices(token: string, options: { clientId?: string; includeRevoked?: boolean } = {}) {
    const query = new URLSearchParams({ limit: '500' })
    if (options.clientId) query.set('clientId', options.clientId)
    if (options.includeRevoked) query.set('includeRevoked', 'true')
    return request<{ data: Device[] }>(`/api/admin/devices?${query.toString()}`, { token })
  },

  createDevice(token: string, body: { clientId: string; name: string }) {
    return request<CreatedDevice>('/api/admin/devices', {
      method: 'POST',
      body,
      token,
    })
  },

  revokeDevice(token: string, deviceId: string) {
    return request<void>(`/api/admin/devices/${deviceId}`, {
      method: 'DELETE',
      token,
    })
  },
}
