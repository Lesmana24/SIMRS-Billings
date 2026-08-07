# SIMRS Billing Frontend Application 🏥💻

Aplikasi Antarmuka Web untuk **Sistem Informasi Manajemen Rumah Sakit (SIMRS) - Modul Billing & Transaksi Keuangan Medis**. Built using **React 19**, **Vite**, **Tailwind CSS**, **Lucide Icons**, and **ImageKit**.

---

## 📋 Daftar Isi

- [Fitur Utama](#-fitur-utama)
- [Teknologi & Libs](#-teknologi--libs)
- [Struktur Proyek](#-struktur-proyek)
- [Manajemen Hak Akses (RBAC)](#-manajemen-hak-akses-rbac)
- [Panduan Instalasi & Memulai](#-panduan-instalasi--memulai)
- [Daftar Halaman & Modul UI](#-daftar-halaman--modul-ui)
- [Integrasi API Backend](#-integrasi-api-backend)

---

## 🚀 Fitur Utama

1. **Modern Glassmorphism UI**: Tampilan antarmuka berkelas tinggi (_high-aesthetic glassmorphism_) dengan dukungan Mode Gelap (Dark Mode) dan animasi mikro yang responsif.
2. **Terbitkan Tagihan Medis SIMRS**:
   - Pemilihan akun pasien terdaftar dengan **Prioritas Auto-fill Nama Lengkap (`full_name`) -> Username**.
   - Pemilihan tindakan/tarif medis dengan pengaturan kuantitas item per tindakan.
   - Kalkulasi otomatis Total Bruto, Klaim Penjamin/Asuransi, dan Beban Netto Pasien.
   - Cetak **Struk Rincian Pembayaran Medis Resmi** siap print.
3. **Manajemen Klaim Penjamin Terpisah**:
   - Navigasi **Tab Terpisah** untuk 🛡️ **Klaim BPJS Kesehatan (V-Claim)** dan 🏢 **Klaim Asuransi Swasta** (AXA Mandiri, Prudential, Allianz, Manulife, FWD, dll.).
   - Pelacakan status klaim secara real-time (`UNCLAIMED`, `SUBMITTED`, `VERIFIED`, `PAID`, `DISPUTED`).
   - Kartu KPI ringkasan piutang klaim yang dinamis sesuai Tab penjamin yang aktif.
4. **Otorisasi Kasir & Keamanan 2FA PIN**:
   - Pembayaran fleksibel (CASH, Bank Transfer, dan Split Payment).
   - Otorisasi pembayaran kasir dilindungi dengan verifikasi **PIN 2-Factor Authentication (2FA)**.
5. **Portal Mandiri Pasien (_Patient Portal_)**:
   - Pasien dapat melihat riwayat tagihan medis pribadi, beban netto, rincian tindakan, serta mengunggah bukti transfer bank.
6. **Laporan & Analytics Keuangan**:
   - Dashboard analitik interaktif dengan chart visualisasi pendapatan, rasio klaim penjamin vs pasien, dan aktivitas transaksi bulanan.
7. **Jurnal Mutasi Kas & Audit Trail System**:
   - Log mutasi pembayaran idempoten dan audit log aktivitas pengguna secara transparan.

---

## 🛠️ Teknologi & Libs

- **Framework**: React 19 + Vite 6
- **Styling**: Tailwind CSS + Vanilla CSS Variables (Glassmorphism design tokens)
- **Iconography**: [Lucide React](https://lucide.dev/)
- **Media Upload**: ImageKit API integration (Bukti Transfer Bank)
- **State Management & Auth**: React Context API (`AuthContext`) + LocalStorage persistence

---

## 📂 Struktur Proyek

```text
frontend/
├── public/                  # Asset publik (logo, favicon)
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Navbar.jsx   # Topbar navigasi & indikator status akun
│   │   │   └── Sidebar.jsx  # Menu navigasi samping berdasarkan Role (RBAC)
│   │   └── ui/
│   │       ├── Badge.jsx    # Component status badge (PAID, PENDING, DLL)
│   │       ├── Modal.jsx    # Reusable Glass Modal container
│   │       ├── Pagination.jsx # Navigasi halaman data
│   │       ├── ReceiptModal.jsx # Cetak Struk Rincian Billing
│   │       ├── Toast.jsx    # Floating notification toast
│   │       └── TwoFactorModal.jsx # Modal verifikasi PIN 2FA Kasir
│   ├── context/
│   │   └── AuthContext.jsx  # State Management User Session & JWT Token
│   ├── pages/
│   │   ├── AnalyticsDashboard.jsx # Laporan & Analytics Grafik Keuangan
│   │   ├── AuditLogPage.jsx       # Log Aktivitas & Trail System
│   │   ├── BillingsPage.jsx       # Transaksi Medical Billing & Kasir
│   │   ├── ClaimsPage.jsx         # Manajemen Klaim BPJS & Asuransi Swasta
│   │   ├── Dashboard.jsx          # Dashboard Overview Ringkasan SIMRS
│   │   ├── LedgersPage.jsx        # Jurnal Mutasi Kas Pembayaran
│   │   ├── Login.jsx              # Halaman Masuk Akun
│   │   ├── MyBillingsPage.jsx     # Tagihan Layanan Saya (Portal Pasien)
│   │   ├── ProfilePage.jsx        # Pengaturan Profil & Ganti PIN 2FA
│   │   ├── Register.jsx           # Pendaftaran Akun Pasien Baru
│   │   ├── TarifsPage.jsx         # Master Data Tarif Layanan Medis
│   │   └── UsersPage.jsx          # Manajemen Pengguna SIMRS (Admin Only)
│   ├── services/
│   │   └── api.js                 # Service API Fetcher (Centralized Backend REST Client)
│   ├── App.jsx                    # Routing & Main Layout Container
│   ├── main.jsx                   # React Entrypoint Mount Point
│   └── index.css                  # Core Styling, CSS Variables & Design System Tokens
├── package.json
└── vite.config.js
```

---

## 🔐 Manajemen Hak Akses (RBAC)

Aplikasi menyesuaikan tampilan navigasi Sidebar dan izin aksi sesuai role pengguna:

| Role Pengguna              | Akses Modul                                                                                                                |
| :------------------------- | :------------------------------------------------------------------------------------------------------------------------- |
| **Admin**                  | Memiliki akses penuh ke seluruh modul termasuk **Manajemen Pengguna**, Master Tarif, Billings, Klaim, Ledger, & Audit Log. |
| **Staff / Dokter / Kasir** | Mengelola Transaksi Billing, Otorisasi Pembayaran 2FA, Manajemen Klaim BPJS/Swasta, Master Tarif, & Audit Log.             |
| **Pasien**                 | Mengakses **Portal Pasien (Tagihan Saya)** untuk melacak tagihan pribadi, melihat struk rincian, dan upload bukti bayar.   |

---

## ⚡ Panduan Instalasi & Memulai

### 1. Prasyarat System

- Node.js versi 18+ atau 20+
- NPM atau Yarn

### 2. Install Dependensi

Buka terminal di dalam folder `frontend/`:

```bash
npm install
```

### 3. Jalankan Mode Development

```bash
npm run dev
```

Aplikasi akan berjalan di `http://localhost:5173`.

### 4. Build untuk Production

```bash
npm run build
```

Hasil kompilasi file statis akan berada di folder `dist/`.

---

## 🖥️ Daftar Halaman & Modul UI

1. **Dashboard Overview (`/`)**: Menampilkan statistik ringkasan total tagihan, piutang klaim, dan transaksi terbaru.
2. **Transaksi Medical Billing (`/billings`)**: Form penerbitan tagihan pasien, otorisasi bayar 2FA kasir, cetak struk.
3. **Manajemen Klaim Penjamin (`/claims`)**: Tab terpisah untuk **BPJS Kesehatan (V-Claim)** & **Asuransi Swasta** beserta update status klaim.
4. **Master Tarif Layanan (`/tarifs`)**: Manajemen daftar harga tindakan medis dan tarif rumah sakit.
5. **Portal Pasien (`/my-billings`)**: Riwayat tagihan medis pribadi milik pasien yang sedang login.
6. **Laporan & Analytics (`/analytics`)**: Dashboard grafik performa keuangan dan klaim penjamin.
7. **Jurnal Mutasi Kas (`/ledgers`)**: Rekap mutasi kas masuk hasil otorisasi pembayaran.
8. **Audit Trail System (`/audit-logs`)**: Log jejak audit keamanan seluruh aktivitas di SIMRS.

---

## 🔗 Integrasi API Backend

Seluruh komunikasi HTTP ke Backend REST API terpusat di `src/services/api.js`:

- Target Default Base URL: `http://localhost:8080/api/v1`
- Header `Authorization: Bearer <JWT>` disisipkan secara otomatis dari `localStorage`.
- Dukungan header `X-Idempotency-Key` untuk mencegah duplikasi pembayaran kasir.
