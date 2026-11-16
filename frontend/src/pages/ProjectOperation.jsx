import React, { useState, useEffect } from 'react';
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

  return (
    <div className="space-y-8">
      {/* 1. WEB CONSOLE (MIGRATE & SEEDER) */}
      <div className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
        <h3 className="text-lg font-bold text-gray-800 mb-2">Web Console (Migrate & Seeder)</h3>
        <p className="text-sm text-gray-500 mb-4">
          Jalankan perintah langsung di dalam container aplikasi kamu.
        </p>

        {/* Tombol Preset Cepat */}
        <div className="flex flex-wrap gap-2 mb-4">
          {project.framework === 'laravel' ? (
            <>
              <button
                type="button"
                onClick={() => handleRunCommand('php artisan migrate --force')}
                className="px-3 py-1.5 text-xs font-medium bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100"
              >
                + Artisan Migrate
              </button>
              <button
                type="button"
                onClick={() => handleRunCommand('php artisan db:seed --force')}
                className="px-3 py-1.5 text-xs font-medium bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100"
              >
                + Artisan Seeder
              </button>
              <button
                type="button"
                onClick={() => handleRunCommand('php artisan storage:link')}
                className="px-3 py-1.5 text-xs font-medium bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100"
              >
                + Storage Link
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => handleRunCommand('npx prisma migrate deploy')}
                className="px-3 py-1.5 text-xs font-medium bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100"
              >
                + Prisma Migrate
              </button>
              <button
                type="button"
                onClick={() => handleRunCommand('npm run seed')}
                className="px-3 py-1.5 text-xs font-medium bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100"
              >
                + NPM Run Seed
              </button>
            </>
          )}
        </div>

        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            placeholder="Ketik perintah (misal: php artisan migrate --force atau npm run seed)"
            className="flex-1 px-4 py-2 text-sm border rounded-lg font-mono"
          />
          <button
            type="button"
            onClick={() => handleRunCommand()}
            disabled={isRunning}
            className="px-5 py-2 text-sm font-semibold text-white bg-gray-900 rounded-lg hover:bg-gray-800 disabled:opacity-50"
          >
            {isRunning ? 'Running...' : 'Run'}
          </button>
        </div>

        <pre className="p-4 bg-gray-950 text-green-400 text-xs rounded-lg overflow-x-auto font-mono min-h-[140px] whitespace-pre-wrap">
          {consoleOutput}
        </pre>
      </div>

      {/* 2. CRON JOB SCHEDULER */}
      <div className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Cron Job Scheduler</h3>

        <form onSubmit={handleAddCron} className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
          <input
            type="text"
            required
            placeholder="Nama (misal: Laravel Cron)"
            value={cronName}
            onChange={(e) => setCronName(e.target.value)}
            className="px-3 py-2 text-sm border rounded-lg"
          />
          <input
            type="text"
            required
            placeholder="Jadwal (* * * * *)"
            value={cronSchedule}
            onChange={(e) => setCronSchedule(e.target.value)}
            className="px-3 py-2 text-sm border rounded-lg font-mono"
          />
          <input
            type="text"
            required
            placeholder="Command (php artisan schedule:run)"
            value={cronCommand}
            onChange={(e) => setCronCommand(e.target.value)}
            className="px-3 py-2 text-sm border rounded-lg font-mono"
          />
          <button
            type="submit"
            className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            Tambah Cron
          </button>
        </form>

        <div className="divide-y border rounded-lg">
          {crons.length === 0 ? (
            <p className="p-4 text-sm text-gray-400 text-center">Belum ada jadwal cron job.</p>
          ) : (
            crons.map((cron) => (
              <div key={cron.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm text-gray-800">{cron.name}</p>
                  <p className="text-xs font-mono text-gray-600 mt-1">
                    <span className="bg-gray-100 px-2 py-0.5 rounded mr-2">{cron.schedule}</span>
                    {cron.command}
                  </p>
                  {cron.last_run_at && (
                    <p className="text-[11px] text-gray-400 mt-1">Terakhir jalan: {cron.last_run_at}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleCron(cron.id)}
                    className={`px-3 py-1 text-xs rounded-full font-medium ${
                      cron.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {cron.is_active ? 'Aktif' : 'Nonaktif'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteCron(cron.id)}
                    className="px-3 py-1 text-xs text-red-600 hover:bg-red-50 rounded"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 3. AKSES DATABASE & ADMINER */}
      {project.db_type && project.db_type !== 'none' && (
        <div className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-800">
              Kredensial Database ({project.db_type.toUpperCase()})
            </h3>
            <a
              href="https://db.launchify.site"
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700"
            >
              Buka Database Manager (Web) ↗
            </a>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 p-4 bg-gray-50 rounded-lg font-mono text-xs">
            <div>
              <span className="text-gray-400 block">Host / Server</span>
              <span className="font-bold text-gray-800">129.225.33.132</span>
            </div>
            <div>
              <span className="text-gray-400 block">External Port</span>
              <span className="font-bold text-gray-800">{project.db_port}</span>
            </div>
            <div>
              <span className="text-gray-400 block">Database</span>
              <span className="font-bold text-gray-800">{project.db_name}</span>
            </div>
            <div>
              <span className="text-gray-400 block">Username</span>
              <span className="font-bold text-gray-800">{project.db_user}</span>
            </div>
            <div>
              <span className="text-gray-400 block">Password</span>
              <span className="font-bold text-gray-800">{project.db_password}</span>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-3">
            * Saat login di Web Database Manager (Adminer), masukkan kolom Server dengan format:{' '}
            <code className="bg-gray-100 px-1.5 py-0.5 rounded font-bold">
              129.225.33.132:{project.db_port}
            </code>
          </p>
        </div>
      )}
    </div>
  );
}
