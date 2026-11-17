import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import PublicShell from '../components/PublicShell';
import Seo from '../components/Seo';
import { ARTIKEL, getArtikel } from '../data/artikel';

const SITE_URL = (import.meta.env.VITE_SITE_URL || 'https://launchify.id').replace(/\/$/, '');

const dateFormatter = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

function Blocks({ blocks }) {
  return blocks.map((block, index) => {
    if (block.type === 'h2') {
      return (
        <h2 key={index} className="font-display mt-12 text-2xl font-bold tracking-tight md:text-3xl">
          {block.text}
        </h2>
      );
    }

    if (block.type === 'ul' || block.type === 'ol') {
      const List = block.type === 'ul' ? 'ul' : 'ol';
      return (
        <List
          key={index}
          className={`mt-5 space-y-2 pl-6 leading-relaxed text-muted ${block.type === 'ul' ? 'list-disc' : 'list-decimal'}`}
        >
          {block.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </List>
      );
    }

    return (
      <p key={index} className="mt-5 text-lg leading-relaxed text-muted">
        {block.text}
      </p>
    );
  });
}

export default function Artikel() {
  const { slug } = useParams();
  const artikel = getArtikel(slug);

  if (!artikel) {
    return (
      <PublicShell>
        <Seo title="Artikel tidak ditemukan" path={`/panduan/${slug}`} noindex />
        <section className="px-6 py-24">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="font-display text-4xl font-extrabold">Artikel tidak ditemukan</h1>
            <p className="mt-4 text-muted">Mungkin tautannya sudah berubah atau artikelnya belum tersedia.</p>
            <Link to="/panduan" className="btn-primary mt-8 px-6 py-3">
              Lihat semua panduan
            </Link>
          </div>
        </section>
      </PublicShell>
    );
  }

  const path = `/panduan/${artikel.slug}`;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        headline: artikel.title,
        description: artikel.description,
        datePublished: artikel.date,
        dateModified: artikel.updated,
        inLanguage: 'id-ID',
        mainEntityOfPage: `${SITE_URL}${path}`,
        author: { '@type': 'Organization', name: 'Launchify' },
        publisher: { '@type': 'Organization', name: 'Launchify', logo: { '@type': 'ImageObject', url: `${SITE_URL}/logo.png` } },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Beranda', item: `${SITE_URL}/` },
          { '@type': 'ListItem', position: 2, name: 'Panduan', item: `${SITE_URL}/panduan` },
          { '@type': 'ListItem', position: 3, name: artikel.title, item: `${SITE_URL}${path}` },
        ],
      },
    ],
  };

  const lainnya = ARTIKEL.filter((item) => item.slug !== artikel.slug).slice(0, 2);

  return (
    <PublicShell>
      <Seo
        title={artikel.title}
        description={artikel.description}
        path={path}
        type="article"
        jsonLd={jsonLd}
      />

      <article className="px-6 pt-12 pb-20 md:pt-16">
        <div className="mx-auto max-w-2xl">
          <Link to="/panduan" className="inline-flex items-center gap-2 text-sm font-semibold text-muted hover:underline">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Semua panduan
          </Link>

          <h1 className="font-display mt-6 text-3xl font-extrabold tracking-tight md:text-5xl">{artikel.title}</h1>
          <p className="mt-4 text-sm font-semibold text-muted">
            <time dateTime={artikel.updated}>Diperbarui {dateFormatter.format(new Date(artikel.updated))}</time> ·{' '}
            {artikel.readingTime} menit baca
          </p>
          <p className="mt-8 text-xl leading-relaxed">{artikel.excerpt}</p>

          <div className="mt-4 border-t-2 border-ink pt-2">
            <Blocks blocks={artikel.blocks} />
          </div>

          <div className="mt-14 rounded-2xl border-2 border-ink bg-ink p-8 text-paper shadow-block-lg">
            <h2 className="font-display text-2xl font-bold">Siap deploy proyekmu?</h2>
            <p className="mt-3 opacity-85">
              Daftar gratis, top-up via QRIS, dan deploy langsung dari GitHub. Mulai Rp 42 per jam.
            </p>
            <Link to="/register" className="btn-primary mt-6 px-6 py-3">
              Mulai Deploy <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>

          {lainnya.length > 0 && (
            <section className="mt-16">
              <h2 className="font-display text-2xl font-bold">Baca juga</h2>
              <div className="mt-5 grid gap-4">
                {lainnya.map((item) => (
                  <Link
                    key={item.slug}
                    to={`/panduan/${item.slug}`}
                    className="card block p-6 transition hover:shadow-block"
                  >
                    <span className="font-display text-lg font-bold">{item.title}</span>
                    <span className="mt-2 block text-sm text-muted">{item.excerpt}</span>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </article>
    </PublicShell>
  );
}
