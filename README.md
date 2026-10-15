# Cloud Bridge — Dashboard Admin

Aplikasi web untuk **pemilik aplikasi** (admin): mendaftarkan klien dan
men-generate device token untuk PC mereka.

Skenario bisnisnya: klien menyewa layanan → Anda mendaftarkan PC-nya di sini →
token diberikan ke klien untuk dimasukkan ke PC Bridge. Tanpa langkah ini, PC
klien tidak bisa mengirim telemetri.

```
Anda (admin)                 Klien
   │                            │
   ├─ buat akun klien ─────────▶ (email + password awal)
   ├─ daftarkan PC  ───────────▶ device token ──▶ dipasang di PC Bridge
   │                            │
   └─ (opsional) cabut akses ──▶ token langsung mati
```

## Fitur

Sengaja dibatasi hanya untuk hal di atas — tidak ada data balapan, tidak ada
grafik.

| Fitur | Keterangan |
|---|---|
| **Login admin** | Memakai endpoint yang sama dengan aplikasi mobile, tapi **menolak akun non-admin** |
| **Daftar klien** | Pencarian email/nama, jumlah PC + PC aktif, kapan terakhir PC mengirim data |
| **Tambah klien** | Email + password awal + nama (opsional) |
| **Daftarkan PC** | Pilih klien → isi nama PC → **GENERATE TOKEN** |
| **Token sekali tampil** | Modal menampilkan token + tombol salin + langkah pemasangan untuk klien |
| **Cabut PC** | Token langsung tidak berlaku; riwayat balapan yang sudah ada tetap aman |
| **Ringkasan** | Jumlah klien, PC aktif, PC online dalam 5 menit terakhir |

## Prasyarat

Cloud Bridge Server harus dijalankan dengan penanda admin:

```bash
cd cloud-bridge

REPO=memory \
  BOOTSTRAP_USER_EMAIL=owner@domain.com \
  BOOTSTRAP_USER_PASSWORD=rahasia123 \
  BOOTSTRAP_ADMIN=1 \
  BOOTSTRAP_DEVICE_NAME=PC-OWNER \
  JWT_SECRET=rahasia-panjang \
  node src/index.js
```

`BOOTSTRAP_ADMIN=1` menandai user bootstrap sebagai admin. Bila user-nya sudah
ada, ia otomatis dinaikkan menjadi admin (tidak perlu hapus database).

> `BOOTSTRAP_DEVICE_NAME=PC-OWNER` opsional — kalau Anda tidak ingin PC sendiri
> ikut terdaftar, biarkan saja nama apa pun; hanya muncul sebagai satu baris di
> daftar PC.

## Menjalankan

```bash
cd admin-dashboard
npm install
npm run dev          # http://127.0.0.1:5173
```

Masuk dengan akun `BOOTSTRAP_USER_EMAIL` / `BOOTSTRAP_USER_PASSWORD`.

Saat development, Vite mem-proxy `/api` ke `http://127.0.0.1:8080`
(lihat `vite.config.ts`). Karena browser bicara ke **origin yang sama**, CORS
tidak perlu diaktifkan di server.

Uji hasil build produksi:

```bash
npm run build
npm run preview      # http://127.0.0.1:4173
```

## Cara pakai (alur kerja)

1. **Masuk** dengan akun admin.
2. Panel kiri → **+ KLIEN** → isi email & password awal klien → **SIMPAN KLIEN**.
   Kirimkan email/password itu ke klien (dipakai di aplikasi mobile mereka).
3. Panel kanan → pilih klien → isi **NAMA PC** (mis. `PC-RIG-BUDI`) →
   **GENERATE TOKEN**.
4. Modal menampilkan token + tombol **SALIN SEMUA PETUNJUK**.
   Token **tidak bisa dilihat lagi** setelah modal ditutup.
5. Klien menempelkan token itu di PC Bridge → tab **Server** → lalu
   **Simpan pengaturan**.
6. Verifikasi: kolom "aktif" di daftar PC akan berubah begitu PC mengirim data
   pertama kali.

Untuk mencabut akses sebuah PC (mis. klien berhenti berlangganan) → tombol
**CABUT**. PC itu tidak bisa mengirim data lagi, tetapi balapan yang sudah
tersimpan tetap ada.

## Deployment

Bangun, lalu sajikan `dist/` lewat nginx **pada origin yang sama** dengan API
sehingga tidak perlu CORS:

```bash
cd admin-dashboard && npm ci && npm run build      # hasil di dist/
sudo cp -r dist /var/www/admin-dashboard
```

```nginx
server {
    listen 443 ssl;
    server_name admin.domain.com;
    root /var/www/admin-dashboard;
    index index.html;

    # aplikasi ini SPA: semua jalur diarahkan ke index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API di-proxy ke Cloud Bridge -> satu origin, tanpa CORS
    location /api/ {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

> **Kalau dashboard ditaruh di domain BERBEDA** dari API: set `VITE_API_BASE`
> saat build (`VITE_API_BASE=https://bridge.domain.com npm run build`) **dan**
> aktifkan CORS di server. Saat ini server belum mengirim header CORS, jadi
> jalur satu-origin di atas yang disarankan.

## Endpoint server yang dipakai

| Method | Path | Fungsi |
|---|---|---|
| `POST` | `/api/auth/login` | login (dipakai juga oleh mobile) |
| `GET` | `/api/me` | memastikan akun admin |
| `GET` | `/api/admin/clients` | daftar klien (`?search=`) |
| `POST` | `/api/admin/clients` | buat klien |
| `GET` | `/api/admin/devices` | daftar PC (`?clientId=&includeRevoked=`) |
| `POST` | `/api/admin/devices` | daftarkan PC → **token** |
| `DELETE` | `/api/admin/devices/:id` | cabut akses PC |

Semua endpoint `/api/admin/*` menolak non-admin dengan **403**.

## Keamanan

| Aspek | Keadaan |
|---|---|
| Pembatasan admin | Di server (`is_admin`), bukan hanya di UI. Non-admin ditolak 403 |
| Penyimpanan token | Hash sha256 di database; token asli tidak bisa dilihat lagi |
| JWT di browser | `localStorage`. Cukup untuk dashboard internal 1 orang, **tetapi rentan XSS**. Bila dibuka untuk banyak admin, pindahkan ke cookie HttpOnly |
| Percabutan | Per PC, tidak memengaruhi PC lain atau data yang sudah tersimpan |
| Transport | TLS di nginx (wajib) |

Tidak ada fitur "lupa password" maupun ubah password di UI — kalau klien lupa
password, buat ulang akun atau ubah lewat database. Di luar scope saat ini.

## Struktur kode

```
src/
├── main.tsx                    # entry React
├── App.tsx                     # gerbang: booting -> login / bukan admin / dashboard
├── index.css                   # Tailwind + palet gelap (sama dengan app mobile)
├── types.ts                    # tipe data dari server
├── lib/
│   ├── api.ts                  # fetch + ApiError, satu tempat untuk semua endpoint
│   └── session.ts              # simpan/baca JWT
└── components/
    ├── ui.tsx                  # tombol, input, kartu, badge, modal, spinner
    ├── LoginView.tsx           # masuk sebagai admin
    ├── DashboardView.tsx       # ambil data + susun panel
    ├── ClientsPanel.tsx        # daftar & tambah klien
    ├── DevicesPanel.tsx        # daftarkan PC + cabut
    └── TokenModal.tsx          # tampilkan token sekali + petunjuk
```

Pemisahannya: `lib/api.ts` satu-satunya tempat yang tahu bentuk HTTP,
`components/*` hanya tahu props. Jadi mengganti penyimpanan/API tidak menyentuh UI.

## Pengujian yang sudah dijalankan

| Uji | Hasil |
|---|---|
| `npm run build` (tsc + vite + Tailwind) | ✅ lolos, CSS 18,5 kB / JS 243 kB (75 kB gzip) |
| Kirim token hasil dashboard ke PC | ✅ PC tersambung, sesi tercatat, 1 lap tersimpan |
| Isolasi data | ✅ Admin melihat 0 balapan; klien melihat 1 balapan miliknya |
| Cabut PC | ✅ token langsung ditolak (kode 4401) |
| Render UI | ✅ login, ringkasan, panel klien, panel PC, badge AKTIF/DICABUT |

Belum ada: uji otomatis di sisi web (belum ada test runner untuk UI), dan belum
diuji dengan PostgreSQL (verifikasi memakai mode `REPO=memory`).

## Catatan teknis

- **Vite dipatok ke IPv4** (`host: '127.0.0.1'`). Di Windows, `localhost` sering
  mengikat hanya ke `::1` sehingga `127.0.0.1` ditolak
  (`net::ERR_CONNECTION_REFUSED`) — jangan hapus pengaturan itu.
- **Tidak ada react-router**: aplikasi hanya punya 1 halaman, jadi perpindahan
  tampilan cukup memakai state. Menambah router hanya menambah beban.
