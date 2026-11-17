export const ARTIKEL = [
  {
    slug: 'deploy-aplikasi-gratis-untuk-mahasiswa',
    title: 'Cara Deploy Aplikasi Gratis untuk Mahasiswa (2026)',
    description:
      'Panduan langkah demi langkah deploy aplikasi web gratis untuk mahasiswa: dari GitHub, tanpa kartu kredit, dan cara agar biaya server tetap nol saat tidak dipakai.',
    keywords: 'deploy aplikasi gratis, deploy murah mahasiswa, hosting gratis mahasiswa',
    date: '2026-11-10',
    updated: '2026-11-10',
    readingTime: 6,
    excerpt:
      'Tidak punya kartu kredit dan budget server? Ini alur paling realistis untuk membuat aplikasi kuliahmu live tanpa mengeluarkan uang.',
    blocks: [
      {
        type: 'p',
        text: 'Hampir semua mahasiswa informatika pernah berada di titik ini: aplikasi tugas akhir sudah jalan di laptop, tetapi dosen minta link yang bisa dibuka dari HP. Masalahnya, layanan cloud populer sering meminta kartu kredit, dan VPS bulanan terasa mahal untuk proyek yang cuma dipakai saat demo.',
      },
      {
        type: 'p',
        text: 'Kabar baiknya, ada beberapa cara deploy aplikasi gratis atau nyaris gratis untuk mahasiswa. Artikel ini membandingkan pilihannya dan menunjukkan alur yang paling praktis.',
      },
      { type: 'h2', text: '1. Manfaatkan free tier, tapi pahami batasnya' },
      {
        type: 'p',
        text: 'Layanan seperti Vercel, Netlify, dan Render punya kuota gratis. Cocok untuk frontend statis dan API ringan. Namun ada tiga hal yang perlu diwaspadai: aplikasi bisa tidur setelah tidak aktif, durasi eksekusi dibatasi, dan database biasanya berbayar terpisah. Untuk demo UAS yang hanya butuh hidup beberapa jam, free tier masih masuk akal.',
      },
      { type: 'h2', text: '2. Deploy dari GitHub dengan model bayar per jam' },
      {
        type: 'p',
        text: 'Kalau aplikasimu butuh Docker, Laravel, Express, atau database MySQL yang persisten, free tier serverless sering tidak cukup. Alternatifnya adalah platform yang menagih per jam: server hanya menyala saat kamu butuh, lalu dimatikan setelah demo selesai.',
      },
      {
        type: 'p',
        text: 'Di Launchify, alurnya sederhana: daftar akun gratis, top-up saldo kecil via QRIS, tempel URL repository GitHub, lalu klik deploy. Biaya berjalan mulai Rp 42 per jam dan berhenti ketika server dimatikan. Artinya, untuk demo 2 jam kamu hanya membayar sekitar Rp 84 — jauh lebih murah daripada sewa VPS sebulan penuh.',
      },
      { type: 'h2', text: '3. Checklist sebelum klik deploy' },
      {
        type: 'ul',
        items: [
          'Pastikan repository berisi Dockerfile, atau struktur proyek yang dikenali (Laravel, Express, React/Vite).',
          'Simpan konfigurasi sensitif di environment variable, jangan di-commit ke GitHub.',
          'Gunakan port yang konsisten dan baca dari process.env.PORT.',
          'Siapkan file .env.example agar orang lain (dan dosen) tahu variabel yang dibutuhkan.',
          'Matikan server setelah demo agar saldo tidak terus terpotong.',
        ],
      },
      { type: 'h2', text: '4. Tips agar biaya tetap mendekati nol' },
      {
        type: 'p',
        text: 'Aturan paling penting: server yang mati tidak menagih. Nyalakan hanya saat mengerjakan atau mendemokan, lalu matikan kembali. Hindari menyalakan banyak project sekaligus, dan pilih spesifikasi RAM secukupnya — aplikasi CRUD biasanya tidak butuh RAM besar.',
      },
      { type: 'h2', text: 'Kesimpulan' },
      {
        type: 'p',
        text: 'Deploy gratis untuk mahasiswa sangat mungkin, asalkan kamu memilih model biaya yang sesuai. Untuk aplikasi statis, free tier sudah cukup. Untuk aplikasi full-stack dengan Docker, model bayar per jam seperti Launchify memberi fleksibilitas tanpa komitmen bulanan dan tanpa kartu kredit.',
      },
    ],
  },
  {
    slug: 'hosting-murah-mahasiswa-perbandingan',
    title: 'Hosting Murah untuk Mahasiswa: Perbandingan Harga & Cocok untuk Siapa',
    description:
      'Perbandingan hosting murah untuk mahasiswa: Vercel, Railway, VPS, dan platform bayar per jam. Lihat estimasi biaya untuk kebutuhan demo tugas kuliah.',
    keywords: 'hosting murah mahasiswa, harga hosting mahasiswa, hosting tugas kuliah',
    date: '2026-11-12',
    updated: '2026-11-12',
    readingTime: 7,
    excerpt:
      'Free tier, VPS bulanan, atau bayar per jam? Ini perbandingan jujur beserta estimasi biaya untuk kebutuhan mahasiswa.',
    blocks: [
      {
        type: 'p',
        text: 'Mencari hosting murah untuk mahasiswa itu membingungkan karena setiap layanan memakai model harga yang berbeda. Ada yang gratis dengan batas ketat, ada yang menagih bulanan, dan ada yang menagih per jam. Supaya tidak salah pilih, mari bandingkan berdasarkan kebutuhan nyata: demo tugas, portofolio, dan proyek akhir.',
      },
      { type: 'h2', text: 'Ringkasan perbandingan' },
      {
        type: 'ul',
        items: [
          'Free tier (Vercel/Netlify/Render): Rp 0, cocok untuk frontend statis dan API ringan. Batasannya: fungsi bisa tidur, durasi eksekusi terbatas, database terpisah.',
          'VPS bulanan: sekitar Rp 50.000–150.000 per bulan. Bebas konfigurasi, tetapi kamu harus mengurus Docker, Nginx, SSL, dan keamanan sendiri.',
          'Platform bayar per jam (Launchify): mulai Rp 42 per jam, hanya saat server menyala. Cocok untuk demo dan pengembangan bertahap.',
          'Shared hosting: murah, tetapi umumnya hanya untuk PHP tanpa Docker sehingga kurang fleksibel untuk proyek modern.',
        ],
      },
      { type: 'h2', text: 'Estimasi biaya untuk satu semester' },
      {
        type: 'p',
        text: 'Misalnya kamu mengerjakan proyek selama 8 minggu dan hanya menyalakan server saat mengerjakan tugas: sekitar 3 jam per minggu. Dengan tarif Rp 42 per jam, totalnya sekitar Rp 1.008 untuk seluruh semester. Bandingkan dengan VPS bulanan yang tetap menagih walau tidak dipakai.',
      },
      {
        type: 'p',
        text: 'Tentu angka ini berubah jika aplikasimu harus selalu online 24 jam. Dalam kasus itu, VPS bulanan atau paket tetap justru lebih hemat. Kuncinya adalah menyesuaikan model harga dengan pola pemakaian.',
      },
      { type: 'h2', text: 'Faktor selain harga yang wajib dicek' },
      {
        type: 'ul',
        items: [
          'Metode pembayaran: apakah menerima QRIS, ShopeePay, atau GoPay tanpa kartu kredit?',
          'Kemudahan deploy: apakah bisa langsung dari URL GitHub?',
          'Dukungan Docker: penting kalau proyekmu butuh runtime khusus.',
          'Kemampuan mematikan server: semakin mudah, semakin kecil tagihanmu.',
          'Kejelasan tagihan: pastikan ada riwayat mutasi saldo yang transparan.',
        ],
      },
      { type: 'h2', text: 'Rekomendasi berdasarkan tipe proyek' },
      {
        type: 'p',
        text: 'Untuk portofolio statis dan landing page, free tier sudah lebih dari cukup. Untuk aplikasi full-stack yang dipakai bergiliran saat demo, platform bayar per jam paling ramah kantong. Untuk sistem yang harus online terus dan dipakai banyak orang, VPS bulanan lebih masuk akal meski butuh waktu setup.',
      },
      { type: 'h2', text: 'Kesimpulan' },
      {
        type: 'p',
        text: 'Hosting murah bukan berarti gratis, tetapi bisa sangat murah kalau kamu membayar sesuai pemakaian. Mulai dari free tier, pindah ke model per jam saat butuh Docker, dan pertimbangkan VPS hanya ketika trafik sudah stabil.',
      },
    ],
  },
  {
    slug: 'deploy-laravel-express-dari-github',
    title: 'Cara Deploy Laravel & Express dari GitHub dalam 5 Menit',
    description:
      'Langkah praktis deploy aplikasi Laravel atau Express dari repository GitHub ke hosting Docker: siapkan Dockerfile, environment variable, lalu jalankan.',
    keywords: 'deploy laravel murah, deploy express github, deploy docker mahasiswa',
    date: '2026-11-15',
    updated: '2026-11-15',
    readingTime: 8,
    excerpt:
      'Panduan teknis singkat agar proyek Laravel dan Express-mu bisa di-deploy dari GitHub tanpa konfigurasi server manual.',
    blocks: [
      {
        type: 'p',
        text: 'Salah satu alasan deploy terasa menakutkan adalah konfigurasi server: install PHP, Composer, Node, Nginx, dan SSL satu per satu. Dengan pendekatan Docker, semua kebutuhan itu dibungkus dalam satu file sehingga proses deploy menjadi jauh lebih singkat.',
      },
      { type: 'h2', text: 'Menyiapkan Dockerfile untuk Laravel' },
      {
        type: 'p',
        text: 'Laravel membutuhkan PHP, ekstensi umum, dan Composer. Dockerfile minimal biasanya memakai image php:8.3-cli, menyalin kode, menjalankan composer install, lalu menjalankan php artisan serve pada port dari environment variable. Untuk produksi, gunakan php-fpm dengan Nginx, tetapi untuk demo tugas, built-in server sudah memadai.',
      },
      {
        type: 'ul',
        items: [
          'Salin seluruh kode ke dalam image.',
          'Jalankan composer install --no-dev --optimize-autoloader.',
          'Set APP_KEY dan koneksi database lewat environment variable.',
          'Expose port yang sama dengan yang kamu daftarkan di platform.',
        ],
      },
      { type: 'h2', text: 'Menyiapkan Dockerfile untuk Express' },
      {
        type: 'p',
        text: 'Untuk Express, gunakan image node:20-alpine. Salin package.json, jalankan npm ci --omit=dev, salin sisa kode, lalu jalankan node index.js. Pastikan aplikasi membaca process.env.PORT agar platform bisa menentukan port secara otomatis.',
      },
      { type: 'h2', text: 'Langkah deploy dari GitHub' },
      {
        type: 'ol',
        items: [
          'Push proyek ke repository GitHub publik.',
          'Daftar akun di platform deploy dan top-up saldo kecil via QRIS.',
          'Buat project baru, tempel URL repository, dan tentukan port aplikasi.',
          'Tambahkan environment variable yang dibutuhkan (DB, APP_KEY, API key).',
          'Klik deploy dan tunggu proses build selesai.',
          'Buka URL yang diberikan, lalu matikan server setelah selesai dipakai.',
        ],
      },
      { type: 'h2', text: 'Kesalahan yang paling sering terjadi' },
      {
        type: 'ul',
        items: [
          'Port hardcode yang berbeda dengan port di platform, sehingga health check gagal.',
          'File .env ikut ter-commit sehingga kredensial bocor.',
          'Migration database belum dijalankan saat container start.',
          'Mengandalkan node_modules lokal yang tidak ada di repository.',
        ],
      },
      { type: 'h2', text: 'Kesimpulan' },
      {
        type: 'p',
        text: 'Dengan Dockerfile yang rapi dan environment variable yang benar, deploy Laravel maupun Express dari GitHub bisa selesai dalam hitungan menit. Setelah itu, biaya tinggal diatur dengan mematikan server saat tidak digunakan.',
      },
    ],
  },
];

export function getArtikel(slug) {
  return ARTIKEL.find((item) => item.slug === slug);
}
