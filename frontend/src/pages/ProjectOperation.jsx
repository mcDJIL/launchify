import React, { useState, useEffect } from 'react';
import { ExternalLink } from 'lucide-react';
import api from '../utils/api';

export default function ProjectOperations({ project }) {
  // State Console
  const [command, setCommand] = useState('');
  const [consoleOutput, setConsoleOutput] = useState('Siap menjalankan perintah di dalam container...');
  const [isRunning, setIsRunning] = useState(false);

  // State Cron
  const [crons, setCrons] = useState([]);
  const [cronName, setCronName] = useState('');
  const [cronSchedule, setCronSchedule] = useState('* * * * *');
  const [cronCommand, setCronCommand] = useState('');

  useEffect(() => {
    if (project?.id) {
      fetchCrons();
    }
  }, [project?.id]);

  const fetchCrons = async () => {
    try {
      const res = await api.get(`/projects/${project.id}/crons`);
      setCrons(res.data);
    } catch (err) {
      console.error('Gagal memuat cron jobs:', err);
    }
  };

  const handleRunCommand = async (customCmd) => {
    const cmdToRun = typeof customCmd === 'string' ? customCmd : command;
    if (!cmdToRun.trim()) return;

    setIsRunning(true);
    setConsoleOutput(`$ ${cmdToRun}\nMenjalankan perintah...`);
    try {
      const res = await api.post(`/projects/${project.id}/exec`, {
        command: cmdToRun,
      });
      setConsoleOutput(`$ ${cmdToRun}\n\n${res.data.output || 'Selesai tanpa output.'}`);
    } catch (err) {
      setConsoleOutput(`Error: ${err.response?.data?.message || err.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const handleAddCron = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/projects/${project.id}/crons`, {
        name: cronName,
        schedule: cronSchedule,
        command: cronCommand,
      });
      setCronName('');
      setCronCommand('');
      fetchCrons();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menambahkan cron job');
    }
  };

  const handleToggleCron = async (cronId) => {
    try {
      await api.patch(`/projects/${project.id}/crons/${cronId}/toggle`);
      fetchCrons();
    } catch (err) {
      console.error('Gagal mengubah status cron:', err);
    }
  };

  const handleDeleteCron = async (cronId) => {
    try {
      await api.delete(`/projects/${project.id}/crons/${cronId}`);
      fetchCrons();
    } catch (err) {
      console.error('Gagal menghapus cron:', err);
    }
  };

  const presetButtons = project.framework === 'laravel'
    ? [
        { label: 'Artisan migrate', cmd: 'php artisan migrate --force' },
        { label: 'Artisan seeder', cmd: 'php artisan db:seed --force' },
        { label: 'Storage link', cmd: 'php artisan storage:link' },
      ]
    : [
        { label: 'Prisma migrate', cmd: 'npx prisma migrate deploy' },
        { label: 'NPM run seed', cmd: 'npm run seed' },
      ];

  return (
    <div className="space-y-8">
      <section aria-labelledby="section-console" className="card p-6 md:p-8">
        <h2 id="section-console" className="font-display text-2xl font-bold">Web console</h2>
        <p className="mt-2 text-sm text-muted">
          Jalankan perintah langsung di dalam container aplikasi kamu, misalnya migrasi atau seeder.
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          {presetButtons.map((preset) => (
            <button
              key={preset.cmd}
              type="button"
              onClick={() => handleRunCommand(preset.cmd)}
              className="btn-secondary px-3 py-1.5 text-xs"
            >
              + {preset.label}
            </button>
          ))}
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            aria-label="Perintah yang akan dijalankan"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            placeholder="Ketik perintah, misal: php artisan migrate --force"
            className="field flex-1 font-mono text-sm"
          />
          <button
            type="button"
            onClick={() => handleRunCommand()}
            disabled={isRunning}
            className="btn-primary px-6 py-3 text-sm"
          >
            {isRunning ? 'Running...' : 'Run'}
          </button>
        </div>

        <pre className="mt-4 min-h-[140px] overflow-x-auto rounded-xl border-2 border-ink bg-[#0e1116] p-4 font-mono text-xs whitespace-pre-wrap text-accent">
          {consoleOutput}
        </pre>
      </section>

      <section aria-labelledby="section-cron" className="card p-6 md:p-8">
        <h2 id="section-cron" className="font-display text-2xl font-bold">Jadwal cron job</h2>

        <form onSubmit={handleAddCron} className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-4">
          <input
            type="text"
            required
            aria-label="Nama cron job"
            placeholder="Nama, misal: Laravel cron"
            value={cronName}
            onChange={(e) => setCronName(e.target.value)}
            className="field text-sm"
          />
          <input
            type="text"
            required
            aria-label="Jadwal cron"
            placeholder="Jadwal, misal: * * * * *"
            value={cronSchedule}
            onChange={(e) => setCronSchedule(e.target.value)}
            className="field font-mono text-sm"
          />
          <input
            type="text"
            required
            aria-label="Perintah cron"
            placeholder="Command, misal: php artisan schedule:run"
            value={cronCommand}
            onChange={(e) => setCronCommand(e.target.value)}
            className="field font-mono text-sm"
          />
          <button type="submit" className="btn-primary px-4 py-3 text-sm">
            Tambah cron
          </button>
        </form>

        <div className="mt-6 divide-y-2 divide-ink rounded-xl border-2 border-ink">
          {crons.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted">Belum ada jadwal cron job.</p>
          ) : (
            crons.map((cron) => (
              <div key={cron.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="font-semibold">{cron.name}</p>
                  <p className="mt-1 font-mono text-xs break-all text-muted">
                    <span className="mr-2 rounded bg-paper px-2 py-0.5 text-ink">{cron.schedule}</span>
                    {cron.command}
                  </p>
                  {cron.last_run_at && (
                    <p className="mt-1 text-xs text-muted">Terakhir jalan: {cron.last_run_at}</p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleCron(cron.id)}
                    aria-pressed={cron.is_active}
                    className={`rounded-lg border-2 border-ink px-3 py-1.5 text-xs font-bold ${
                      cron.is_active ? 'bg-accent text-on-accent' : 'bg-surface text-ink'
                    }`}
                  >
                    {cron.is_active ? 'Aktif' : 'Nonaktif'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteCron(cron.id)}
                    className="rounded-lg px-3 py-1.5 text-xs font-bold text-danger underline underline-offset-4"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {project.db_type && project.db_type !== 'none' && (
        <section aria-labelledby="section-database" className="card p-6 md:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 id="section-database" className="font-display text-2xl font-bold">
              Kredensial database ({project.db_type.toUpperCase()})
            </h2>
            <a
              href="https://db.launchify.site"
              target="_blank"
              rel="noreferrer"
              className="btn-secondary px-4 py-2 text-sm"
            >
              Buka database manager <ExternalLink className="h-4 w-4" />
            </a>
          </div>

          <dl className="mt-6 grid grid-cols-2 gap-4 rounded-xl border-2 border-ink bg-paper p-4 font-mono text-xs md:grid-cols-5">
            <div>
              <dt className="text-muted">Host / server</dt>
              <dd className="mt-1 font-bold break-all">129.225.33.132</dd>
            </div>
            <div>
              <dt className="text-muted">External port</dt>
              <dd className="mt-1 font-bold">{project.db_port}</dd>
            </div>
            <div>
              <dt className="text-muted">Database</dt>
              <dd className="mt-1 font-bold break-all">{project.db_name}</dd>
            </div>
            <div>
              <dt className="text-muted">Username</dt>
              <dd className="mt-1 font-bold break-all">{project.db_user}</dd>
            </div>
            <div>
              <dt className="text-muted">Password</dt>
              <dd className="mt-1 font-bold break-all">{project.db_password}</dd>
            </div>
          </dl>
          <p className="mt-3 text-xs text-muted">
            Saat login di database manager (Adminer), isi kolom Server dengan{' '}
            <code className="rounded border border-ink bg-surface px-1.5 py-0.5 font-bold text-ink">
              129.225.33.132:{project.db_port}
            </code>
          </p>
        </section>
      )}
    </div>
  );
}
