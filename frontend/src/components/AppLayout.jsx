import { Link } from 'react-router-dom';
import { LayoutDashboard, LogOut, ShieldCheck, Wallet } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import Seo from './Seo';
import { useAuth } from '../context/auth';
import logo from '../assets/logo.png';

const USER_NAV = [
  { key: 'dashboard', to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'topup', to: '/topup', label: 'Top-up saldo', icon: Wallet },
];

const ADMIN_NAV = [
  { key: 'admin', to: '/admin', label: 'Dashboard admin', icon: ShieldCheck },
];

/**
 * Kerangka halaman setelah login: sidebar, navigasi mobile, dan footer.
 * Menu menyesuaikan role user yang sedang aktif.
 */
export default function AppLayout({ active, width = 'max-w-6xl', children }) {
  const { user, logout } = useAuth();
  const isAdmin = user?.role === 'admin';
  const navItems = isAdmin ? ADMIN_NAV : USER_NAV;
  const homePath = isAdmin ? '/admin' : '/dashboard';
  const roleLabel = isAdmin ? 'Administrator' : 'User';

  const initials = (user?.name || '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');

  return (
    <div className="flex min-h-screen bg-paper font-sans text-ink">
      <Seo title="Dashboard" noindex />
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col overflow-y-auto border-r-2 border-ink bg-surface md:flex">
        <div className="flex h-20 items-center border-b-2 border-ink px-6">
          <Link to={homePath} className="font-display text-2xl font-extrabold tracking-tight flex items-center gap-2">
            <img src={logo} alt="Logo" className="h-8 w-8" />
            Launchify
          </Link>
        </div>

        <nav aria-label="Menu utama" className="flex-1 space-y-2 p-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = active === item.key;
            return (
              <Link
                key={item.key}
                to={item.to}
                aria-current={isActive ? 'page' : undefined}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 font-semibold ${
                  isActive
                    ? 'border-2 border-ink bg-accent text-on-accent'
                    : 'hover:bg-paper'
                }`}
              >
                <Icon className="h-5 w-5" /> {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="space-y-3 border-t-2 border-ink p-4">
          {user && (
            <div className="flex items-center gap-3 px-2">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-ink bg-paper text-sm font-bold">
                {initials}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold">{user.name}</p>
                <p className="truncate text-xs text-muted">{roleLabel}</p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={logout}
              className="flex flex-1 items-center gap-3 rounded-xl px-4 py-3 font-semibold text-danger hover:bg-paper"
            >
              <LogOut className="h-5 w-5" /> Keluar
            </button>
            <ThemeToggle />
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col md:pl-64">
        <header className="flex items-center justify-between gap-4 border-b-2 border-ink bg-surface px-6 py-4 md:hidden">
          <Link to={homePath} className="font-display text-xl font-extrabold tracking-tight">
            Launchify
          </Link>
          <ThemeToggle />
        </header>

        <nav
          aria-label="Menu utama mobile"
          className="flex gap-2 overflow-x-auto border-b-2 border-ink px-6 py-3 text-sm font-semibold md:hidden"
        >
          {navItems.map((item) => {
            const isActive = active === item.key;
            return (
              <Link
                key={item.key}
                to={item.to}
                aria-current={isActive ? 'page' : undefined}
                className={`shrink-0 rounded-xl border-2 border-ink px-4 py-2 ${
                  isActive ? 'bg-accent text-on-accent' : 'hover:bg-surface'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <main className="flex-1 px-6 py-8 md:px-10 md:py-12">
          <div className={`mx-auto ${width}`}>{children}</div>
        </main>

        <footer className="border-t-2 border-ink px-6 py-5 text-sm text-muted md:px-10">
          © 2026 Launchify. Dibangun oleh mcDJIL.
        </footer>
      </div>
    </div>
  );
}
