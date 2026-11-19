import { Link } from 'react-router-dom';

export default function PublicFooter() {
  return (
    <footer className="border-t-2 border-ink px-6 py-10 text-sm md:px-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <span className="font-display text-lg font-extrabold">Launchify</span>
        <nav aria-label="Tautan footer" className="flex flex-wrap gap-x-6 gap-y-2 text-muted">
          <Link to="/panduan" className="hover:underline">
            Panduan
          </Link>
          <Link to="/#harga" className="hover:underline">
            Harga
          </Link>
          <Link to="/#faq" className="hover:underline">
            FAQ
          </Link>
          <Link to="/register" className="hover:underline">
            Daftar
          </Link>
        </nav>
        <p className="text-muted">© 2026 Launchify. Dibangun untuk Projek UAS Pemrograman Framework.</p>
      </div>
    </footer>
  );
}
