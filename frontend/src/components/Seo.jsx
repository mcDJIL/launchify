import { useEffect } from 'react';

const SITE_NAME = 'Launchify';

const SITE_URL = (
  import.meta.env.VITE_SITE_URL ||
  (typeof window !== 'undefined' ? window.location.origin : '')
).replace(/\/$/, '');

const DEFAULT_DESCRIPTION =
  'Launchify adalah platform deploy aplikasi murah khusus mahasiswa. Hubungkan repo GitHub, bayar pakai QRIS, dan aplikasimu langsung live mulai Rp 42 per jam.';

function setMeta(attr, key, content) {
  if (!content) return;
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setCanonical(href) {
  let el = document.head.querySelector('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

/**
 * Mengatur title, meta description, canonical, Open Graph, dan JSON-LD per halaman.
 * Dipakai sekali di setiap halaman publik agar tidak dobel.
 */
export default function Seo({
  title,
  description = DEFAULT_DESCRIPTION,
  path = '/',
  image = '/logo.png',
  type = 'website',
  noindex = false,
  jsonLd,
}) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} — Deploy Aplikasi Murah untuk Mahasiswa`;
  const url = `${SITE_URL}${path}`;
  const imageUrl = image.startsWith('http') ? image : `${SITE_URL}${image}`;
  const json = jsonLd ? JSON.stringify(jsonLd) : null;

  useEffect(() => {
    document.title = fullTitle;
    setMeta('name', 'description', description);
    setMeta('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large');
    setCanonical(url);

    setMeta('property', 'og:title', fullTitle);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:url', url);
    setMeta('property', 'og:image', imageUrl);
    setMeta('property', 'og:type', type);
    setMeta('name', 'twitter:card', 'summary');
    setMeta('name', 'twitter:title', fullTitle);
    setMeta('name', 'twitter:description', description);
    setMeta('name', 'twitter:image', imageUrl);

    const scriptId = 'seo-page-jsonld';
    document.getElementById(scriptId)?.remove();
    if (json) {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.id = scriptId;
      script.textContent = json;
      document.head.appendChild(script);
    }

    return () => {
      document.getElementById(scriptId)?.remove();
    };
  }, [fullTitle, description, url, imageUrl, type, noindex, json]);

  return null;
}
