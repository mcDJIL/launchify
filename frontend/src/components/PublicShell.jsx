import { Link } from 'react-router-dom';
import logo from '../assets/logo.png';
import ThemeToggle from './ThemeToggle';

/**
 * Kerangka halaman publik (artikel & panduan): header sederhana + footer.
 * Halaman landing punya header sendiri karena punya navigasi anchor.
 */
export default function PublicShell({ children }) {
  return (
    <div className="min-h-screen bg-paper font-sans text-ink">
      <header className="sticky top-0 z-50 border-b-2 border-ink bg-paper">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-6 py-4">
          <Link to="/" className="flex items-center gap-2.5 font-display text-2xl font-extrabold tracking-tight">
            <img src={logo} alt="Logo Launchify" className="h-10 w-10" />
            <span>Launchify</span>
          </Link>

          <nav aria-label="Navigasi halaman" className="flex items-center gap-5 text-sm font-semibold">
            <Link to="/panduan" className="hidden underline-offset-4 hover:underline sm:block">
              Panduan
            </Link>
            <ThemeToggle />
            <Link to="/register" className="btn-primary px-5 py-2.5 text-sm">
              Daftar Gratis
            </Link>
          </nav>
        </div>
      </header>

      <main>{children}</main>

      <footer className="border-t-2 border-ink px-6 py-10 text-sm">
        <div className="mx-auto flex max-w-4xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <span className="font-display text-lg font-extrabold">Launchify</span>
          <nav aria-label="Tautan footer" className="flex flex-wrap gap-x-6 gap-y-2 text-muted">
            <Link to="/" className="hover:underline">
              Beranda
            </Link>
            <Link to="/panduan" className="hover:underline">
              Panduan deploy
            </Link>
            <Link to="/register" className="hover:underline">
              Daftar
            </Link>
          </nav>
          <p className="text-muted">© 2026 Launchify. Dibangun untuk Projek UAS Pemrograman Framework.</p>
        </div>
      </footer>
    </div>
  );
}
