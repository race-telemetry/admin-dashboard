import { useState } from 'react'
import type { FormEvent } from 'react'
import { ApiError, api } from '../lib/api'
import type { AdminUser } from '../types'
import { Alert, Button, Card, Field, Input, Spinner } from './ui'

/**
 * Halaman masuk khusus pemilik/admin.
 *
 * Endpoint login-nya sama dengan aplikasi mobile; perbedaannya dashboard ini
 * menolak akun yang bukan admin.
 */
export function LoginView({
  onSignedIn,
}: {
  onSignedIn: (token: string, user: AdminUser) => void
}) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)

    try {
      const result = await api.login(email.trim(), password)
      if (!result.user.isAdmin) {
        setError(
          'Akun ini bukan admin. Minta pemilik aplikasi menandai akun Anda sebagai admin.',
        )
        return
      }
      onSignedIn(result.token, result.user)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Terjadi kesalahan tak terduga')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-full items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#19E3B1]/40 bg-[#19E3B1]/10">
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden="true">
              <path
                d="M4 21V4m0 0h11l-1.5 3L15 10H4"
                stroke="#19E3B1"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path d="M4 14h9l-1.5 3L13 20H4" fill="#19E3B1" fillOpacity="0.25" />
            </svg>
          </div>
          <p className="text-[11px] font-semibold tracking-[0.28em] text-[#19E3B1]">
            CLOUD BRIDGE
          </p>
          <h1 className="mt-1 text-2xl font-bold text-[#E9F0F7]">Dashboard Admin</h1>
          <p className="mt-2 text-sm text-[#93A3B5]">
            Kelola klien dan daftarkan PC mereka.
          </p>
        </div>

        <Card className="p-6">
          <form onSubmit={submit} className="space-y-4">
            <Field label="EMAIL ADMIN">
              <Input
                type="email"
                autoComplete="username"
                required
                value={email}
                disabled={busy}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="owner@domain.com"
              />
            </Field>

            <Field label="PASSWORD">
              <Input
                type="password"
                autoComplete="current-password"
                required
                value={password}
                disabled={busy}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
              />
            </Field>

            {error ? <Alert tone="bad">{error}</Alert> : null}

            <Button type="submit" variant="primary" disabled={busy} className="w-full">
              {busy ? <Spinner className="border-[#04120E]/40 border-t-[#04120E]" /> : null}
              MASUK
            </Button>
          </form>
        </Card>

        <p className="mt-5 text-center text-xs leading-relaxed text-[#5F6F80]">
          Akun admin dibuat lewat <span className="mono text-[#93A3B5]">BOOTSTRAP_ADMIN=1</span>{' '}
          di server. Dashboard ini menolak akun non-admin.
        </p>
      </div>
    </div>
  )
}
