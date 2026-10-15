const TOKEN_KEY = 'cloudbridge.admin.token'

/**
 * Menyimpan JWT di localStorage.
 *
 * Catatan keamanan: localStorage dapat dibaca JavaScript, jadi rentan bila ada
 * XSS. Untuk dashboard internal (dipakai 1 orang, halaman sederhana tanpa
 * konten pihak ketiga) ini trade-off yang wajar. Kalau nanti dibuka untuk
 * banyak admin, pindahkan ke cookie HttpOnly.
 */
export const session = {
  load(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY)
    } catch {
      return null
    }
  },
  save(token: string): void {
    try {
      localStorage.setItem(TOKEN_KEY, token)
    } catch {
      /* mode privat: token tidak tersimpan, user harus login tiap kali */
    }
  },
  clear(): void {
    try {
      localStorage.removeItem(TOKEN_KEY)
    } catch {
      /* diabaikan */
    }
  },
}
