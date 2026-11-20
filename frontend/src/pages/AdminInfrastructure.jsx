import { useState, useEffect, useCallback } from 'react';
import { Server, HardDrive, MemoryStick, RefreshCw, Square, Activity, Network } from 'lucide-react';
import api from '../utils/api';
import AppLayout from '../components/AppLayout';
import { useAuth } from '../context/auth';

function Gauge({ value, label, detail, tone = 'ink' }) {
  const width = Math.min(100, Math.max(0, value || 0));
  return (
    <div className="card p-6">
      <p className="flex items-center gap-2 text-sm font-semibold text-muted">{label}</p>
      <p className="font-display mt-2 text-4xl font-extrabold tabular-nums">{value ?? 0}<span className="text-xl">%</span></p>
      <p className="mt-1 text-sm text-muted">{detail}</p>
      <div className="mt-4 h-3 w-full overflow-hidden rounded-full border-2 border-ink bg-paper">
        <div className={`h-full ${tone === 'danger' ? 'bg-danger' : 'bg-ink'}`} style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

export default function AdminInfrastructure() {
  const { logout } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyName, setBusyName] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await api.get('/admin/infrastructure');
      setData(res.data);
      setError(null);
    } catch (err) {
      if (err.response?.status === 401) {
        logout();
        return;
      }
      setError(err.response?.data?.message || 'Gagal mengambil data infrastruktur.');
    } finally {
      setLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    let active = true;
    const tick = () => {
      if (active) fetchData();
    };
    tick();
    const timer = setInterval(tick, 10000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [fetchData]);

  const handleStop = async (container) => {
    if (!window.confirm(`Hentikan container ${container.name}? Aplikasi terkait akan mati sampai di-start ulang.`)) return;

    setBusyName(container.name);
    setError(null);
    try {
      await api.post('/admin/containers/stop', { name: container.name });
      await fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menghentikan container.');
    } finally {
      setBusyName(null);
    }
  };

  const memory = data?.memory;
  const disk = data?.disk;

  return (
    <AppLayout active="admin-infra">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-extrabold tracking-tight">Infrastruktur VPS</h1>
          <p className="mt-2 text-muted">
            Kesehatan server {data?.host || '—'}, container aktif, dan alokasi port.
          </p>
        </div>
        <button type="button" onClick={fetchData} className="btn-secondary px-5 py-3 text-sm">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Muat ulang
        </button>
      </div>

      {error && (
        <div role="alert" className="mt-6 rounded-xl border-2 border-danger p-4 text-sm font-semibold text-danger">
          {error}
        </div>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Gauge
          value={memory?.percent}
          label={<><MemoryStick className="h-4 w-4" /> RAM</>}
          detail={memory ? `${memory.used_mb} MB / ${memory.total_mb} MB terpakai` : 'Data RAM tidak tersedia.'}
          tone="danger"
        />
        <Gauge
          value={disk?.percent}
          label={<><HardDrive className="h-4 w-4" /> Disk VPS</>}
          detail={disk ? `${disk.used_gb} GB / ${disk.total_gb} GB terpakai` : 'Data disk tidak tersedia.'}
        />
        <div className="card p-6">
          <p className="flex items-center gap-2 text-sm font-semibold text-muted">
            <Server className="h-4 w-4" /> Container aktif
          </p>
          <p className="font-display mt-2 text-4xl font-extrabold tabular-nums">{data?.containers?.length ?? 0}</p>
          <p className="mt-1 text-sm text-muted">
            Sampel {data?.sampled_at ? new Date(data.sampled_at).toLocaleTimeString('id-ID') : '—'} · auto-refresh 10 detik
          </p>
        </div>
      </div>

      <section className="mt-10">
        <h2 className="font-display text-2xl font-extrabold tracking-tight">Container Docker</h2>
        <div className="card mt-4 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b-2 border-ink bg-paper text-xs tracking-wide uppercase">
                  <th className="p-4 font-bold">Nama</th>
                  <th className="p-4 font-bold">Image</th>
                  <th className="p-4 font-bold">Status</th>
                  <th className="p-4 font-bold">CPU</th>
                  <th className="p-4 font-bold">RAM</th>
                  <th className="p-4 font-bold">Port</th>
                  <th className="p-4 text-right font-bold">Aksi darurat</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-ink">
                {loading ? (
                  <tr><td colSpan="7" className="p-8 text-center text-muted">Memuat container...</td></tr>
                ) : (data?.containers?.length ?? 0) === 0 ? (
                  <tr><td colSpan="7" className="p-8 text-center text-muted">Tidak ada container aktif atau Docker tidak dapat diakses.</td></tr>
                ) : (
                  data.containers.map((container) => {
                    const canStop = /^(app|db)_[0-9]+$/.test(container.name);
                    return (
                      <tr key={container.id} className="hover:bg-paper">
                        <td className="p-4 font-mono font-semibold">{container.name}</td>
                        <td className="p-4 text-muted">{container.image}</td>
                        <td className="p-4">
                          <span className="rounded-md bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-900 uppercase dark:bg-emerald-950 dark:text-emerald-200">
                            {container.status || container.state || 'running'}
                          </span>
                        </td>
                        <td className="p-4 tabular-nums">{container.cpu_percent !== null ? `${container.cpu_percent}%` : '—'}</td>
                        <td className="p-4 tabular-nums">{container.mem_usage || '—'}</td>
                        <td className="p-4 font-mono text-xs">{container.ports || '—'}</td>
                        <td className="p-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleStop(container)}
                            disabled={!canStop || busyName === container.name}
                            className="btn-secondary px-3 py-2 text-xs text-danger disabled:opacity-40"
                          >
                            <Square className="h-3.5 w-3.5" />
                            {busyName === container.name ? 'Menghentikan...' : 'Stop'}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display flex items-center gap-2 text-2xl font-extrabold tracking-tight">
          <Network className="h-5 w-5" /> Alokasi port
        </h2>
        <div className="card mt-4 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b-2 border-ink bg-paper text-xs tracking-wide uppercase">
                  <th className="p-4 font-bold">Project</th>
                  <th className="p-4 font-bold">Status</th>
                  <th className="p-4 font-bold">Host port</th>
                  <th className="p-4 font-bold">DB port</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-ink">
                {(data?.ports?.length ?? 0) === 0 ? (
                  <tr><td colSpan="4" className="p-8 text-center text-muted">Belum ada port yang dialokasikan.</td></tr>
                ) : (
                  data.ports.map((port) => (
                    <tr key={port.project} className="hover:bg-paper">
                      <td className="p-4 font-semibold">{port.project}</td>
                      <td className="p-4 text-muted">{port.status}</td>
                      <td className="p-4 font-mono">{port.host_port || '—'}</td>
                      <td className="p-4 font-mono">{port.db_port || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <div className="mt-8 flex items-start gap-3 rounded-xl border-2 border-hair bg-surface p-4 text-sm text-muted">
        <Activity className="mt-0.5 h-5 w-5 shrink-0" />
        <p>Tombol Stop hanya aktif untuk container Launchify (<code className="font-mono">app_&lt;id&gt;</code> / <code className="font-mono">db_&lt;id&gt;</code>).</p>
      </div>
    </AppLayout>
  );
}
