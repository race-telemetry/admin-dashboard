import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react'
import { useEffect } from 'react'

export function Card({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={`rounded-2xl border border-[#2A3746] bg-[#141B24] shadow-[0_1px_0_0_rgba(255,255,255,0.02)_inset] ${className}`}
    >
      {children}
    </div>
  )
}

export function SectionTitle({
  title,
  subtitle,
  action,
}: {
  title: string
  subtitle?: string
  action?: ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h2 className="text-[11px] font-semibold tracking-[0.14em] text-[#93A3B5]">
          {title}
        </h2>
        {subtitle ? <p className="mt-1 text-xs text-[#5F6F80]">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  )
}

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost'

const buttonStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-[#19E3B1] text-[#04120E] hover:bg-[#22f0bd] disabled:bg-[#19E3B1]/40 disabled:text-[#04120E]/60',
  secondary:
    'bg-[#1D2733] text-[#E9F0F7] border border-[#2A3746] hover:bg-[#243040] disabled:opacity-50',
  danger:
    'bg-transparent text-[#EF4444] border border-[#EF4444]/40 hover:bg-[#EF4444]/10 disabled:opacity-50',
  ghost: 'bg-transparent text-[#93A3B5] hover:text-[#E9F0F7] disabled:opacity-50',
}

export function Button({
  variant = 'secondary',
  className = '',
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed ${buttonStyles[variant]} ${className}`}
    >
      {children}
    </button>
  )
}

export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string
  hint?: string
  error?: string | null
  children: ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-semibold tracking-[0.12em] text-[#93A3B5]">
        {label}
      </span>
      {children}
      {error ? (
        <span className="mt-1 block text-xs text-[#EF4444]">{error}</span>
      ) : hint ? (
        <span className="mt-1 block text-xs text-[#5F6F80]">{hint}</span>
      ) : null}
    </label>
  )
}

export function Input({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-xl border border-[#2A3746] bg-[#1D2733] px-3.5 py-2.5 text-sm text-[#E9F0F7] outline-none transition-colors placeholder:text-[#5F6F80] focus:border-[#19E3B1] focus:ring-2 focus:ring-[#19E3B1]/20 disabled:opacity-60 ${className}`}
    />
  )
}

type Tone = 'neutral' | 'good' | 'warn' | 'bad'

const badgeStyles: Record<Tone, string> = {
  neutral: 'bg-[#1D2733] text-[#93A3B5] border-[#2A3746]',
  good: 'bg-[#19E3B1]/10 text-[#19E3B1] border-[#19E3B1]/40',
  warn: 'bg-[#FACC15]/10 text-[#FACC15] border-[#FACC15]/40',
  bad: 'bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/40',
}

export function Badge({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold tracking-wider uppercase ${badgeStyles[tone]}`}
    >
      {children}
    </span>
  )
}

export function Spinner({ className = '' }: { className?: string }) {
  return (
    <span
      className={`inline-block h-4 w-4 animate-spin rounded-full border-2 border-[#2A3746] border-t-[#19E3B1] ${className}`}
      role="status"
      aria-label="memuat"
    />
  )
}

export function Alert({
  tone = 'bad',
  children,
}: {
  tone?: Tone
  children: ReactNode
}) {
  const styles: Record<Tone, string> = {
    neutral: 'border-[#2A3746] bg-[#1D2733] text-[#93A3B5]',
    good: 'border-[#19E3B1]/40 bg-[#19E3B1]/10 text-[#19E3B1]',
    warn: 'border-[#FACC15]/40 bg-[#FACC15]/10 text-[#FACC15]',
    bad: 'border-[#EF4444]/40 bg-[#EF4444]/10 text-[#EF4444]',
  }
  return (
    <div className={`rounded-xl border px-3.5 py-2.5 text-sm ${styles[tone]}`}>{children}</div>
  )
}

export function EmptyState({ title, message }: { title: string; message?: string }) {
  return (
    <div className="rounded-xl border border-dashed border-[#2A3746] px-4 py-8 text-center">
      <p className="text-sm font-semibold text-[#93A3B5]">{title}</p>
      {message ? <p className="mt-1 text-xs text-[#5F6F80]">{message}</p> : null}
    </div>
  )
}

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-lg"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-[#2A3746] px-5 py-4">
            <h3 className="text-sm font-semibold text-[#E9F0F7]">{title}</h3>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-2 py-1 text-[#93A3B5] transition-colors hover:bg-[#1D2733] hover:text-[#E9F0F7]"
              aria-label="tutup"
            >
              ✕
            </button>
          </div>
          <div className="px-5 py-5">{children}</div>
        </Card>
      </div>
    </div>
  )
}
