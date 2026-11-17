import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import ThemeToggle from '../components/ThemeToggle';
import Seo from '../components/Seo';
import { useAuth } from '../context/auth';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const response = await api.post('/login', { email, password });
      // Simpan token dan user ke context agar route guard langsung mengenali role
      login(response.data.access_token, response.data.user);
      // Admin langsung diarahkan ke dashboard admin
      navigate(response.data.user?.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login gagal. Periksa kembali kredensial Anda.');
    }
  };

  return (
    <div className="grid min-h-screen bg-paper text-ink lg:grid-cols-2">
      <Seo title="Masuk ke Launchify" path="/login" noindex />
      <aside className="hidden flex-col justify-between bg-ink p-12 text-paper lg:flex">
        <Link to="/" className="font-display text-2xl font-extrabold tracking-tight">
          Launchify
        </Link>
        <p className="font-display max-w-md text-5xl leading-[1.05] font-extrabold">
          Masuk untuk melanjutkan deploy dan memantau project-mu.
        </p>
      </aside>

      <main className="flex flex-col px-6 py-6 md:px-10">
        <div className="flex items-center justify-between lg:justify-end">
          <Link to="/" className="font-display text-2xl font-extrabold tracking-tight lg:hidden">
            Launchify
          </Link>
          <ThemeToggle />
        </div>

        <div className="flex flex-1 items-center justify-center py-12">
          <div className="w-full max-w-md">
            <h1 className="font-display text-4xl font-extrabold tracking-tight">Masuk ke Launchify</h1>
            <p className="mt-3 text-muted">Gunakan email dan password yang sudah terdaftar.</p>

            {error && (
              <div role="alert" className="mt-8 rounded-xl border-2 border-danger p-4 text-sm font-semibold text-danger">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="mt-8 space-y-5">
              <div>
                <label htmlFor="login-email" className="mb-2 block text-sm font-semibold">Email</label>
                <input
                  id="login-email"
                  type="email"
                  required
                  autoComplete="email"
                  className="field"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="login-password" className="mb-2 block text-sm font-semibold">Password</label>
                <input
                  id="login-password"
                  type="password"
                  required
                  autoComplete="current-password"
                  className="field"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <button type="submit" className="btn-primary w-full py-3.5 text-lg">
                Masuk
              </button>
            </form>

            <p className="mt-8 text-sm text-muted">
              Belum punya akun?{' '}
              <Link to="/register" className="font-semibold text-ink underline underline-offset-4">
                Daftar di sini
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
