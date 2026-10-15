import { useCallback, useEffect, useMemo, useState } from 'react'
import { ApiError, api } from '../lib/api'
import type { AdminUser, Client, CreatedDevice, Device } from '../types'
import { ClientsPanel } from './ClientsPanel'
import { DevicesPanel } from './DevicesPanel'
import { TokenModal } from './TokenModal'
import { Alert, Button, Card } from './ui'

/** Halaman utama: kelola klien + daftarkan PC mereka. */
export function DashboardView({
  token,
  user,
  onSignOut,
  onUnauthorized,
}: {
  token: string
  user: AdminUser
  onSignOut: () => void
  onUnauthorized: () => void
}) {
  const [clients, setClients] = useState<Client[]>([])
  const [devices, setDevices] = useState<Device[]>([])
  const [loadingClients, setLoadingClients] = useState(true)
  const [loadingDevices, setLoadingDevices] = useState(true)
  const [clientsError, setClientsError] = useState<string | null>(null)
  const [devicesError, setDevicesError] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [selectedClientId, setSelectedClientId] = useState<string | undefined>(undefined)
  const [includeRevoked, setIncludeRevoked] = useState(false)
  const [created, setCreated] = useState<CreatedDevice | null>(null)

  const handleError = useCallback(
    (error: unknown, setter: (message: string | null) => void) => {
      if (error instanceof ApiError && error.status === 401) {
        onUnauthorized()
        return
      }
      setter(error instanceof ApiError ? error.message : 'Gagal memuat data')
    },
    [onUnauthorized],
  )

  const loadClients = useCallback(
    async (needle: string) => {
      setLoadingClients(true)
      try {
        const page = await api.listClients(token, needle)
        setClients(page.data)
        setClientsError(null)
      } catch (error) {
        handleError(error, setClientsError)
      } finally {
        setLoadingClients(false)
      }
    },
    [token, handleError],
  )

  const loadDevices = useCallback(async () => {
    setLoadingDevices(true)
    try {
      const result = await api.listDevices(token, {
        ...(selectedClientId ? { clientId: selectedClientId } : {}),
        includeRevoked,
      })
      setDevices(result.data)
      setDevicesError(null)
    } catch (error) {
      handleError(error, setDevicesError)
    } finally {
      setLoadingDevices(false)
    }
  }, [token, selectedClientId, includeRevoked, handleError])

  // Pencarian diberi jeda singkat agar tidak menembak server tiap ketikan.
  useEffect(() => {
    const timer = window.setTimeout(() => void loadClients(search), 300)
    return () => window.clearTimeout(timer)
  }, [search, loadClients])

  useEffect(() => {
    void loadDevices()
  }, [loadDevices])

  const summary = useMemo(() => {
    const activeDevices = devices.filter((device) => device.active).length
    const onlineNow = devices.filter(
      (device) =>
        device.active &&
        device.lastSeenAt &&
        Date.now() - new Date(device.lastSeenAt).getTime() < 5 * 60 * 1000,
    ).length
    return { clients: clients.length, activeDevices, onlineNow }
  }, [clients, devices])

  const serverHint = useMemo(() => {
    const origin = window.location.origin
    const host = origin.replace(/^https?:\/\//, '').replace(/:\d+$/, '')
    return origin.startsWith('https') ? `wss://${host}/ingest` : `ws://${host}/ingest`
  }, [])

  return (
    <div className="mx-auto flex min-h-full max-w-7xl flex-col gap-5 p-5 lg:p-7">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.28em] text-[#19E3B1]">
            CLOUD BRIDGE
          </p>
          <h1 className="mt-0.5 text-xl font-bold text-[#E9F0F7]">
            Kelola Klien &amp; PC
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs font-semibold text-[#E9F0F7]">
              {user.displayName || user.email}
            </p>
            <p className="text-[10px] tracking-wider text-[#5F6F80] uppercase">Admin</p>
          </div>
          <Button variant="secondary" className="!px-3 !py-2 text-xs" onClick={onSignOut}>
            KELUAR
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-3 gap-3">
        <SummaryTile label="KLIEN" value={summary.clients} />
        <SummaryTile label="PC AKTIF" value={summary.activeDevices} />
        <SummaryTile label="ONLINE 5 MENIT" value={summary.onlineNow} highlight />
      </div>

      <div className="grid flex-1 gap-5 lg:grid-cols-2">
        <ClientsPanel
          token={token}
          clients={clients}
          loading={loadingClients}
          error={clientsError}
          search={search}
          onSearch={setSearch}
          selectedClientId={selectedClientId}
          onSelectClient={setSelectedClientId}
          onCreated={() => void loadClients(search)}
          onUnauthorized={onUnauthorized}
        />

        <DevicesPanel
          token={token}
          clients={clients}
          devices={devices}
          loading={loadingDevices}
          error={devicesError}
          selectedClientId={selectedClientId}
          onSelectClient={setSelectedClientId}
          includeRevoked={includeRevoked}
          onToggleRevoked={setIncludeRevoked}
          onCreated={(newDevice) => {
            setCreated(newDevice)
            void loadDevices()
            void loadClients(search)
          }}
          onRevoked={() => {
            void loadDevices()
            void loadClients(search)
          }}
          onUnauthorized={onUnauthorized}
        />
      </div>

      {selectedClientId ? (
        <Alert tone="neutral">
          Menampilkan PC milik satu klien. Tekan klien yang sama untuk menampilkan semua.
        </Alert>
      ) : null}

      <TokenModal
        open={created !== null}
        token={created?.token ?? ''}
        deviceName={created?.device.name ?? ''}
        clientEmail={created?.device.clientEmail ?? null}
        serverHint={serverHint}
        onClose={() => setCreated(null)}
      />
    </div>
  )
}

function SummaryTile({
  label,
  value,
  highlight = false,
}: {
  label: string
  value: number
  highlight?: boolean
}) {
  return (
    <Card className="px-4 py-3.5">
      <p className="text-[10px] font-semibold tracking-[0.14em] text-[#93A3B5]">{label}</p>
      <p
        className={`mono mt-1 text-2xl font-bold ${highlight ? 'text-[#19E3B1]' : 'text-[#E9F0F7]'}`}
      >
        {value}
      </p>
    </Card>
  )
}
