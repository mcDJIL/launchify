import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Server, ArrowLeft, Calculator, FolderGit2 } from 'lucide-react';
import api from '../utils/api';

export default function CreateProject() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [plans, setPlans] = useState([]);
  
  const [form, setForm] = useState({
    name: '', github_url: '', root_directory: '', docker_port: '80', 
    framework: 'html', db_type: 'none', 
    db_name: '', db_user: '', db_password: '', custom_env: ''
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
  const frameworkPlans = plans.filter(p => p.type === 'framework');
  const dbPlans = plans.filter(p => p.type === 'database');

  // Helper untuk menghitung total rate secara live
  const getPrice = (type, code) => {
    const plan = plans.find(p => p.type === type && p.code === code);
    return plan ? parseFloat(plan.price_per_hour) : 0;
  };

  const currentHourlyRate = getPrice('framework', form.framework) + getPrice('database', form.db_type);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleDbChange = (e) => {
    const type = e.target.value;
    if (type === 'none') {
      setForm({ ...form, db_type: type, db_name: '', db_user: '', db_password: '' });
    } else {
      const randomSuffix = Math.random().toString(36).substring(2, 8);
      setForm({ 
        ...form, db_type: type, 
        db_name: `db_${randomSuffix}`, db_user: `user_${randomSuffix}`, db_password: Math.random().toString(36).slice(-10) + 'Xy!'
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api.post('/projects', { ...form, root_directory: form.root_directory || null });
      alert('Project berhasil didaftarkan!');
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal membuat project.');
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
            
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Nama Project (Tanpa Spasi)</label>
                <input type="text" name="name" required placeholder="misal: api-tugas-akhir" className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" value={form.name} onChange={handleChange} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Internal Docker Port</label>
                <input type="number" name="docker_port" required placeholder="misal: 8000" className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" value={form.docker_port} onChange={handleChange} />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2"><FolderGit2 className="w-4 h-4" /> URL Repositori GitHub</label>
                <input type="url" name="github_url" required placeholder="https://github.com/mcDJIL/repo-kamu" className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" value={form.github_url} onChange={handleChange} />
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Folder Aplikasi di Repositori (Opsional)</label>
              <input type="text" name="root_directory" placeholder="misal: frontend atau backend (kosongkan jika di root)" className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" value={form.root_directory} onChange={handleChange} />
            </div>

            {/* Pilihan Framework Otomatis dari Database */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Pilih Framework / Bahasa</label>
              <select name="framework" required className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white" value={form.framework} onChange={handleChange}>
                {frameworkPlans.length === 0 ? <option value="html">Loading data...</option> : null}
                {frameworkPlans.map((plan) => (
                  <option key={plan.id} value={plan.code}>
                    {plan.name} (Rp {plan.price_per_hour}/jam)
                  </option>
                ))}
              </select>
            </div>

            {/* Pilihan Database Otomatis dari Database */}
            <div className="md:col-span-2 bg-gray-50 p-6 rounded-xl border border-gray-200 mt-4">
              <label className="block text-sm font-semibold text-gray-700 mb-4">Integrasi Database (Opsional)</label>
              <div className="flex gap-6 mb-4">
                {dbPlans.length === 0 ? <span className="text-gray-500">Loading data...</span> : null}
                {dbPlans.map((plan) => (
                  <label key={plan.id} className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700">
                    <input type="radio" name="db_type" value={plan.code} checked={form.db_type === plan.code} onChange={handleDbChange} /> 
                    {plan.name} (+Rp {plan.price_per_hour})
                  </label>
                ))}
              </div>

              {form.db_type !== 'none' && (
                <div className="grid grid-cols-3 gap-4 text-sm text-gray-600 bg-white p-4 rounded-lg border border-gray-100 shadow-inner">
                  <div><strong>DB Name:</strong><br/><span className="font-mono text-blue-600">{form.db_name}</span></div>
                  <div><strong>DB User:</strong><br/><span className="font-mono text-blue-600">{form.db_user}</span></div>
                  <div><strong>DB Password:</strong><br/><span className="font-mono text-blue-600">{form.db_password}</span></div>
                </div>
              )}
            </div>

            <div className="md:col-span-2 mt-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Environment Variables (.env)</label>
              <textarea name="custom_env" rows="4" placeholder="APP_NAME=TugasAkhirKu&#10;API_KEY=sk_test_12345" className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm bg-gray-50" value={form.custom_env} onChange={handleChange}></textarea>
            </div>
          </div>

          {/* Section 2: Estimasi Harga Live */}
          <div className="bg-blue-600 text-white p-8 rounded-2xl shadow-md flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2 mb-2">
                <Calculator className="w-6 h-6" /> Estimasi Biaya
              </h2>
              <p className="text-blue-100 text-sm">
                Berdasarkan kombinasi infrastruktur yang dipilih.
              </p>
            </div>
            <div className="text-right">
              <span className="text-4xl font-extrabold">Rp {currentHourlyRate}</span>
              <span className="text-blue-200">/jam</span>
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <button type="submit" disabled={loading} className="px-8 py-4 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition disabled:opacity-70">
              {loading ? 'Menyimpan...' : 'Daftarkan Aplikasi'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
