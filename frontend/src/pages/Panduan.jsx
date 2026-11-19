import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import PublicShell from '../components/PublicShell';
import Seo from '../components/Seo';
import { ARTIKEL } from '../data/artikel';

const SITE_URL = (import.meta.env.VITE_SITE_URL || 'https://launchify.id').replace(/\/$/, '');

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: 'Panduan Deploy Aplikasi Murah untuk Mahasiswa',
  url: `${SITE_URL}/panduan`,
  inLanguage: 'id-ID',
  mainEntity: {
    '@type': 'ItemList',
    itemListElement: ARTIKEL.map((artikel, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: `${SITE_URL}/panduan/${artikel.slug}`,
      name: artikel.title,
    })),
  },
};

export default function Panduan() {
  return (
    <PublicShell>
      <Seo
        title="Panduan Deploy Aplikasi Murah untuk Mahasiswa"
        description="Kumpulan panduan deploy aplikasi untuk mahasiswa: cara deploy gratis, perbandingan hosting murah, dan tutorial deploy Laravel atau Express dari GitHub."
        path="/panduan"
        jsonLd={jsonLd}
      />

      <section className="px-6 pt-16 pb-24 md:px-10 md:pt-24">
        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.4fr_1fr]">
          <div className="reveal">
            <p className="text-sm font-bold tracking-wide text-muted uppercase">Panduan</p>
            <h1 className="font-display mt-4 text-5xl leading-[1.02] font-extrabold tracking-tight md:text-7xl">
              Belajar deploy aplikasi <span className="highlight">tanpa boros.</span>
            </h1>
            <p className="mt-8 max-w-xl text-lg leading-relaxed text-muted md:text-xl">
              Artikel praktis seputar deploy murah, hosting mahasiswa, dan cara membuat proyek kuliahmu online dari
              GitHub.
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Link to="/register" className="btn-primary px-7 py-4 text-lg">
                Mulai Deploy Sekarang
              </Link>
              <Link to="/#cara-kerja" className="btn-secondary px-7 py-4 text-lg">
                Lihat Cara Kerja
              </Link>
            </div>
            <p className="mt-6 text-sm text-muted">
              Semua panduan gratis · Mulai Rp 42/jam · Tanpa kartu kredit
            </p>
          </div>

          <aside className="reveal rounded-2xl border-2 border-ink bg-accent p-8 text-on-accent shadow-block-lg">
            <p className="text-sm font-bold tracking-wide uppercase">Panduan tersedia</p>
            <p className="font-display mt-4 text-6xl font-extrabold tabular-nums">{ARTIKEL.length}</p>
            <p className="mt-2 text-lg font-semibold">artikel praktis untuk pemula.</p>
            <p className="mt-8 border-t-2 border-ink pt-6 text-sm">
              Dibaca beberapa menit, langsung bisa dipraktikkan ke proyek GitHub-mu.
            </p>
          </aside>
        </div>
      </section>

      <section className="scroll-mt-24 border-y-2 border-ink bg-surface px-6 py-24 md:px-10">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="font-display max-w-2xl text-4xl font-extrabold tracking-tight md:text-5xl">
                Semua panduan deploy
              </h2>
              <p className="mt-4 max-w-xl text-lg text-muted">
                Pilih panduan yang paling dekat dengan kebutuhan proyek kuliahmu.
              </p>
            </div>
            <Link to="/" className="font-semibold underline-offset-4 hover:underline">
              Kembali ke beranda
            </Link>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {ARTIKEL.map((artikel) => (
              <article key={artikel.slug} className="reveal-on-scroll card flex flex-col p-7">
                <p className="text-sm font-semibold text-muted">
                  {artikel.readingTime} menit baca · {artikel.keywords.split(',')[0]}
                </p>
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
                  Baca panduan <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-24 md:px-10">
        <div className="mx-auto max-w-6xl rounded-3xl border-2 border-ink bg-ink p-10 text-paper shadow-block-lg md:p-16">
          <h2 className="font-display max-w-2xl text-4xl font-extrabold tracking-tight md:text-6xl">
            Sudah paham caranya? Saatnya deploy.
          </h2>
          <p className="mt-6 max-w-xl text-lg opacity-85">
            Daftar gratis, top-up via QRIS mulai Rp 10.000, dan deploy langsung dari GitHub. Bayar hanya selama server
            menyala.
          </p>
          <Link to="/register" className="btn-primary mt-10 px-7 py-4 text-lg">
            Buat Akun Sekarang
          </Link>
        </div>
      </section>
    </PublicShell>
  );
}
