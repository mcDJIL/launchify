import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, FolderGit2, Terminal } from 'lucide-react';
import api from '../utils/api';
import ThemeToggle from '../components/ThemeToggle';

export default function CreateProject() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [plans, setPlans] = useState([]);

  const [form, setForm] = useState({
    name: '',
    github_url: '',
    root_directory: '',
    release_command: '',
    docker_port: '80',
    framework: 'html',
    db_type: 'none',
    db_name: '',
    db_user: '',
    db_password: '',
    custom_env: ''
  });

  // Ambil data master tarif dari backend
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await api.get('/plans');
        setPlans(res.data);
      } catch (err) {
        console.error('Gagal mengambil data master tarif.', err);
      }
    };
    fetchPlans();
  }, []);

  // Pisahkan data berdasarkan tipe
  const frameworkPlans = plans.filter((p) => p.type === 'framework');
  const dbPlans = plans.filter((p) => p.type === 'database');

  // Helper untuk menghitung total rate per jam secara live
  const getPrice = (type, code) => {
    const plan = plans.find((p) => p.type === type && p.code === code);
    return plan ? parseFloat(plan.price_per_hour) : 0;
  };

  const currentHourlyRate = getPrice('framework', form.framework) + getPrice('database', form.db_type);
  const currentDailyRate = Math.round(currentHourlyRate * 24);

  const isStandardWebPort = ['laravel', 'html', 'react', 'vue'].includes(form.framework);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'framework') {
      const autoPort = ['laravel', 'html', 'react', 'vue'].includes(value)
        ? '80'
        : value === 'express'
        ? '3000'
        : value === 'golang'
        ? '8080'
        : '80';

      setForm({ ...form, framework: value, docker_port: autoPort });
      return;
    }

    setForm({ ...form, [name]: value });
  };

  const handleDbChange = (e) => {
    const type = e.target.value;
    if (type === 'none') {
      setForm({ ...form, db_type: type, db_name: '', db_user: '', db_password: '' });
    } else {
      const randomSuffix = Math.random().toString(36).substring(2, 8);
      setForm({
        ...form,
        db_type: type,
        db_name: `db_${randomSuffix}`,
        db_user: `user_${randomSuffix}`,
        db_password: Math.random().toString(36).slice(-10) + 'Xy!'
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api.post('/projects', {
        ...form,
        root_directory: form.root_directory || null,
        release_command: form.release_command || null
      });
      alert('Project berhasil didaftarkan!');
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal membuat project.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper font-sans text-ink">
      <header className="sticky top-0 z-40 border-b-2 border-ink bg-paper">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4 md:px-10">
          <div className="flex min-w-0 items-center gap-4">
            <Link to="/dashboard" aria-label="Kembali ke dashboard" className="icon-btn">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="font-display truncate text-xl font-extrabold">Project baru</h1>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10 md:px-10">
        <div className="mb-10 max-w-2xl">
          <h2 className="font-display text-4xl font-extrabold tracking-tight md:text-5xl">Daftarkan repositori-mu.</h2>
          <p className="mt-3 text-lg text-muted">Isi detail aplikasi, pilih stack, lalu deploy dari dashboard.</p>
        </div>

        {error && (
          <div role="alert" className="mb-8 rounded-xl border-2 border-danger p-4 text-sm font-semibold text-danger">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-[1fr_22rem] lg:items-start">
          <div className="space-y-8">
            <section aria-labelledby="section-detail" className="card space-y-6 p-6 md:p-8">
              <h2 id="section-detail" className="font-display border-b-2 border-ink pb-3 text-2xl font-bold">Detail aplikasi</h2>

              <div className="grid gap-6 md:grid-cols-2">
                <div className={isStandardWebPort ? 'md:col-span-2' : ''}>
                  <label htmlFor="project-name" className="mb-2 block text-sm font-semibold">Nama project (tanpa spasi)</label>
                  <input
                    id="project-name"
                    type="text"
                    name="name"
                    required
                    placeholder="misal: api-tugas-akhir"
                    className="field"
                    value={form.name}
                    onChange={handleChange}
                  />
                </div>

                {!isStandardWebPort && (
                  <div>
                    <label htmlFor="project-port" className="mb-2 block text-sm font-semibold">Internal Docker port</label>
                    <input
                      id="project-port"
                      type="number"
                      name="docker_port"
                      required
                      placeholder="misal: 3000"
                      className="field"
                      value={form.docker_port}
                      onChange={handleChange}
                    />
                  </div>
                )}

                <div className="md:col-span-2">
                  <label htmlFor="project-github" className="mb-2 flex items-center gap-2 text-sm font-semibold">
                    <FolderGit2 className="h-4 w-4" /> URL repositori GitHub
                  </label>
                  <input
                    id="project-github"
                    type="url"
                    name="github_url"
                    required
                    placeholder="https://github.com/mcDJIL/repo-kamu"
                    className="field"
                    value={form.github_url}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label htmlFor="project-root" className="mb-2 block text-sm font-semibold">Folder aplikasi di repositori (opsional)</label>
                  <input
                    id="project-root"
                    type="text"
                    name="root_directory"
                    placeholder="misal: frontend atau backend (kosongkan jika di root)"
                    className="field"
                    value={form.root_directory}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label htmlFor="project-release" className="mb-2 flex items-center gap-2 text-sm font-semibold">
                    <Terminal className="h-4 w-4" /> Release command (opsional)
                  </label>
                  <input
                    id="project-release"
                    type="text"
                    name="release_command"
                    placeholder="misal: php artisan migrate --force"
                    className="field font-mono text-sm"
                    value={form.release_command}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="project-framework" className="mb-2 block text-sm font-semibold">Framework / bahasa</label>
                <select
                  id="project-framework"
                  name="framework"
                  required
                  className="field"
                  value={form.framework}
                  onChange={handleChange}
                >
                  {frameworkPlans.length === 0 ? <option value="html">Memuat data...</option> : null}
                  {frameworkPlans.map((plan) => (
                    <option key={plan.id} value={plan.code}>
                      {plan.name} (Rp {Math.round(Number(plan.price_per_hour) * 24).toLocaleString('id-ID')}/hari)
                    </option>
                  ))}
                </select>
              </div>
            </section>

            <section aria-labelledby="section-database" className="card space-y-6 p-6 md:p-8">
              <h2 id="section-database" className="font-display border-b-2 border-ink pb-3 text-2xl font-bold">Database</h2>

              <fieldset>
                <legend className="mb-4 text-sm font-semibold">Integrasi database (opsional)</legend>
                <div className="flex flex-wrap gap-3">
                  {dbPlans.length === 0 ? <span className="text-muted">Memuat data...</span> : null}
                  {dbPlans.map((plan) => (
                    <label
                      key={plan.id}
                      className="flex cursor-pointer items-center gap-3 rounded-xl border-2 border-ink bg-surface px-4 py-3 text-sm font-semibold has-[:checked]:bg-accent has-[:checked]:text-on-accent"
                    >
                      <input
                        type="radio"
                        name="db_type"
                        value={plan.code}
                        checked={form.db_type === plan.code}
                        onChange={handleDbChange}
                        className="h-4 w-4"
                      />
                      {plan.name}{' '}
                      <span className="font-semibold opacity-85">
                        {Number(plan.price_per_hour) === 0
                          ? '(Gratis)'
                          : `(+Rp ${Math.round(Number(plan.price_per_hour) * 24).toLocaleString('id-ID')}/hari)`}
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>

              {form.db_type !== 'none' && (
                <dl className="grid gap-4 rounded-xl border-2 border-ink bg-paper p-4 text-sm sm:grid-cols-3">
                  <div>
                    <dt className="font-semibold text-muted">DB name</dt>
                    <dd className="mt-1 font-mono font-semibold break-all">{form.db_name}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-muted">DB user</dt>
                    <dd className="mt-1 font-mono font-semibold break-all">{form.db_user}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-muted">DB password</dt>
                    <dd className="mt-1 font-mono font-semibold break-all">{form.db_password}</dd>
                  </div>
                </dl>
              )}
            </section>

            <section aria-labelledby="section-env" className="card p-6 md:p-8">
              <h2 id="section-env" className="font-display border-b-2 border-ink pb-3 text-2xl font-bold">Environment variables</h2>
              <label htmlFor="project-env" className="mt-6 mb-2 block text-sm font-semibold">Isi file .env</label>
              <textarea
                id="project-env"
                name="custom_env"
                rows="5"
                placeholder="APP_NAME=TugasAkhirKu&#10;API_KEY=sk_test_12345"
                className="field font-mono text-sm"
                value={form.custom_env}
                onChange={handleChange}
              ></textarea>
            </section>
          </div>

          <aside className="space-y-6 lg:sticky lg:top-24">
            <div className="rounded-2xl border-2 border-ink bg-ink p-6 text-paper shadow-block-lg">
              <p className="text-sm font-bold tracking-wide uppercase opacity-85">Estimasi biaya</p>
              <p className="font-display mt-3 text-5xl font-extrabold tabular-nums text-accent">
                Rp {currentDailyRate.toLocaleString('id-ID')}
                <span className="text-lg font-semibold text-paper opacity-85">/hari</span>
              </p>
              <p className="mt-3 text-sm opacity-85">Sudah termasuk container aplikasi dan database.</p>
              <p className="mt-5 border-t-2 border-paper/20 pt-4 text-xs opacity-85">
                Dipotong Rp {currentHourlyRate.toFixed(2)} per jam saat aktif.
              </p>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-4 text-lg">
              {loading ? 'Menyimpan...' : 'Daftarkan aplikasi'}
            </button>
          </aside>
        </form>
      </main>
    </div>
  );
}
