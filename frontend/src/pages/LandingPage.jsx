import { Link } from 'react-router-dom';
import { ArrowRight, Rocket } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';
import Seo from '../components/Seo';
import logo from '../assets/logo.png';
import api from '../utils/api';
import { useEffect, useState } from 'react';
import { ARTIKEL } from '../data/artikel';

const STEPS = [
  {
    title: 'Top-up dompet',
    desc: 'Scan QRIS, upload bukti bayar, dan saldo langsung masuk.',
  },
  {
    title: 'Daftarkan project',
    desc: 'Pilih spesifikasi RAM & CPU, lalu tempelkan link GitHub (Express, Laravel, Vite, dll).',
  },
  {
    title: 'Klik deploy',
    desc: 'Tunggu beberapa detik, aplikasi web-mu langsung live dan siap didemokan ke dosen.',
  },
];

const COMPARISON = [
  {
    label: 'Biaya',
    launchify: 'Rp 42/jam, hanya saat server menyala',
    free: 'Rp 0 dengan batas kuota',
    vps: 'Sekitar Rp 50–150 rb/bulan',
  },
  {
    label: 'Pembayaran',
    launchify: 'QRIS, ShopeePay, GoPay, m-Banking',
    free: 'Umumnya butuh kartu kredit',
    vps: 'Kartu kredit atau transfer',
  },
  {
    label: 'Dukungan Docker',
    launchify: 'Otomatis dari repository GitHub',
    free: 'Terbatas / serverless',
    vps: 'Bisa, tetapi setup manual',
  },
  {
    label: 'Paling cocok untuk',
    launchify: 'Demo tugas & proyek kuliah',
    free: 'Landing page dan frontend statis',
    vps: 'Aplikasi yang online 24 jam',
  },
];

const FAQ = [
  {
    q: 'Berapa harga deploy aplikasi di Launchify?',
    a: 'Mulai Rp 42 per jam per server, dan hanya dihitung selama server menyala. Matikan server setelah demo selesai, maka saldo berhenti terpotong.',
  },
  {
    q: 'Apakah ada deploy gratis untuk mahasiswa?',
    a: 'Pendaftaran akun gratis. Kamu hanya mengisi saldo saat ingin menyalakan server, dan bisa mulai dari nominal kecil lewat QRIS. Tidak ada biaya bulanan atau biaya tersembunyi.',
  },
  {
    q: 'Metode pembayaran apa saja yang didukung?',
    a: 'Top-up saldo memakai QRIS, sehingga bisa dibayar dari ShopeePay, GoPay, OVO, DANA, atau m-Banking. Tidak perlu kartu kredit orang tua.',
  },
  {
    q: 'Aplikasi apa saja yang bisa di-deploy?',
    a: 'Aplikasi berbasis Docker, termasuk Laravel, Express, React/Vite, dan proyek lain yang punya Dockerfile. Cukup tempel URL repository GitHub, lalu tentukan port aplikasi.',
  },
  {
    q: 'Apakah perlu kartu kredit untuk mendaftar?',
    a: 'Tidak. Cukup email dan nomor HP. Pembayaran dilakukan lewat QRIS sesuai nominal top-up.',
  },
  {
    q: 'Apakah Launchify cocok untuk tugas kuliah dan demo UAS?',
    a: 'Ya. Launchify dibuat untuk kebutuhan mahasiswa: deploy cepat dari GitHub, URL langsung bisa dibuka dosen, dan biaya bisa ditekan dengan mematikan server saat tidak dipakai.',
  },
];

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQ.map((item) => ({
    '@type': 'Question',
    name: item.q,
    acceptedAnswer: { '@type': 'Answer', text: item.a },
  })),
};

export default function LandingPage() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      api.get('/user', { headers: { Authorization: `Bearer ${token}` } })
        .then(res => setUser(res.data))
        .catch(err => console.error('Gagal memuat data user:', err));
    }
  }, []);

  return (
    <div className="min-h-screen bg-paper font-sans text-ink">
      <Seo
        title="Deploy Aplikasi Murah untuk Mahasiswa, Mulai Rp 42/Jam"
        description="Deploy aplikasi web dari GitHub tanpa kartu kredit. Hosting murah khusus mahasiswa dengan bayar per jam mulai Rp 42, top-up via QRIS. Cocok untuk tugas kuliah dan demo UAS."
        path="/"
        jsonLd={faqJsonLd}
      />

      <header className="sticky top-0 z-50 border-b-2 border-ink bg-paper">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4 md:px-0">
          <Link to="/" className="font-display text-2xl font-extrabold tracking-tight flex items-center gap-2.5">
            <img src={logo} alt="Logo Launchify" className="h-12 w-12" />
            <span>Launchify</span>
          </Link>

          <nav aria-label="Navigasi halaman" className="hidden gap-8 text-sm font-semibold md:flex">
            <a href="#fitur" className="underline-offset-4 hover:underline">Fitur</a>
            <a href="#cara-kerja" className="underline-offset-4 hover:underline">Cara Kerja</a>
            <a href="#harga" className="underline-offset-4 hover:underline">Harga</a>
            <a href="#faq" className="underline-offset-4 hover:underline">FAQ</a>
            <Link to="/panduan" className="underline-offset-4 hover:underline">Panduan</Link>
          </nav>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            {user ? (
              <Link to="/dashboard" className="btn-primary px-5 py-2.5 text-sm">
                Dashboard
              </Link>
            ) : (
              <>
                <Link to="/login" className="hidden px-3 py-2 font-semibold underline-offset-4 hover:underline sm:block">
                  Masuk
                </Link>
                <Link to="/register" className="btn-primary px-5 py-2.5 text-sm">
                  Daftar Gratis
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <section className="px-6 pt-16 pb-24 md:px-10 md:pt-24">
        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.4fr_1fr]">
          <div className="reveal">
            <p className="text-sm font-bold tracking-wide text-muted uppercase">Cloud hosting mahasiswa</p>
            <h1 className="font-display mt-4 text-5xl leading-[1.02] font-extrabold tracking-tight md:text-7xl">
              Deploy aplikasi <span className="highlight">murah untuk mahasiswa.</span>
            </h1>
            <p className="mt-8 max-w-xl text-lg leading-relaxed text-muted md:text-xl">
              Launchify adalah platform deploy dan cloud hosting khusus mahasiswa. Hubungkan repositori GitHub, isi
              saldo pakai QRIS ShopeePay, dan biarkan sistem kami merakit Docker-nya untukmu — tanpa kartu kredit.
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Link to="/register" className="btn-primary px-7 py-4 text-lg">
                <Rocket className="h-5 w-5" aria-hidden="true" /> Mulai Deploy Sekarang
              </Link>
              <a href="#cara-kerja" className="btn-secondary px-7 py-4 text-lg">
                Lihat Cara Kerja
              </a>
            </div>
            <p className="mt-6 text-sm text-muted">
              Mulai Rp 42/jam · Bayar via QRIS · Tanpa kartu kredit
            </p>
          </div>

          <aside className="reveal rounded-2xl border-2 border-ink bg-accent p-8 text-on-accent shadow-block-lg">
            <p className="text-sm font-bold tracking-wide uppercase">Biaya server</p>
            <p className="font-display mt-4 text-6xl font-extrabold tabular-nums">Rp 42</p>
            <p className="mt-2 text-lg font-semibold">per jam, hanya saat server menyala.</p>
            <p className="mt-8 border-t-2 border-ink pt-6 text-sm">
              Matikan server saat tidak dipakai, dan saldo berhenti terpotong.
            </p>
          </aside>
        </div>
      </section>

      <section id="fitur" className="scroll-mt-24 px-6 py-24 md:px-10">
        <div className="mx-auto max-w-6xl">
          <h2 className="font-display max-w-2xl text-4xl font-extrabold tracking-tight md:text-5xl">
            Kenapa memilih Launchify untuk deploy murah?
          </h2>
          <p className="mt-4 max-w-xl text-lg text-muted">
            Didesain untuk masalah yang sering dihadapi mahasiswa IT saat ingin membuat proyeknya online.
          </p>

          <div className="mt-14 grid gap-6 md:grid-cols-5">
            <article className="reveal-on-scroll rounded-2xl border-2 border-ink bg-ink p-8 text-paper md:col-span-3 md:p-10">
              <h3 className="font-display text-3xl font-bold">Bayar pakai QRIS</h3>
              <p className="mt-4 max-w-md text-lg leading-relaxed opacity-85">
                Tidak perlu pinjam kartu kredit orang tua. Top-up saldo pakai ShopeePay, GoPay, atau m-Banking mulai
                dari Rp 10.000.
              </p>
            </article>

            <div className="flex flex-col gap-6 md:col-span-2">
              <article className="reveal-on-scroll card flex-1 p-8">
                <h3 className="font-display text-2xl font-bold">Pay-as-you-go</h3>
                <p className="mt-3 leading-relaxed text-muted">
                  Tagihan per jam. Kalau tugas atau demo praktikum sudah selesai, matikan servernya agar saldo berhenti
                  terpotong.
                </p>
              </article>
              <article className="reveal-on-scroll card flex-1 p-8">
                <h3 className="font-display text-2xl font-bold">Auto-build dari GitHub</h3>
                <p className="mt-3 leading-relaxed text-muted">
                  Tinggal masukkan URL repositori. Kami menjalankan environment Docker secara otomatis dan memberikan
                  URL aktif.
                </p>
              </article>
            </div>
          </div>
        </div>
      </section>

      <section id="perbandingan" className="scroll-mt-24 border-y-2 border-ink bg-surface px-6 py-24 md:px-10">
        <div className="mx-auto max-w-6xl">
          <h2 className="font-display max-w-3xl text-4xl font-extrabold tracking-tight md:text-5xl">
            Launchify vs hosting lain untuk mahasiswa
          </h2>
          <p className="mt-4 max-w-2xl text-lg text-muted">
            Free tier, VPS bulanan, atau bayar per jam? Ini perbandingan singkat berdasarkan kebutuhan proyek kuliah.
          </p>

          <div className="mt-12 overflow-x-auto">
            <table className="w-full min-w-[720px] border-2 border-ink bg-paper text-left text-sm">
              <caption className="sr-only">
                Perbandingan Launchify dengan free tier dan VPS bulanan untuk kebutuhan mahasiswa
              </caption>
              <thead>
                <tr className="border-b-2 border-ink bg-accent text-on-accent">
                  <th scope="col" className="px-5 py-4 font-bold">Aspek</th>
                  <th scope="col" className="px-5 py-4 font-bold">Launchify</th>
                  <th scope="col" className="px-5 py-4 font-bold">Free tier</th>
                  <th scope="col" className="px-5 py-4 font-bold">VPS bulanan</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((row) => (
                  <tr key={row.label} className="border-b-2 border-ink last:border-b-0">
                    <th scope="row" className="px-5 py-4 font-semibold">{row.label}</th>
                    <td className="px-5 py-4 font-semibold">{row.launchify}</td>
                    <td className="px-5 py-4 text-muted">{row.free}</td>
                    <td className="px-5 py-4 text-muted">{row.vps}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section id="cara-kerja" className="scroll-mt-24 px-6 py-24 md:px-10">
        <div className="mx-auto grid max-w-6xl gap-14 lg:grid-cols-[1fr_1.2fr] lg:gap-20">
          <div>
            <h2 className="font-display text-4xl font-extrabold tracking-tight md:text-5xl">
              Tiga langkah menuju production.
            </h2>
            <p className="mt-4 max-w-md text-lg text-muted">
              Dari saldo kosong ke link live, tanpa perlu menyiapkan server sendiri.
            </p>
          </div>

          <ol className="divide-y-2 divide-ink border-y-2 border-ink">
            {STEPS.map((step, index) => (
              <li key={step.title} className="reveal-on-scroll grid grid-cols-[3.5rem_1fr] gap-4 py-8 md:grid-cols-[5rem_1fr] md:gap-6">
                <span className="font-display text-4xl font-extrabold text-muted tabular-nums">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div>
                  <h3 className="font-display text-2xl font-bold">{step.title}</h3>
                  <p className="mt-2 leading-relaxed text-muted">{step.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="harga" className="scroll-mt-24 border-y-2 border-ink bg-surface px-6 py-24 md:px-10">
        <div className="mx-auto max-w-6xl rounded-3xl border-2 border-ink bg-ink p-10 text-paper shadow-block-lg md:p-16">
          <h2 className="font-display max-w-2xl text-4xl font-extrabold tracking-tight md:text-6xl">
            Harga hosting mahasiswa: mulai Rp 42 per jam.
          </h2>
          <p className="mt-6 max-w-xl text-lg opacity-85">
            Jauh lebih murah dari jajan di kantin. Bayar hanya selama server menyala, tanpa biaya bulanan dan tanpa
            kartu kredit.
          </p>
          <ul className="mt-8 grid max-w-xl gap-3 text-lg opacity-90">
            <li>• Top-up mulai Rp 10.000 lewat QRIS.</li>
            <li>• Riwayat mutasi saldo tercatat transparan.</li>
            <li>• Server bisa dimatikan kapan saja untuk menghentikan tagihan.</li>
          </ul>
          <Link to="/register" className="btn-primary mt-10 px-7 py-4 text-lg">
            Buat Akun Sekarang
          </Link>
        </div>
      </section>

      <section id="faq" className="scroll-mt-24 px-6 py-24 md:px-10">
        <div className="mx-auto max-w-4xl">
          <h2 className="font-display text-4xl font-extrabold tracking-tight md:text-5xl">
            Pertanyaan seputar deploy murah
          </h2>
          <p className="mt-4 max-w-2xl text-lg text-muted">
            Hal yang paling sering ditanyakan mahasiswa sebelum mulai deploy.
          </p>

          <div className="mt-10 divide-y-2 divide-ink border-y-2 border-ink">
            {FAQ.map((item) => (
              <details key={item.q} className="group py-6">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-xl font-bold">
                  {item.q}
                  <span aria-hidden="true" className="text-2xl leading-none text-muted transition group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-4 leading-relaxed text-muted">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t-2 border-ink bg-surface px-6 py-24 md:px-10">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-4xl font-extrabold tracking-tight md:text-5xl">
                Panduan deploy untuk pemula
              </h2>
              <p className="mt-4 max-w-xl text-lg text-muted">
                Belajar deploy aplikasi gratis, memilih hosting murah, dan menyiapkan proyek GitHub-mu.
              </p>
            </div>
            <Link to="/panduan" className="font-semibold underline-offset-4 hover:underline">
              Lihat semua panduan
            </Link>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {ARTIKEL.map((artikel) => (
              <article key={artikel.slug} className="card flex flex-col p-7">
                <p className="text-sm font-semibold text-muted">{artikel.readingTime} menit baca</p>
                <h3 className="font-display mt-3 text-xl font-bold">
                  <Link to={`/panduan/${artikel.slug}`} className="underline-offset-4 hover:underline">
                    {artikel.title}
                  </Link>
                </h3>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-muted">{artikel.excerpt}</p>
                <Link
                  to={`/panduan/${artikel.slug}`}
                  className="mt-5 inline-flex items-center gap-2 text-sm font-semibold underline-offset-4 hover:underline"
                >
                  Baca <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t-2 border-ink px-6 py-10 text-sm md:px-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <span className="font-display text-lg font-extrabold">Launchify</span>
          <nav aria-label="Tautan footer" className="flex flex-wrap gap-x-6 gap-y-2 text-muted">
            <Link to="/panduan" className="hover:underline">Panduan</Link>
            <a href="#harga" className="hover:underline">Harga</a>
            <a href="#faq" className="hover:underline">FAQ</a>
            <Link to="/register" className="hover:underline">Daftar</Link>
          </nav>
          <p className="text-muted">© 2026 Launchify. Dibangun untuk Projek UAS Pemrograman Framework.</p>
        </div>
      </footer>
    </div>
  );
}
