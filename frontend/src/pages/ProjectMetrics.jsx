import { useState, useEffect, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Activity,
  Cpu,
  MemoryStick,
  Network,
  HardDrive,
  RefreshCw,
  Play,
  Square,
  RotateCw,
  Hammer,
  ExternalLink,
} from 'lucide-react';
import api from '../utils/api';
import AppLayout from '../components/AppLayout';
import { useAuth } from '../context/auth';

const CONTAINER_STATUS = {
  running: { label: 'Berjalan', className: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200' },
  exited: { label: 'Berhenti', className: 'bg-paper text-ink' },
  created: { label: 'Baru dibuat', className: 'bg-paper text-ink' },
  restarting: { label: 'Restarting', className: 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200' },
  paused: { label: 'Paused', className: 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200' },
  dead: { label: 'Dead', className: 'bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-200' },
  not_found: { label: 'Belum dibuat', className: 'bg-paper text-ink' },
  unknown: { label: 'Tidak diketahui', className: 'bg-paper text-ink' },
};

const PROJECT_STATUS = {
  active: { label: 'Aktif', className: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200' },
  suspended: { label: 'Suspended', className: 'bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-200' },
  stopped: { label: 'Berhenti', className: 'bg-paper text-ink' },
};

const MAX_SAMPLES = 24;
const POLL_MS = 5000;

function Sparkline({ values }) {
  if (values.length < 2) {
    return (
      <div className="flex h-20 items-center justify-center rounded-xl border-2 border-dashed border-hair text-xs text-muted">
        Menunggu sampel berikutnya...
      </div>
    );
  }

  const points = values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * 100;
      const y = 32 - (Math.min(value, 100) / 100) * 30;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(' ');

  return (
    <svg viewBox="0 0 100 32" preserveAspectRatio="none" className="h-20 w-full" aria-hidden="true">
      <line x1="0" y1="31" x2="100" y2="31" className="stroke-hair" strokeWidth="0.5" />
      <polyline
        points={points}
        fill="none"
        className="stroke-ink"
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

function UsageBar({ value, tone = 'ink' }) {
  const width = Math.min(100, Math.max(0, value || 0));
  const barClass = tone === 'danger' ? 'bg-danger' : 'bg-ink';
  return (
    <div className="mt-3 h-3 w-full overflow-hidden rounded-full border-2 border-ink bg-paper">
      <div className={`h-full ${barClass}`} style={{ width: `${width}%` }} />
    </div>
  );
}

export default function ProjectMetrics() {
  const { id } = useParams();
  const { logout } = useAuth();
  const [data, setData] = useState(null);
  const [samples, setSamples] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchMetrics = useCallback(async () => {
    try {
      const res = await api.get(`/projects/${id}/metrics`);
      setData(res.data);
      setError(null);
      if (res.data.stats) {
        setSamples((prev) => [
          ...prev,
          { cpu: res.data.stats.cpu_percent, mem: res.data.stats.mem_percent },
        ].slice(-MAX_SAMPLES));
      }
    } catch (err) {
      if (err.response?.status === 401) {
        logout();
        return;
      }
      setError(err.response?.data?.message || 'Gagal mengambil metrik container.');
    } finally {
      setLoading(false);
    }
  }, [id, logout]);

  useEffect(() => {
    let active = true;

    // Reset grafik saat pindah ke project lain.
    setSamples([]);

    const tick = () => {
      if (active) fetchMetrics();
    };

    tick();
    const timer = setInterval(tick, POLL_MS);

    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [fetchMetrics]);

  const handleAction = async (action) => {
    const messages = {
      stop: 'Hentikan container sekarang? Aplikasi tidak bisa diakses sampai di-start lagi.',
      restart: 'Restart container sekarang?',
      build: 'Rebuild akan menghapus folder project di server lalu clone ulang dari GitHub. Lanjutkan?',
      start: 'Nyalakan container sekarang?',
    };

    if (['stop', 'restart', 'build'].includes(action) && !window.confirm(messages[action])) {
      return;
    }

    setActionLoading(action);
    try {
      await api.post(`/projects/${id}/deploy`, { action });
      await fetchMetrics();
    } catch (err) {
      alert(err.response?.data?.message || `Gagal menjalankan aksi ${action}.`);
    } finally {
      setActionLoading(null);
    }
  };

  const containerStatus = data?.container?.status ?? 'unknown';
  const statusMeta = CONTAINER_STATUS[containerStatus] || CONTAINER_STATUS.unknown;
  const projectMeta = PROJECT_STATUS[data?.project?.status] || PROJECT_STATUS.stopped;
  const isRunning = containerStatus === 'running';
  const stats = data?.stats;

  return (
    <AppLayout active="dashboard">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <Link to={`/projects/${id}`} aria-label="Kembali ke detail project" className="icon-btn">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-muted">Resource &amp; container</p>
            <h1 className="font-display truncate text-3xl font-extrabold tracking-tight">
              {data?.project?.name || 'Memuat project...'}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`rounded-md px-2.5 py-1 text-xs font-bold uppercase ${projectMeta.className}`}>
            {projectMeta.label}
          </span>
          <button type="button" onClick={fetchMetrics} className="btn-secondary px-4 py-2.5 text-sm">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Muat ulang
          </button>
        </div>
      </div>

      {error && (
        <div role="alert" className="mt-6 rounded-xl border-2 border-danger p-4 text-sm font-semibold text-danger">
          {error}
        </div>
      )}

      {/* Status container + aksi cepat */}
      <section className="mt-8 grid gap-6 rounded-3xl border-2 border-ink bg-ink p-8 text-paper shadow-block md:grid-cols-[1fr_auto] md:items-center md:p-10">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold opacity-85">
            <Activity className="h-4 w-4" /> Status container
          </p>
          <p className="font-display mt-2 text-4xl font-extrabold">{statusMeta.label}</p>
          <p className="mt-2 font-mono text-xs opacity-70">
            {data?.container?.name || 'app_...'}
            {data?.container?.health ? ` · health: ${data.container.health}` : ''}
            {data?.sampled_at ? ` · sampel ${new Date(data.sampled_at).toLocaleTimeString('id-ID')}` : ''}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {isRunning ? (
            <button
              type="button"
              onClick={() => handleAction('stop')}
              disabled={!!actionLoading}
              className="btn-secondary px-4 py-3 text-sm text-danger"
            >
              <Square className="h-4 w-4" /> Stop
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleAction('start')}
              disabled={!!actionLoading}
              className="btn-primary px-4 py-3 text-sm"
            >
              <Play className="h-4 w-4" /> Start
            </button>
          )}
          <button
            type="button"
            onClick={() => handleAction('restart')}
            disabled={!!actionLoading}
            className="btn-secondary px-4 py-3 text-sm"
          >
            <RotateCw className={`h-4 w-4 ${actionLoading === 'restart' ? 'animate-spin' : ''}`} /> Restart
          </button>
          <button
            type="button"
            onClick={() => handleAction('build')}
            disabled={!!actionLoading}
            className="btn-secondary px-4 py-3 text-sm"
          >
            <Hammer className="h-4 w-4" /> Rebuild
          </button>
        </div>
      </section>

      {!isRunning && (
        <div className="mt-6 rounded-xl border-2 border-hair bg-surface p-4 text-sm text-muted">
          Container sedang tidak berjalan. Grafik CPU/RAM hanya tersedia saat container berstatus <strong>running</strong>.
          {data?.project?.status === 'suspended' && ' Project di-suspend karena saldo tidak mencukupi.'}
        </div>
      )}

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <section className="card p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="flex items-center gap-2 text-sm font-semibold text-muted">
                <Cpu className="h-4 w-4" /> CPU
              </p>
              <p className="font-display mt-2 text-4xl font-extrabold tabular-nums">
                {(stats?.cpu_percent ?? 0).toFixed(2)}<span className="text-xl">%</span>
              </p>
            </div>
            <span className="rounded-md border-2 border-ink px-2 py-1 text-xs font-bold">live</span>
          </div>
          <UsageBar value={stats?.cpu_percent} />
          <div className="mt-4">
            <Sparkline values={samples.map((sample) => sample.cpu)} />
            <p className="mt-1 text-xs text-muted">24 sampel terakhir · diperbarui tiap 5 detik</p>
          </div>
        </section>

        <section className="card p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="flex items-center gap-2 text-sm font-semibold text-muted">
                <MemoryStick className="h-4 w-4" /> RAM
              </p>
              <p className="font-display mt-2 text-4xl font-extrabold tabular-nums">
                {(stats?.mem_percent ?? 0).toFixed(2)}<span className="text-xl">%</span>
              </p>
            </div>
            <span className="text-right text-xs text-muted">
              {stats?.mem_used || '—'} / {stats?.mem_limit || '—'}
            </span>
          </div>
          <UsageBar value={stats?.mem_percent} tone="danger" />
          <div className="mt-4">
            <Sparkline values={samples.map((sample) => sample.mem)} />
            <p className="mt-1 text-xs text-muted">Pemakaian memori container</p>
          </div>
        </section>

        <section className="card p-6">
          <p className="flex items-center gap-2 text-sm font-semibold text-muted">
            <Network className="h-4 w-4" /> Network I/O
          </p>
          <p className="font-display mt-3 text-2xl font-extrabold tabular-nums">{stats?.net_io || '—'}</p>
        </section>

        <section className="card p-6">
          <p className="flex items-center gap-2 text-sm font-semibold text-muted">
            <HardDrive className="h-4 w-4" /> Block I/O
          </p>
          <p className="font-display mt-3 text-2xl font-extrabold tabular-nums">{stats?.block_io || '—'}</p>
        </section>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link to={`/projects/${id}`} className="btn-secondary px-5 py-3 text-sm">
          Detail project
        </Link>
        <a
          href={`https://${(data?.project?.name || '').toLowerCase().replace(/[^a-z0-9-]/g, '')}.app.launchify.site`}
          target="_blank"
          rel="noreferrer"
          className="btn-secondary px-5 py-3 text-sm"
        >
          Buka aplikasi <ExternalLink className="h-4 w-4" />
        </a>
      </div>
    </AppLayout>
  );
}
