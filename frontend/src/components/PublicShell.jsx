import PublicHeader from './PublicHeader';
import PublicFooter from './PublicFooter';

/**
 * Kerangka halaman publik (panduan & artikel).
 * Header dan footer sama persis dengan landing page agar navigasi konsisten.
 */
export default function PublicShell({ children }) {
  return (
    <div className="min-h-screen bg-paper font-sans text-ink">
      <PublicHeader />
      <main>{children}</main>
      <PublicFooter />
    </div>
  );
}
