import { useState } from 'react'
import type { FormEvent } from 'react'
import { ApiError, api } from '../lib/api'
import type { Client, CreatedDevice, Device } from '../types'
import { formatRelative } from './ClientsPanel'
import { Alert, Badge, Button, Card, EmptyState, Field, Input, SectionTitle, Spinner } from './ui'

/**
 * Panel PC: daftarkan PC klien lalu generate device token.
 *
 * Inilah inti skenario bisnis — setiap klien yang menyewa perlu didaftarkan
 * PC-nya terlebih dahulu agar bisa mengirim telemetri.
 */
export function DevicesPanel({
  token,
  clients,
  devices,
  loading,
  error,
  selectedClientId,
  onSelectClient,
  includeRevoked,
  onToggleRevoked,
  onCreated,
  onRevoked,
  onUnauthorized,
}: {
  token: string
  clients: Client[]
  devices: Device[]
  loading: boolean
  error: string | null
  selectedClientId: string | undefined
  onSelectClient: (clientId: string | undefined) => void
  includeRevoked: boolean
  onToggleRevoked: (value: boolean) => void
  onCreated: (created: CreatedDevice) => void
  onRevoked: () => void
  onUnauthorized: () => void
}) {
  const [clientId, setClientId] = useState('')
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [revokingId, setRevokingId] = useState<string | null>(null)

  const effectiveClientId = clientId || selectedClientId || ''

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!effectiveClientId) {
      setFormError('Pilih klien terlebih dahulu')
      return
    }

    setBusy(true)
    setFormError(null)

    try {
      const created = await api.createDevice(token, {
        clientId: effectiveClientId,
        name: name.trim(),
      })
      setName('')
      onCreated(created)
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        onUnauthorized()
        return
      }
      setFormError(err instanceof ApiError ? err.message : 'Gagal mendaftarkan PC')
    } finally {
      setBusy(false)
    }
  }

  async function revoke(device: Device) {
    const confirmed = window.confirm(
      `Cabut akses "${device.name}"?\n\nPC itu tidak akan bisa mengirim telemetri lagi. ` +
        'Riwayat balapan yang sudah tersimpan tetap aman.',
    )
    if (!confirmed) return

    setRevokingId(device.id)
    try {
      await api.revokeDevice(token, device.id)
      onRevoked()
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        onUnauthorized()
        return
      }
      setFormError(err instanceof ApiError ? err.message : 'Gagal mencabut PC')
    } finally {
      setRevokingId(null)
    }
  }

  return (
    <Card className="flex h-full flex-col p-5">
      <SectionTitle
        title="PC TERDAFTAR"
        subtitle={`${devices.length} ditampilkan${includeRevoked ? ' (termasuk dicabut)' : ''}`}
        action={
          <label className="flex cursor-pointer items-center gap-2 text-[11px] text-[#93A3B5]">
            <input
              type="checkbox"
              checked={includeRevoked}
              onChange={(event) => onToggleRevoked(event.target.checked)}
              className="h-3.5 w-3.5 accent-[#19E3B1]"
            />
            tampilkan dicabut
          </label>
        }
      />

      <form
        onSubmit={submit}
        className="mt-4 space-y-3 rounded-xl border border-[#19E3B1]/25 bg-[#0A0E14] p-4"
      >
        <p className="text-[11px] font-semibold tracking-[0.12em] text-[#19E3B1]">
          DAFTARKAN PC BARU
        </p>

        <Field label="KLIEN">
          <select
            value={effectiveClientId}
            disabled={busy}
            onChange={(event) => {
              setClientId(event.target.value)
              onSelectClient(event.target.value || undefined)
            }}
            className="w-full rounded-xl border border-[#2A3746] bg-[#1D2733] px-3.5 py-2.5 text-sm text-[#E9F0F7] outline-none focus:border-[#19E3B1] disabled:opacity-60"
          >
            <option value="">— pilih klien —</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.displayName ? `${client.displayName} (${client.email})` : client.email}
              </option>
            ))}
          </select>
        </Field>

        <Field label="NAMA PC" hint="Contoh: PC-RIG-BUDI, LAPTOP-01">
          <Input
            required
            maxLength={80}
            value={name}
            disabled={busy}
            onChange={(event) => setName(event.target.value)}
            placeholder="PC-RIG-01"
          />
        </Field>

        {formError ? <Alert tone="bad">{formError}</Alert> : null}

        <Button type="submit" variant="primary" disabled={busy} className="w-full !py-2 text-xs">
          {busy ? <Spinner className="border-[#04120E]/40 border-t-[#04120E]" /> : null}
          GENERATE TOKEN
        </Button>
      </form>

      {error ? (
        <div className="mt-3">
          <Alert tone="bad">{error}</Alert>
        </div>
      ) : null}

      <div className="mt-4 -mr-2 flex-1 space-y-2 overflow-y-auto pr-2">
        {loading && devices.length === 0 ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : devices.length === 0 ? (
          <EmptyState
            title="Belum ada PC terdaftar"
            message="Pilih klien, isi nama PC, lalu tekan Generate Token."
          />
        ) : (
          devices.map((device) => (
            <div
              key={device.id}
              className="rounded-xl border border-[#2A3746] bg-[#1D2733] px-3.5 py-3"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="mono truncate text-sm font-semibold text-[#E9F0F7]">
                  {device.name}
                </span>
                {device.active ? (
                  <Badge tone="good">AKTIF</Badge>
                ) : (
                  <Badge tone="bad">DICABUT</Badge>
                )}
              </div>

              <p className="mt-1 truncate text-xs text-[#93A3B5]">
                {device.clientName ? `${device.clientName} — ` : ''}
                {device.clientEmail ?? 'klien tidak dikenal'}
              </p>

              <div className="mt-2 flex items-center justify-between gap-3">
                <span className="text-[10px] text-[#5F6F80]">
                  dibuat {formatRelative(device.createdAt)} • aktif{' '}
                  {formatRelative(device.lastSeenAt)}
                </span>
                {device.active ? (
                  <Button
                    variant="danger"
                    className="!px-2.5 !py-1.5 text-[11px]"
                    disabled={revokingId === device.id}
                    onClick={() => revoke(device)}
                  >
                    {revokingId === device.id ? <Spinner /> : null}
                    CABUT
                  </Button>
                ) : null}
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  )
}
