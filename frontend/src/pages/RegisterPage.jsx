import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import ThemeToggle from '../components/ThemeToggle';
import { useAuth } from '../context/auth';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', password_confirmation: '' });
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const response = await api.post('/register', form);
      login(response.data.access_token, response.data.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registrasi gagal. Pastikan email belum terdaftar dan password minimal 8 karakter.');
    }
  };

  return (
    <div className="grid min-h-screen bg-paper text-ink lg:grid-cols-2">
      <aside className="hidden flex-col justify-between bg-accent p-12 text-on-accent lg:flex">
        <Link to="/" className="font-display text-2xl font-extrabold tracking-tight">
          Launchify
        </Link>
        <p className="font-display max-w-md text-5xl leading-[1.05] font-extrabold">
          Buat akun gratis, lalu deploy aplikasi pertamamu hari ini.
        </p>
      </aside>

      <main className="flex flex-col px-6 py-6 md:px-10">
        <div className="flex items-center justify-between lg:justify-end">
          <Link to="/" className="font-display text-2xl font-extrabold tracking-tight lg:hidden">
            Launchify
          </Link>
          <ThemeToggle />
        </div>

        <div className="flex flex-1 items-center justify-center py-0">
          <div className="w-full max-w-md">
            <h1 className="font-display text-4xl font-extrabold tracking-tight">Buat akun Launchify</h1>
            <p className="mt-3 text-muted">Isi data diri dengan email kampusmu.</p>

            {error && (
              <div role="alert" className="mt-8 rounded-xl border-2 border-danger p-4 text-sm font-semibold text-danger">
                {error}
              </div>
            )}

            <form onSubmit={handleRegister} className="mt-8 space-y-5">
              <div>
                <label htmlFor="register-name" className="mb-2 block text-sm font-semibold">Nama lengkap</label>
                <input id="register-name" type="text" name="name" required autoComplete="name" onChange={handleChange} className="field" />
              </div>
              <div>
                <label htmlFor="register-email" className="mb-2 block text-sm font-semibold">Email</label>
                <input id="register-email" type="email" name="email" required autoComplete="email" onChange={handleChange} className="field" />
              </div>
              <div>
                <label htmlFor="register-password" className="mb-2 block text-sm font-semibold">Password</label>
                <input id="register-password" type="password" name="password" required autoComplete="new-password" onChange={handleChange} className="field" />
                <p className="mt-2 text-sm text-muted">Minimal 8 karakter.</p>
              </div>
              <div>
                <label htmlFor="register-password-confirmation" className="mb-2 block text-sm font-semibold">Konfirmasi password</label>
                <input id="register-password-confirmation" type="password" name="password_confirmation" required autoComplete="new-password" onChange={handleChange} className="field" />
              </div>
              <button type="submit" className="btn-primary w-full py-3.5 text-lg">
                Daftar sekarang
              </button>
            </form>

            <p className="mt-8 text-sm text-muted">
              Sudah punya akun?{' '}
              <Link to="/login" className="font-semibold text-ink underline underline-offset-4">
                Masuk
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
