import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import AppLayout from '../components/AppLayout';
import { useAuth } from '../context/auth';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [projects, setProjects] = useState([]);

  // State untuk popup log docker
  const [logModal, setLogModal] = useState({ isOpen: false, projectName: '', logs: '', loading: false });
  const [updatingIds, setUpdatingIds] = useState([]);
  const [buildingIds, setBuildingIds] = useState([]);

  useEffect(() => {
    if (!logModal.isOpen) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setLogModal((m) => ({ ...m, isOpen: false }));
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [logModal.isOpen]);

  const fetchData = async () => {
    try {
      const res = await api.get('/projects');
      setProjects(res.data);
    } catch (err) {
      if (err.response?.status === 401) {
        logout();
      }
    }
  };

  // Muat daftar project sekali saat halaman dibuka.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDeployAction = async (projectId, action) => {
    try {
      await api.post(`/projects/${projectId}/deploy`, { action });
      fetchData();
      alert(`Berhasil melakukan ${action} pada server!`);
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal mengeksekusi perintah server.');
    }
  };

  const pollUpdate = async (projectId) => {
    try {
      const res = await api.get(`/projects/${projectId}`);
      const latest = [...(res.data.deployments || [])].sort((a, b) => b.id - a.id)[0];
      if (latest?.status === 'processing') {
        setTimeout(() => pollUpdate(projectId), 5000);
        return;
      }
      setUpdatingIds((ids) => ids.filter((id) => id !== projectId));
      fetchData();
      alert(latest?.status === 'success'
        ? 'Update berhasil.'
        : `Update gagal:\n${(latest?.log_output || '').slice(-800)}`);
    } catch {
      setUpdatingIds((ids) => ids.filter((id) => id !== projectId));
    }
  };

  const handleBuild = async (projectId) => {
    setBuildingIds((ids) => [...ids, projectId]);
    try {
      await api.post(`/projects/${projectId}/deploy`, { action: 'build' });
      alert('Build berhasil.');
    } catch (err) {
      alert(err.response?.data?.message || 'Build gagal.');
    } finally {
      setBuildingIds((ids) => ids.filter((id) => id !== projectId));
      fetchData();
    }
  };

  const handleUpdate = async (projectId) => {
    try {
      await api.post(`/projects/${projectId}/deploy`, { action: 'update' });
      setUpdatingIds((ids) => [...ids, projectId]);
      pollUpdate(projectId);
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal memulai update.');
    }
  };

  const handleViewLogs = async (project) => {
    setLogModal({ isOpen: true, projectName: project.name, logs: '', loading: true });
    try {
      const res = await api.get(`/projects/${project.id}/logs`);
      setLogModal({ isOpen: true, projectName: project.name, logs: res.data.logs, loading: false });
    } catch {
      setLogModal({ isOpen: true, projectName: project.name, logs: 'Gagal mengambil log dari server.', loading: false });
    }
  };

  return (
    <AppLayout active="dashboard">
      <section className="grid gap-6 rounded-3xl border-2 border-ink bg-ink p-8 text-paper shadow-block md:grid-cols-[1fr_auto] md:items-center md:p-10">
        <div>
          <p className="text-sm font-semibold opacity-85">Saldo pay-as-you-go</p>
          <p className="font-display mt-2 text-5xl font-extrabold tabular-nums md:text-6xl">
            Rp {parseFloat(user?.wallet_balance ?? 0).toLocaleString('id-ID')}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link to="/topup" className="btn-primary px-6 py-4 text-lg">
            Top up saldo
          </Link>
          <Link to="/transactions" className="btn-secondary px-6 py-4 text-lg">
            Billing &amp; Wallet
          </Link>
        </div>
      </section>

      <div className="mt-14 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl font-extrabold tracking-tight">Aplikasi saya</h2>
          <p className="mt-1 text-muted">{projects.length} project terdaftar</p>
        </div>
        <Link to="/projects/create" className="btn-secondary px-5 py-3 text-sm">
          Buat project baru
        </Link>
      </div>

      {projects.length === 0 ? (
        <div className="mt-8 rounded-2xl border-2 border-dashed border-ink p-10 text-center">
          <p className="font-display text-2xl font-bold">Belum ada aplikasi.</p>
          <p className="mx-auto mt-2 max-w-md text-muted">
            Daftarkan repositori GitHub pertamamu. Setelah itu, build dan start langsung dari sini.
          </p>
          <Link to="/projects/create" className="btn-primary mt-6 px-5 py-3 text-sm">
            Daftarkan repositori
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((proj) => {
            // Hasilkan nama domain aman dari nama project (huruf kecil, hapus spasi/simbol)
            const cleanName = proj.name.toLowerCase().replace(/[^a-z0-9-]/g, '');
            const projectUrl = `https://${cleanName}.app.launchify.site`;

            return (
              <article key={proj.id} className="card flex flex-col p-6">
                <div className="flex items-start justify-between gap-4">
                  <Link
                    to={`/projects/${proj.id}`}
                    className="min-w-0 break-all font-display text-xl font-bold underline-offset-4 hover:underline"
                  >
                    {proj.name}
                  </Link>
                  <span className={`shrink-0 rounded-md px-2.5 py-1 text-xs font-bold uppercase ${
                    proj.status === 'active' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                    proj.status === 'suspended' ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300' : 'bg-paper text-ink'
                  }`}>
                    {proj.status}
                  </span>
                </div>

                <dl className="mt-5 flex-1 space-y-3 text-sm">
                  {/* Tampilkan URL jika container sedang menyala */}
                  {proj.status === 'active' && (
                    <div className="rounded-xl border-2 border-ink bg-accent p-3 text-on-accent">
                      <dt className="text-xs font-bold tracking-wide uppercase">URL live</dt>
                      <dd className="mt-1 truncate font-semibold">
                        <a href={projectUrl} target="_blank" rel="noreferrer" className="underline underline-offset-4">
                          {projectUrl}
                        </a>
                      </dd>
                    </div>
                  )}
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted">Port internal</dt>
                    <dd className="font-semibold">{proj.docker_port}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted">Biaya</dt>
                    {/* Ambil harga langsung dari database project */}
                    <dd className="font-semibold">Rp {proj.hourly_rate}/jam</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="shrink-0 text-muted">Repo</dt>
                    <dd className="min-w-0 truncate font-semibold">{proj.github_url}</dd>
                  </div>
                </dl>

                <div className="mt-6 flex flex-wrap gap-2 border-t-2 border-ink pt-5">
                  {proj.status !== 'active' ? (
                    <button onClick={() => handleDeployAction(proj.id, 'start')} className="btn-primary min-w-[8rem] flex-1 py-2.5 text-sm">
                      Start
                    </button>
                  ) : (
                    <button onClick={() => handleDeployAction(proj.id, 'stop')} className="btn-secondary min-w-[8rem] flex-1 py-2.5 text-sm text-danger">
                      Stop
                    </button>
                  )}
                  {proj.status !== 'active' && (
                    <button onClick={() => handleBuild(proj.id)} disabled={buildingIds.includes(proj.id)} className="btn-secondary min-w-[8rem] flex-1 py-2.5 text-sm">
                      {buildingIds.includes(proj.id) ? 'Building...' : 'Build'}
                    </button>
                  )}
                  <button onClick={() => handleUpdate(proj.id)} disabled={updatingIds.includes(proj.id)} className="btn-secondary min-w-[8rem] flex-1 py-2.5 text-sm">
                    {updatingIds.includes(proj.id) ? 'Updating...' : 'Update'}
                  </button>
                  <button onClick={() => handleViewLogs(proj)} className="btn-secondary min-w-[8rem] flex-1 py-2.5 text-sm">
                    Logs
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {logModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Log server ${logModal.projectName}`}
            className="flex max-h-[80vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border-2 border-ink bg-[#0e1116] text-[#f3f0e8] shadow-block-lg"
          >
            <div className="flex items-center justify-between border-b-2 border-[#2c3440] px-5 py-4">
              <h3 className="font-mono text-sm font-semibold">{logModal.projectName} - Server logs</h3>
              <button
                type="button"
                onClick={() => setLogModal({ ...logModal, isOpen: false })}
                className="rounded-lg border-2 border-[#2c3440] px-3 py-1.5 text-sm font-semibold hover:bg-[#171c24] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c7f464]"
              >
                Tutup
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              {logModal.loading ? (
                <p className="animate-pulse font-mono text-sm text-accent">Mengambil log dari server...</p>
              ) : (
                <pre className="font-mono text-xs leading-relaxed whitespace-pre-wrap text-accent">
                  {logModal.logs}
                </pre>
              )}
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
