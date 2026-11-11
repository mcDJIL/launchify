# Product Requirements Document (PRD)

**Project Name:** Sumopod Clone (Laravel API + React.js PaaS)
**Target:** Final Project (UAS) Pemrograman Framework
**Tech Stack:** React.js (Frontend), Laravel 11 (REST API), MySQL, Docker, Oracle Cloud VPS

## 1. Project Objective

Membangun platform *Platform as a Service* (PaaS) berarsitektur *headless* yang memungkinkan pengguna untuk men-deploy aplikasi (via Docker) langsung dari GitHub ke server VPS. Sistem dilengkapi dengan penagihan *Pay-As-You-Go* menggunakan saldo *wallet* prabayar (top-up via QRIS Manual). Proyek ini ditujukan untuk memenuhi dan melampaui syarat kelulusan UAS (Aplikasi Baru, >5 Tabel, Transaksi Kompleks).

## 2. Core Features

### A. User Facing (Developer) - React Frontend

1. **Authentication:** Login, Register, Logout (mengamankan token via Laravel Sanctum).
2. **Dashboard:** Menampilkan sisa saldo *wallet*, jumlah *deployment* aktif, dan metrik sistem.
3. **Deployment Engine:**
   * Input URL *repository* (GitHub) dan port aplikasi Docker.
   * Tombol *Deploy* yang memicu pemanggilan API ke backend untuk membuat *container* di VPS.
   * Aksi manajemen: Start, Stop, dan Restart *container*.
4. **Billing & Top-Up (Pay-As-You-Go):**
   * Sistem dompet digital (*wallet*).
   * Form pengajuan Top-Up dengan nominal dinamis + kode unik (misal: Rp 50.063).
   * Unggah bukti transfer QRIS.
   * Riwayat mutasi saldo (Ledger).

### B. Admin Facing (Dosen / Evaluator Demo) - React Frontend

1. **Top-Up Approval:** Halaman untuk melihat bukti transfer masuk dan tombol "Verifikasi" yang memicu API transaksi *database* kompleks di Laravel.
2. **System Monitor:** Melihat seluruh *container* yang berjalan di server.

## 3. Database Schema (6 Tabel Utama di MySQL)

Sistem ini menggunakan 6 tabel berelasi untuk memenuhi syarat minimal 5 tabel:

1. **`users`**: `id`, `name`, `email`, `password`, `wallet_balance`, `role` (admin/user).
2. **`plans`**: `id`, `name` (Free, Pro), `ram_limit`, `cpu_limit`, `price_per_hour`.
3. **`projects`**: `id`, `user_id`, `name`, `github_url`, `port`, `status` (running, stopped, suspended).
4. **`deployments`**: (Tabel Log Transaksi) `id`, `project_id`, `action` (build, start, stop), `status`, `log_output`.
5. **`topup_transactions`**: (Tabel Transaksi Uang) `id`, `user_id`, `amount`, `unique_code`, `total_amount`, `proof_image`, `status` (pending, approved, rejected).
6. **`billing_ledgers`**: (Tabel Transaksi Mutasi) `id`, `user_id`, `amount`, `type` (debit/credit), `description`.

## 4. "Complex Transactions" Justification (Untuk Rubrik Penilaian UAS)

Sistem ini tidak hanya melakukan CRUD sederhana, melainkan melibatkan logika transaksi terintegrasi:

1. **Approval Top-Up (API):** Menggunakan `DB::transaction()` di Laravel Controller untuk memastikan saat admin mengirim request `approved`, saldo `wallet_balance` *user* bertambah, dan tercatat di `billing_ledgers`. Jika salah satu kueri gagal, otomatis di-*rollback* untuk mencegah in-konsistensi data finansial.
2. **Auto-Billing (Cron Job):** Laravel Task Scheduler berjalan setiap jam, mencari proyek yang `running`, memotong saldo *user*, dan mencatat ke *ledger*. Jika saldo habis, Laravel mengeksekusi perintah via SSH untuk men-*stop* container di VPS secara otomatis.

---

# Development Plan (Timeline Pengerjaan)

Asumsi pengerjaan dilakukan menjelang batas waktu demo di Minggu 12 - 15.

### Phase 1: Foundation & API Database (Fokus: CRUD & Relasi API)
*Target Selesai: 1 Minggu*
* [ ] Inisialisasi proyek Laravel baru (`laravel new api-paas-uas`).
* [ ] Konfigurasi koneksi MySQL dan instalasi Laravel Sanctum.
* [ ] Pembuatan Migration, Model, dan Factory untuk 6 tabel utama (memastikan minimal >5 tabel terpenuhi).
* [ ] Pembuatan API Endpoint untuk Master Data (Tabel `plans`) dan Auth (`/api/login`, `/api/user`).

### Phase 2: React Frontend Initialization & Billing API (Fokus: Transaksi Uang)
*Target Selesai: 1 Minggu*
* [ ] Inisialisasi proyek React + Vite + Tailwind CSS.
* [ ] Membuat halaman Authentikasi dan layout Dashboard di React.
* [ ] Pembuatan API Endpoint Top-Up (Generate kode unik & upload bukti gambar).
* [ ] **CRITICAL:** Mengimplementasikan `DB::transaction()` di API Admin Approval.
* [ ] Menghubungkan halaman "Billing & Top-Up" di React dengan API Backend.

### Phase 3: Deployment Engine (Fokus: Integrasi VPS & Docker)
*Target Selesai: 1-2 Minggu*
* [ ] Setup koneksi SSH dari Laravel ke Oracle VPS menggunakan ekstensi PHP SSH2 atau `symfony/process`.
* [ ] Membuat API Endpoint Deployment yang menjalankan *command* Linux (`git clone`, `docker-compose up -d`).
* [ ] Menyiapkan halaman Deployments di React untuk mengirim URL GitHub ke API.
* [ ] Mencatat log *stdout/stderr* dari VPS ke dalam tabel `deployments`.

### Phase 4: Automation & Final Polish (Fokus: Persiapan Demo UAS)
*Target Selesai: Menjelang Minggu 12-15*
* [ ] Membuat Laravel Console Command (`php artisan paas:charge-users`) untuk memotong saldo user per jam.
* [ ] Mendaftarkan command tersebut ke fitur Task Scheduling Laravel agar dieksekusi berkala.
* [ ] Pengujian logika *Auto-Suspend*: Container mati otomatis via eksekusi Docker SSH jika saldo user 0.
* [ ] *Testing End-to-End* antara React UI dan Laravel API.