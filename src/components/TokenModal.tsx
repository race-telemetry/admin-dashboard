import { useState } from 'react'
import { Alert, Button, Modal } from './ui'
/**
 * Menampilkan device token SETELAH dibuat.
 *
 * Token tidak bisa dilihat lagi setelah modal ini ditutup (server hanya
 * menyimpan hash-nya), jadi langkah pemasangan ditulis jelas di sini agar
 * admin bisa langsung mengirimkannya ke klien.
 */
export function TokenModal({
  open,
  token,
  deviceName,
  clientEmail,
  serverHint,
  onClose,
}: {
  open: boolean
  token: string
  deviceName: string
  clientEmail: string | null
  serverHint: string
  onClose: () => void
}) {
  const [copied, setCopied] = useState<'token' | 'full' | null>(null)

  const instructions = [
    `Buka PC Bridge di komputer klien`,
    `Tab "Server" → Alamat: ${serverHint}`,
    `Token: tempelkan nilai di atas`,
    `Klik "Simpan pengaturan"`,
  ].join('\n')

  async function copy(value: string, kind: 'token' | 'full') {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(kind)
      window.setTimeout(() => setCopied(null), 1800)
    } catch {
      setCopied(null)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Device token dibuat">
      <div className="space-y-4">
      <Alert tone="warn">
        Token ini <strong>hanya ditampilkan sekali</strong>. Simpan atau kirimkan
        sekarang — setelah jendela ini ditutup, server tidak bisa menampilkannya lagi.
      </Alert>

      <div>
        <p className="mb-1.5 text-[11px] font-semibold tracking-[0.12em] text-[#93A3B5]">
          PC
        </p>
        <p className="text-sm text-[#E9F0F7]">
          {deviceName}
          {clientEmail ? <span className="text-[#93A3B5]"> — {clientEmail}</span> : null}
        </p>
      </div>

      <div>
        <p className="mb-1.5 text-[11px] font-semibold tracking-[0.12em] text-[#93A3B5]">
          DEVICE TOKEN
        </p>
        <div className="flex items-stretch gap-2">
          <code className="mono flex-1 overflow-x-auto rounded-xl border border-[#19E3B1]/40 bg-[#0A0E14] px-3.5 py-3 text-sm break-all text-[#19E3B1]">
            {token}
          </code>
        </div>
        <div className="mt-2 flex gap-2">
          <Button
            variant="primary"
            onClick={() => copy(token, 'token')}
            className="flex-1 !py-2 text-xs"
          >
            {copied === 'token' ? '✓ TERSALIN' : 'SALIN TOKEN'}
          </Button>
          <Button
            variant="secondary"
            onClick={() =>
              copy(`Petunjuk pemasangan PC Bridge:\n${instructions}\n\nToken:\n${token}`, 'full')
            }
            className="flex-1 !py-2 text-xs"
          >
            {copied === 'full' ? '✓ TERSALIN' : 'SALIN SEMUA PETUNJUK'}
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-[#2A3746] bg-[#0A0E14] p-3.5">
        <p className="mb-2 text-[11px] font-semibold tracking-[0.12em] text-[#93A3B5]">
          LANGKAH UNTUK KLIEN
        </p>
        <ol className="space-y-1.5 text-xs text-[#93A3B5]">
          {instructions.split('\n').map((line, index) => (
            <li key={line} className="flex gap-2">
              <span className="mono text-[#5F6F80]">{index + 1}.</span>
              <span>{line}</span>
            </li>
          ))}
        </ol>
      </div>

      <Button variant="secondary" onClick={onClose} className="w-full">
        SAYA SUDAH SIMPAN
      </Button>
      </div>
    </Modal>
  )
}
