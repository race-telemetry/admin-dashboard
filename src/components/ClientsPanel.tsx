import { useState } from 'react'
import type { FormEvent } from 'react'
import { ApiError, api } from '../lib/api'
import type { Client } from '../types'
import { Alert, Badge, Button, Card, EmptyState, Field, Input, SectionTitle, Spinner } from './ui'

/**
 * Panel klien: daftar pemakai aplikasi + tambah klien baru.
 *
 * Klien dibuat oleh admin karena skenario bisnisnya: pelanggan menyewa
 * aplikasi, bukan mendaftar sendiri.
 */
export function ClientsPanel({
  token,
  clients,
  loading,
  error,
  search,
  onSearch,
  selectedClientId,
  onSelectClient,
  onCreated,
  onUnauthorized,
}: {
  token: string
  clients: Client[]
  loading: boolean
  error: string | null
  search: string
  onSearch: (value: string) => void
  selectedClientId: string | undefined
  onSelectClient: (clientId: string | undefined) => void
  onCreated: () => void
  onUnauthorized: () => void
}) {
  const [showForm, setShowForm] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [busy, setBusy] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  async function submit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setFormError(null)

    try {
      await api.createClient(token, {
        email: email.trim(),
        password,
        ...(displayName.trim() ? { displayName: displayName.trim() } : {}),
      })
      setEmail('')
      setPassword('')
      setDisplayName('')
      setShowForm(false)
      onCreated()
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        onUnauthorized()
        return
      }
      setFormError(err instanceof ApiError ? err.message : 'Gagal membuat klien')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card className="flex h-full flex-col p-5">
      <SectionTitle
        title="KLIEN"
        subtitle={`${clients.length} ditampilkan`}
        action={
          <Button
            variant={showForm ? 'secondary' : 'primary'}
            className="!px-3 !py-2 text-xs"
            onClick={() => setShowForm((value) => !value)}
          >
            {showForm ? 'BATAL' : '+ KLIEN'}
          </Button>
        }
      />

      {showForm ? (
        <form onSubmit={submit} className="mt-4 space-y-3 rounded-xl border border-[#2A3746] bg-[#0A0E14] p-4">
          <Field label="EMAIL">
            <Input
              type="email"
              required
              value={email}
              disabled={busy}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="klien@email.com"
            />
          </Field>
          <Field label="PASSWORD AWAL" hint="Minimal 8 karakter. Berikan ke klien.">
            <Input
              type="text"
              required
              minLength={8}
              value={password}
              disabled={busy}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="rahasia123"
            />
          </Field>
          <Field label="NAMA (OPSIONAL)">
            <Input
              value={displayName}
              disabled={busy}
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder="Budi Santoso"
            />
          </Field>
          {formError ? <Alert tone="bad">{formError}</Alert> : null}
          <Button type="submit" variant="primary" disabled={busy} className="w-full !py-2 text-xs">
            {busy ? <Spinner className="border-[#04120E]/40 border-t-[#04120E]" /> : null}
            SIMPAN KLIEN
          </Button>
        </form>
      ) : null}

      <div className="mt-4">
        <Input
          value={search}
          onChange={(event) => onSearch(event.target.value)}
          placeholder="Cari email atau nama…"
        />
      </div>

      {error ? (
        <div className="mt-3">
          <Alert tone="bad">{error}</Alert>
        </div>
      ) : null}

      <div className="mt-3 -mr-2 flex-1 space-y-2 overflow-y-auto pr-2">
        {loading && clients.length === 0 ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : clients.length === 0 ? (
          <EmptyState
            title="Belum ada klien"
            message="Tambahkan klien pertama Anda dengan tombol + KLIEN."
          />
        ) : (
          clients.map((client) => {
            const selected = selectedClientId === client.id
            return (
              <button
                key={client.id}
                type="button"
                onClick={() => onSelectClient(selected ? undefined : client.id)}
                className={`w-full rounded-xl border px-3.5 py-3 text-left transition-colors ${
                  selected
                    ? 'border-[#19E3B1]/60 bg-[#19E3B1]/10'
                    : 'border-[#2A3746] bg-[#1D2733] hover:border-[#19E3B1]/30'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="truncate text-sm font-semibold text-[#E9F0F7]">
                    {client.displayName || client.email}
                  </span>
                  {client.isAdmin ? <Badge tone="warn">ADMIN</Badge> : null}
                </div>
                {client.displayName ? (
                  <p className="mt-0.5 truncate text-xs text-[#93A3B5]">{client.email}</p>
                ) : null}
                <div className="mt-2 flex items-center gap-2 text-[10px] text-[#5F6F80]">
                  <span className="mono">{client.deviceCount} PC</span>
                  <span>•</span>
                  <span className="mono">{client.activeDeviceCount} aktif</span>
                  {client.lastDeviceSeenAt ? (
                    <>
                      <span>•</span>
                      <span>terakhir {formatRelative(client.lastDeviceSeenAt)}</span>
                    </>
                  ) : null}
                </div>
              </button>
            )
          })
        )}
      </div>
    </Card>
  )
}

export function formatRelative(iso: string | null): string {
  if (!iso) return '—'
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return '—'

  const seconds = Math.round((Date.now() - then) / 1000)
  if (seconds < 60) return 'baru saja'
  if (seconds < 3600) return `${Math.round(seconds / 60)} menit lalu`
  if (seconds < 86400) return `${Math.round(seconds / 3600)} jam lalu`
  if (seconds < 2592000) return `${Math.round(seconds / 86400)} hari lalu`
  return new Date(iso).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}
