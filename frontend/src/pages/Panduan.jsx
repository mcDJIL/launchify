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

      <section className="px-6 pt-16 pb-12 md:pt-20">
        <div className="mx-auto max-w-4xl">
          <p className="text-sm font-bold tracking-wide text-muted uppercase">Panduan</p>
          <h1 className="font-display mt-4 max-w-2xl text-4xl font-extrabold tracking-tight md:text-6xl">
            Belajar deploy aplikasi <span className="highlight">tanpa boros.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">
            Artikel praktis seputar deploy murah, hosting mahasiswa, dan cara membuat proyek kuliahmu online dari
            GitHub.
          </p>
        </div>
      </section>

      <section className="px-6 pb-24">
        <div className="mx-auto grid max-w-4xl gap-6">
          {ARTIKEL.map((artikel) => (
            <article key={artikel.slug} className="card p-8 transition hover:shadow-block">
              <p className="text-sm font-semibold text-muted">
                {artikel.readingTime} menit baca · {artikel.keywords.split(',')[0]}
              </p>
              <h2 className="font-display mt-3 text-2xl font-bold md:text-3xl">
                <Link to={`/panduan/${artikel.slug}`} className="underline-offset-4 hover:underline">
                  {artikel.title}
                </Link>
              </h2>
              <p className="mt-3 leading-relaxed text-muted">{artikel.excerpt}</p>
              <Link
                to={`/panduan/${artikel.slug}`}
                className="mt-5 inline-flex items-center gap-2 font-semibold underline-offset-4 hover:underline"
              >
                Baca panduan <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </article>
          ))}
        </div>
      </section>
    </PublicShell>
  );
}
