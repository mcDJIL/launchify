import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import { Wallet, Plus, Server, Play, Square, LogOut, Activity, Terminal } from 'lucide-react';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const navigate = useNavigate();
  
  // State untuk popup log docker
  const [logModal, setLogModal] = useState({ isOpen: false, projectName: '', logs: '', loading: false });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [userRes, projectsRes] = await Promise.all([
        api.get('/user'),
        api.get('/projects')
      ]);
      setUser(userRes.data);
      setProjects(projectsRes.data);
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('auth_token');
        navigate('/login');
      }
    }
  };

  const handleLogout = async () => {
    await api.post('/logout');
    localStorage.removeItem('auth_token');
    navigate('/login');
  };

  const handleDeployAction = async (projectId, action) => {
    try {
      await api.post(`/projects/${projectId}/deploy`, { action });
      fetchData(); 
      alert(`Berhasil melakukan ${action} pada server!`);
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal mengeksekusi perintah server.');
    }
  };

  const handleViewLogs = async (project) => {
    setLogModal({ isOpen: true, projectName: project.name, logs: '', loading: true });
    try {
      const res = await api.get(`/projects/${project.id}/logs`);
      setLogModal({ isOpen: true, projectName: project.name, logs: res.data.logs, loading: false });
    } catch (err) {
      setLogModal({ isOpen: true, projectName: project.name, logs: 'Gagal mengambil log dari server.', loading: false });
    }
  };

  if (!user) return <div className="p-10 text-center text-gray-500">Memuat Dashboard...</div>;

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800 relative">
      
      {/* Top Navbar */}
      <header className="bg-white border-b border-gray-200 px-8 py-4 flex justify-between items-center">
        <div className="text-xl font-bold text-blue-700 flex items-center gap-2">
          <Server className="w-6 h-6" /> SudoPaaS
        </div>
        <div className="flex items-center gap-4">
          {user.role === 'admin' && (
            <Link to="/admin" className="px-4 py-1.5 bg-indigo-100 text-indigo-700 text-sm font-bold rounded-lg hover:bg-indigo-200 transition">
              Panel Admin
            </Link>
          )}
          <span className="text-gray-600 font-medium text-sm">Halo, {user.name}</span>
          <button onClick={handleLogout} className="text-red-500 hover:text-red-700 flex items-center gap-1 text-sm font-semibold">
            <LogOut className="w-4 h-4" /> Keluar
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-10">
        
        {/* Wallet Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center mb-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
              <Wallet className="w-8 h-8" />
            </div>
            <div>
              <p className="text-gray-500 text-sm font-medium">Saldo Pay-As-You-Go</p>
              <h2 className="text-3xl font-bold text-gray-900">
                Rp {parseFloat(user.wallet_balance).toLocaleString('id-ID')}
              </h2>
            </div>
          </div>
          <Link to="/topup" className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition flex items-center gap-2">
            <Plus className="w-5 h-5" /> Top Up Saldo
          </Link>
        </div>

        {/* Projects Section */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-gray-900">Aplikasi Saya</h3>
          <Link to="/projects/create" className="px-4 py-2 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition text-sm">
            + Buat Project Baru
          </Link>
        </div>

        {projects.length === 0 ? (
          <div className="text-center py-20 bg-white border border-gray-200 rounded-2xl border-dashed">
            <Activity className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">Kamu belum mendaftarkan aplikasi apapun.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((proj) => {
              // Hasilkan nama domain aman dari nama project (huruf kecil, hapus spasi/simbol)
              const cleanName = proj.name.toLowerCase().replace(/[^a-z0-9-]/g, '');
              const projectUrl = `https://${cleanName}.app.launchify.site`;

              return (
                <div key={proj.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="text-lg font-bold text-gray-900">{proj.name}</h4>
                    <span className={`text-xs px-2 py-1 rounded font-semibold uppercase ${
                      proj.status === 'active' ? 'bg-green-100 text-green-700' :
                      proj.status === 'suspended' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {proj.status}
                    </span>
                  </div>
                  
                  <div className="text-sm text-gray-600 mb-6 space-y-2 flex-1">
                    {/* Tampilkan URL jika container sedang menyala */}
                    {proj.status === 'active' && (
                      <p className="truncate bg-blue-50 p-2 rounded border border-blue-100 mb-3">
                        <strong>URL:</strong>{' '}
                        <a href={projectUrl} target="_blank" rel="noreferrer" className="text-blue-700 font-semibold hover:underline">
                          {projectUrl}
                        </a>
                      </p>
                    )}
                    <p><strong>Port User:</strong> {proj.docker_port} (Internal)</p>
                    <p className="truncate"><strong>Repo:</strong> {proj.github_url}</p>
                    {/* Ambil harga langsung dari database project */}
                    <p><strong>Biaya:</strong> Rp {proj.hourly_rate}/jam</p>
                  </div>

                  <div className="flex gap-2 border-t pt-4 mt-auto">
                    {proj.status !== 'active' ? (
                      <button onClick={() => handleDeployAction(proj.id, 'start')} className="flex-1 flex justify-center items-center gap-1 bg-green-50 text-green-700 py-2 rounded-lg font-semibold hover:bg-green-100 transition">
                        <Play className="w-4 h-4" /> Start
                      </button>
                    ) : (
                      <button onClick={() => handleDeployAction(proj.id, 'stop')} className="flex-1 flex justify-center items-center gap-1 bg-red-50 text-red-700 py-2 rounded-lg font-semibold hover:bg-red-100 transition">
                        <Square className="w-4 h-4" /> Stop
                      </button>
                    )}
                    <button onClick={() => handleViewLogs(proj)} className="flex-1 flex justify-center items-center gap-1 bg-gray-100 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-200 transition">
                      <Terminal className="w-4 h-4" /> Logs
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Log Modal / Terminal Mini */}
      {logModal.isOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-gray-900 w-full max-w-3xl rounded-xl shadow-2xl overflow-hidden border border-gray-700 flex flex-col max-h-[80vh]">
            <div className="bg-gray-800 px-4 py-3 flex justify-between items-center border-b border-gray-700">
              <div className="flex items-center gap-2">
                <Terminal className="w-5 h-5 text-gray-400" />
                <h3 className="text-gray-200 font-semibold font-mono text-sm">
                  {logModal.projectName} - Server Logs
                </h3>
              </div>
              <button onClick={() => setLogModal({ ...logModal, isOpen: false })} className="text-gray-400 hover:text-white transition">
                ✕
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1 bg-black">
              {logModal.loading ? (
                <p className="text-green-500 font-mono animate-pulse">Mengambil log dari Oracle VPS...</p>
              ) : (
                <pre className="text-green-400 font-mono text-xs whitespace-pre-wrap leading-relaxed">
                  {logModal.logs}
                </pre>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}