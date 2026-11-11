import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Server, ArrowLeft, Github, Cpu, HardDrive, Zap } from 'lucide-react';
import api from '../utils/api';

export default function CreateProject() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [form, setForm] = useState({
    name: '', plan_id: '', github_url: '', docker_port: '80', framework: 'html',
    db_type: 'none', db_name: '', db_user: '', db_password: '', custom_env: ''
});

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const res = await api.get('/plans');
      setPlans(res.data);
      // Set default plan jika data tersedia
      if (res.data.length > 0) {
        setForm(prev => ({ ...prev, plan_id: res.data[0].id }));
      }
    } catch (err) {
      console.error('Gagal mengambil data plans', err);
    }
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleDbChange = (e) => {
    const type = e.target.value;
    if (type === 'none') {
        setForm({ ...form, db_type: type, db_name: '', db_user: '', db_password: '' });
    } else {
        // Generate kredensial otomatis yang aman
        const randomSuffix = Math.random().toString(36).substring(2, 8);
        setForm({ 
        ...form, 
        db_type: type, 
        db_name: `db_${randomSuffix}`, 
        db_user: `user_${randomSuffix}`, 
        db_password: Math.random().toString(36).slice(-10) + 'Xy!' // Password kuat
        });
    }
 };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api.post('/projects', form);
      alert('Project berhasil didaftarkan! Silakan klik tombol Start di Dashboard untuk memulai deployment.');
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Terjadi kesalahan saat mendaftarkan project.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800 p-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link to="/dashboard" className="p-2 bg-white rounded-full shadow-sm hover:bg-gray-100 transition">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Server className="w-6 h-6 text-blue-700" /> Buat Project Baru
          </h1>
        </div>

        {error && <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg border border-red-100">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Section 1: Detail Aplikasi */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 mb-6 border-b pb-2">1. Detail Aplikasi</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Nama Project (Tanpa Spasi)</label>
                <input 
                  type="text" 
                  name="name" 
                  required
                  placeholder="misal: api-tugas-akhir"
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  value={form.name}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Internal Docker Port</label>
                <input 
                  type="number" 
                  name="docker_port" 
                  required
                  placeholder="misal: 8000"
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  value={form.docker_port}
                  onChange={handleChange}
                />
                <p className="text-xs text-gray-500 mt-1">Port tempat aplikasimu berjalan di dalam container (ex: Laravel = 8000).</p>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Github className="w-4 h-4" /> URL Repositori GitHub
                </label>
                <input 
                  type="url" 
                  name="github_url" 
                  required
                  placeholder="https://github.com/mcDJIL/repo-kamu"
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  value={form.github_url}
                  onChange={handleChange}
                />
                <p className="text-xs text-gray-500 mt-1">Pastikan repositori bersifat publik atau menyertakan akses token.</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Pilih Framework / Bahasa</label>
                <select 
                    name="framework" 
                    required
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    value={form.framework}
                    onChange={handleChange}>
                    <option value="html">HTML / CSS / JS Statis</option>
                    <option value="php">PHP Native</option>
                    <option value="laravel">Laravel</option>
                    <option value="express">Node.js (Express)</option>
                    <option value="react">React.js (Vite/CRA)</option>
                    <option value="vue">Vue.js</option>
                    <option value="golang">Golang</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">Sistem akan merakit environment secara otomatis berdasarkan pilihan ini.</p>
                </div>
                <div className="md:col-span-2 bg-gray-50 p-6 rounded-xl border border-gray-200 mt-4">
                <label className="block text-sm font-semibold text-gray-700 mb-4">Integrasi Database (Opsional)</label>
                <div className="flex gap-4 mb-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="db_type" value="none" checked={form.db_type === 'none'} onChange={handleDbChange} /> Tanpa Database
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="db_type" value="mysql" checked={form.db_type === 'mysql'} onChange={handleDbChange} /> MySQL 8
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="db_type" value="postgresql" checked={form.db_type === 'postgresql'} onChange={handleDbChange} /> PostgreSQL 15
                    </label>
                </div>

                {form.db_type !== 'none' && (
                    <div className="grid grid-cols-3 gap-4 text-sm text-gray-600 bg-white p-4 rounded-lg border border-gray-100 shadow-inner">
                    <div><strong>DB Name:</strong><br/><span className="font-mono text-blue-600">{form.db_name}</span></div>
                    <div><strong>DB User:</strong><br/><span className="font-mono text-blue-600">{form.db_user}</span></div>
                    <div><strong>DB Password:</strong><br/><span className="font-mono text-blue-600">{form.db_password}</span></div>
                    <p className="col-span-3 text-xs text-gray-400 mt-2">
                        *Kredensial ini otomatis disuntikkan ke environment aplikasi kamu (DB_HOST=db).
                    </p>
                    </div>
                )}
                </div>
                <div className="md:col-span-2 mt-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Environment Variables (.env)</label>
                    <textarea 
                        name="custom_env" 
                        rows="6"
                        placeholder="APP_NAME=TugasAkhirKu&#10;API_KEY=sk_test_12345&#10;APP_ENV=production"
                        className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm bg-gray-50"
                        value={form.custom_env}
                        onChange={handleChange}
                    ></textarea>
                    <p className="text-xs text-gray-500 mt-2">
                        Masukkan variabel khusus. Koneksi database (jika dipilih di atas) akan disuntikkan secara otomatis, jadi Anda tidak perlu menuliskannya di sini.
                    </p>
                </div>
            </div>
          </div>

          {/* Section 2: Pilih Spesifikasi */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 mb-6 border-b pb-2">2. Pilih Spesifikasi (Plan)</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {plans.map((plan) => (
                <label key={plan.id} className={`relative p-6 rounded-xl border-2 cursor-pointer transition-all ${
                  form.plan_id === plan.id ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
                }`}>
                  <input 
                    type="radio" 
                    name="plan_id" 
                    value={plan.id} 
                    className="hidden"
                    onChange={handleChange}
                    checked={form.plan_id === plan.id}
                  />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <div className="text-sm text-gray-600 space-y-2 mb-4">
                    <p className="flex items-center gap-2"><Cpu className="w-4 h-4"/> {plan.cpu_cores} Core CPU</p>
                    <p className="flex items-center gap-2"><Zap className="w-4 h-4"/> {plan.ram_mb} MB RAM</p>
                    <p className="flex items-center gap-2"><HardDrive className="w-4 h-4"/> {plan.storage_gb} GB SSD</p>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-200/60">
                    <p className="text-blue-700 font-bold text-lg">Rp {parseFloat(plan.price_per_hour).toLocaleString('id-ID')}<span className="text-sm font-normal text-gray-500">/jam</span></p>
                  </div>
                  
                  {/* Indikator Checklist */}
                  {form.plan_id === plan.id && (
                    <div className="absolute top-4 right-4 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xs shadow">
                      ✓
                    </div>
                  )}
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <button type="submit" disabled={loading} className="px-8 py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition disabled:opacity-70 flex items-center gap-2">
              {loading ? 'Menyimpan...' : 'Daftarkan Aplikasi'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}