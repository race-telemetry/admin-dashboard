import { useCallback, useEffect, useState } from 'react'
import { ApiError, api } from './lib/api'
import { session } from './lib/session'
import type { AdminUser } from './types'
import { DashboardView } from './components/DashboardView'
import { LoginView } from './components/LoginView'
import { Card, Spinner } from './components/ui'

type Phase = 'booting' | 'signed-out' | 'signed-in' | 'not-admin'

export default function App() {
  const [phase, setPhase] = useState<Phase>('booting')
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState<AdminUser | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  /** Cek token tersimpan sekali saat aplikasi dibuka. */
  useEffect(() => {
    const stored = session.load()
    if (!stored) {
      setPhase('signed-out')
      return
    }

    let cancelled = false
    ;(async () => {
      try {
        const me = await api.me(stored)
        if (cancelled) return
        if (!me.isAdmin) {
          session.clear()
          setPhase('not-admin')
          return
        }
        setToken(stored)
        setUser(me)
        setPhase('signed-in')
      } catch (error) {
        if (cancelled) return
        if (error instanceof ApiError && error.status === 401) {
          session.clear()
        } else if (!(error instanceof ApiError)) {
          setNotice('Tidak bisa menghubungi server.')
        }
        setPhase('signed-out')
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  const handleSignedIn = useCallback((newToken: string, newUser: AdminUser) => {
    session.save(newToken)
    setToken(newToken)
    setUser(newUser)
    setNotice(null)
    setPhase('signed-in')
  }, [])

  const handleSignOut = useCallback(() => {
    session.clear()
    setToken(null)
    setUser(null)
    setPhase('signed-out')
  }, [])

  const handleUnauthorized = useCallback(() => {
    session.clear()
    setToken(null)
    setUser(null)
    setNotice('Sesi berakhir. Silakan masuk kembali.')
    setPhase('signed-out')
  }, [])

  if (phase === 'booting') {
    return (
      <div className="flex min-h-full items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-[#93A3B5]">
          <Spinner />
          Memeriksa sesi…
        </div>
      </div>
    )
  }

  if (phase === 'not-admin') {
    return (
      <div className="flex min-h-full items-center justify-center p-6">
        <Card className="max-w-md p-6 text-center">
          <h1 className="text-lg font-bold text-[#E9F0F7]">Butuh akses admin</h1>
          <p className="mt-2 text-sm leading-relaxed text-[#93A3B5]">
            Akun ini terdaftar tetapi bukan admin. Hanya pemilik aplikasi yang boleh
            membuka dashboard ini.
          </p>
          <button
            type="button"
            onClick={handleSignOut}
            className="mt-5 w-full rounded-xl bg-[#19E3B1] px-4 py-2.5 text-sm font-semibold text-[#04120E]"
          >
            MASUK DENGAN AKUN LAIN
          </button>
        </Card>
      </div>
    )
  }

  if (phase === 'signed-in' && token && user) {
    return (
      <DashboardView
        token={token}
        user={user}
        onSignOut={handleSignOut}
        onUnauthorized={handleUnauthorized}
      />
    )
  }

  return (
    <>
      {notice ? (
        <div className="mx-auto mt-4 max-w-md rounded-xl border border-[#FACC15]/40 bg-[#FACC15]/10 px-4 py-2.5 text-center text-xs text-[#FACC15]">
          {notice}
        </div>
      ) : null}
      <LoginView onSignedIn={handleSignedIn} />
    </>
  )
}
