import { Link } from 'react-router-dom';
import { Rocket } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';
import logo from '../assets/logo.png';
import api from '../utils/api';
import { useEffect, useState } from 'react';

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
            <h1 className="font-display text-5xl leading-[1.02] font-extrabold tracking-tight md:text-7xl">
              Deploy aplikasi web-mu <span className="highlight">tanpa kartu kredit.</span>
            </h1>
            <p className="mt-8 max-w-xl text-lg leading-relaxed text-muted md:text-xl">
              Cloud hosting khusus mahasiswa. Hubungkan repositori GitHub, isi saldo pakai QRIS ShopeePay, dan biarkan sistem kami merakit Docker-nya untukmu secara otomatis.
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Link to="/register" className="btn-primary px-7 py-4 text-lg">
                <Rocket className="h-5 w-5" /> Mulai Deploy Sekarang
              </Link>
              <a href="#cara-kerja" className="btn-secondary px-7 py-4 text-lg">
                Lihat Cara Kerja
              </a>
            </div>
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
            Kenapa memilih Launchify?
          </h2>
          <p className="mt-4 max-w-xl text-lg text-muted">
            Didesain untuk masalah yang sering dihadapi mahasiswa IT.
          </p>

          <div className="mt-14 grid gap-6 md:grid-cols-5">
            <article className="reveal-on-scroll rounded-2xl border-2 border-ink bg-ink p-8 text-paper md:col-span-3 md:p-10">
              <h3 className="font-display text-3xl font-bold">Bayar pakai QRIS</h3>
              <p className="mt-4 max-w-md text-lg leading-relaxed opacity-85">
                Tidak perlu pinjam kartu kredit orang tua. Top-up saldo pakai ShopeePay, GoPay, atau m-Banking mulai dari Rp 10.000.
              </p>
            </article>

            <div className="flex flex-col gap-6 md:col-span-2">
              <article className="reveal-on-scroll card flex-1 p-8">
                <h3 className="font-display text-2xl font-bold">Pay-as-you-go</h3>
                <p className="mt-3 leading-relaxed text-muted">
                  Tagihan per jam. Kalau tugas atau demo praktikum sudah selesai, matikan servernya agar saldo berhenti terpotong.
                </p>
              </article>
              <article className="reveal-on-scroll card flex-1 p-8">
                <h3 className="font-display text-2xl font-bold">Auto-build dari GitHub</h3>
                <p className="mt-3 leading-relaxed text-muted">
                  Tinggal masukkan URL repositori. Kami menjalankan environment Docker secara otomatis dan memberikan URL aktif.
                </p>
              </article>
            </div>
          </div>
        </div>
      </section>

      <section id="cara-kerja" className="scroll-mt-24 border-y-2 border-ink bg-surface px-6 py-24 md:px-10">
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

      <section id="harga" className="scroll-mt-24 px-6 py-24 md:px-10">
        <div className="mx-auto max-w-6xl rounded-3xl border-2 border-ink bg-ink p-10 text-paper shadow-block-lg md:p-16">
          <h2 className="font-display max-w-2xl text-4xl font-extrabold tracking-tight md:text-6xl">
            Mulai dari Rp 42 perak per jam.
          </h2>
          <p className="mt-6 max-w-xl text-lg opacity-85">
            Jauh lebih murah dari jajan di kantin. Bayar hanya selama server menyala.
          </p>
          <Link to="/register" className="btn-primary mt-10 px-7 py-4 text-lg">
            Buat Akun Sekarang
          </Link>
        </div>
      </section>

      <footer className="border-t-2 border-ink px-6 py-10 text-sm md:px-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <span className="font-display text-lg font-extrabold">Launchify</span>
          <p className="text-muted">© 2026 Launchify. Dibangun untuk Projek UAS Pemrograman Framework.</p>
        </div>
      </footer>
    </div>
  );
}
