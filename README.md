# JB COC — Sales Management Dashboard

Dashboard manajemen penjualan akun **Clash of Clans** untuk JB COC. Aplikasi ini mencatat
pembelian (modal) dan penjualan akun, menghitung keuntungan otomatis, menampilkan statistik &
grafik, serta menyimpan seluruh data langsung ke **Google Sheets** sebagai database.

Dibangun dengan **Next.js 16 (App Router, Turbopack)**, **React 19**, **TypeScript**,
**Tailwind CSS v4**, dan komponen **shadcn/ui (base-nova)**.

---

## Fitur

- **Autentikasi admin** — login satu akun dengan cookie sesi httpOnly bertanda tangan HMAC (masa berlaku 12 jam).
- **CRUD transaksi** — tambah, lihat detail, ubah, tandai terjual, dan hapus data akun.
- **Dashboard statistik** — total transaksi, akun terjual, belum laku, keuntungan, modal tertahan, dan lain-lain.
- **Grafik interaktif** (Recharts) — tren bulanan, distribusi Town Hall (TH), dan komposisi status.
- **Stok belum laku** — daftar akun yang masih tersedia beserta total modal tertahan.
- **Pencarian & filter** — cari deskripsi/TH/no penjualan, filter status, TH, dan bulan; sortir per kolom.
- **Laporan & export** — filter periode, ringkasan, pratinjau, lalu export ke **CSV** atau **Excel (.xlsx)**, plus cetak.
- **Pengaturan** — uji koneksi Google Sheets, sinkronisasi ID transaksi, info akun, dan logout.
- **UI dark gaming premium** — tema gelap, aksen violet, animasi halus, responsif (sidebar desktop + drawer mobile).

---

## Kebutuhan

- **Node.js 20+** (disarankan 22+)
- **Google Cloud service account** dengan akses ke Google Sheets (lihat bagian Konfigurasi)

---

## Memulai

```bash
# 1. Install dependensi
npm install

# 2. Salin template environment
copy .env.example .env.local    # Windows
# cp .env.example .env.local    # macOS / Linux

# 3. Isi nilai pada .env.local (lihat bagian Konfigurasi)

# 4. Jalankan server pengembangan
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000). Anda akan diarahkan ke halaman login.

Tersedia juga:

```bash
npm run build   # build produksi
npm run start   # jalankan hasil build
npm run lint    # jalankan ESLint
```

---

## Konfigurasi

Semua pengaturan disimpan pada `.env.local`.

```env
# --- Google Sheets (wajib) ---
GOOGLE_SHEET_ID=12vUoE2-WTInp6WLJKGEr0hKA2eS4P-FF
GOOGLE_SHEET_GID=286858408
GOOGLE_SERVICE_ACCOUNT_EMAIL=service-account@project-id.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# --- Admin Login (wajib) ---
ADMIN_EMAIL=admin@jbcoc.id
ADMIN_PASSWORD_HASH=$2b$10$...

# --- Session (wajib) ---
AUTH_SECRET=string-acak-panjang
```

### 1. Membuat Service Account Google

1. Buka [Google Cloud Console](https://console.cloud.google.com/) dan buat/pilih sebuah project.
2. Aktifkan **Google Sheets API** (menu *APIs & Services → Library*).
3. Buka *APIs & Services → Credentials → Create Credentials → Service account*.
4. Setelah dibuat, buka tab **Keys → Add key → Create new key → JSON**, lalu unduh file-nya.
5. Dari file JSON tersebut:
   - `client_email` → `GOOGLE_SERVICE_ACCOUNT_EMAIL`
   - `private_key` → `GOOGLE_PRIVATE_KEY` (pertahankan `\n` sebagai baris baru di dalam tanda kutip).

### 2. Memberi Akses ke Spreadsheet

1. Buka spreadsheet tujuan, klik **Share**.
2. Tempel alamat `client_email` service account dan beri akses **Editor**.
3. Ambil `GOOGLE_SHEET_ID` dari URL:
   `https://docs.google.com/spreadsheets/d/<GOOGLE_SHEET_ID>/edit`
4. Ambil `GOOGLE_SHEET_GID` dari bagian setelah `#gid=` pada URL tab yang dituju.

> Aplikasi menulis data per sel (batch update) sehingga kolom dan formula lama tidak tertimpa.
> Jika kolom **ID Transaksi** belum ada, aplikasi dapat membuatnya — gunakan tombol
> **Sinkronisasi ID** di halaman Pengaturan.

### Mode Baca Publik (tanpa kredensial)

Aplikasi otomatis mendeteksi ketersediaan kredensial:

- **Kredensial lengkap** → akses penuh (baca & tulis) melalui Google Sheets API v4.
- **Tanpa kredensial** → aplikasi membaca data secara **read-only** dari endpoint publik
  `gviz` (spreadsheet harus dibagikan ke *Anyone with the link*). Dashboard, statistik,
  dan laporan tetap tampil, tetapi tambah/edit/hapus dinonaktifkan sampai kredensial diisi.
- **Kredensial ada tapi tidak valid** → aplikasi otomatis memakai mode baca publik dan
  menampilkan peringatan di halaman Pengaturan.

> `GOOGLE_PRIVATE_KEY` **harus** berisi kolom `private_key` dari file JSON service account
> (dimulai dengan `-----BEGIN PRIVATE KEY-----`), **bukan** `private_key_id`.

### 3. Mengatur Password Admin

Hash password dibuat dengan bcrypt. Jalankan:

```bash
node -e "console.log(require('bcryptjs').hashSync('PASSWORD_ANDA', 10))"
```


> **Penting:** tanda `$` pada hash bcrypt harus di-escape dengan backslash (`\$`),
> mis. `ADMIN_PASSWORD_HASH=\$2b\$10\$...`, karena Next.js melakukan ekspansi
> variabel (`$VAR`) pada file `.env`. Tanpa escape, hash akan terpotong dan login gagal.

> **Wajib diganti** sebelum dipakai sungguhan. Jangan pernah commit `.env.local`.

### 4. Membuat AUTH_SECRET

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

---

## Struktur Data Google Sheets

Baris pertama dianggap header. Kolom yang dikenali:

| Kolom | Keterangan |
| --- | --- |
| No Penjualan | Nomor urut penjualan |
| TH | Town Hall akun (mis. TH12) |
| Deskripsi | Deskripsi akun |
| Tanggal Beli | Tanggal pembelian |
| Tanggal Jual | Tanggal penjualan (kosong = belum laku) |
| Bulan | Keterangan bulan |
| Harga Modal | Harga beli (Rp) |
| Harga Jual | Harga jual (Rp) |
| Keuntungan | Harga Jual − Harga Modal |
| ID Transaksi | UUID unik per baris (dibuat otomatis bila belum ada) |

Status transaksi ditentukan otomatis: **Terjual** jika *Harga Jual* terisi, selain itu **Belum Laku**.

---

## Struktur Proyek

```
src/
├─ app/
│  ├─ (dashboard)/        # Halaman terproteksi: dashboard, transactions, stock, reports, settings
│  ├─ api/                # Route handlers: auth, transactions, stats, sheets/test
│  ├─ login/              # Halaman login
│  ├─ layout.tsx          # Root layout (tema, font, provider)
│  └─ page.tsx            # Redirect ke /dashboard
├─ components/
│  ├─ ui/                 # Komponen shadcn/ui (base-nova)
│  ├─ transactions/       # Tabel, form, dialog, sheet detail
│  ├─ dashboard/          # Dashboard & grafik
│  ├─ reports/            # Laporan & export
│  ├─ settings/           # Pengaturan & koneksi
│  └─ ...                 # app-shell, nav, kartu statistik, dll.
├─ hooks/                 # use-api-data, use-session, use-mounted
├─ lib/                   # sheets, session, auth, stats, schemas, format, export, dll.
└─ proxy.ts               # Proteksi rute (pengganti middleware, Node runtime)
```

---

## Keamanan

- Sesi disimpan pada cookie **httpOnly** yang ditandatangani HMAC-SHA256; tidak ada token di `localStorage`.
- Setiap route API CRUD memverifikasi sesi sebelum memproses permintaan.
- Kredensial Google hanya dipakai di sisi server dan tidak pernah dikirim ke browser.
- **Jangan commit `.env.local`** atau file JSON service account.

---

## Lisensi

Proyek internal JB COC.
