import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import logo from '../assets/logo.png';
import ThemeToggle from './ThemeToggle';
import api from '../utils/api';

const NAV_LINKS = [
  { label: 'Fitur', href: '/#fitur' },
  { label: 'Cara Kerja', href: '/#cara-kerja' },
  { label: 'Harga', href: '/#harga' },
  { label: 'FAQ', href: '/#faq' },
];

export default function PublicHeader() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      api
        .get('/user', { headers: { Authorization: `Bearer ${token}` } })
        .then((res) => setUser(res.data))
        .catch((err) => console.error('Gagal memuat data user:', err));
    }
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b-2 border-ink bg-paper">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4 md:px-0">
        <Link to="/" className="flex items-center gap-2.5 font-display text-2xl font-extrabold tracking-tight">
          <img src={logo} alt="Logo Launchify" className="h-12 w-12" />
          <span>Launchify</span>
        </Link>

        <nav aria-label="Navigasi halaman" className="hidden gap-8 text-sm font-semibold md:flex">
          {NAV_LINKS.map((link) => (
            <Link key={link.label} to={link.href} className="underline-offset-4 hover:underline">
              {link.label}
            </Link>
          ))}
          <Link to="/panduan" className="underline-offset-4 hover:underline">
            Panduan
          </Link>
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
  );
}
