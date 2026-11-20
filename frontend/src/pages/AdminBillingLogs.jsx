import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { RefreshCw, Wallet, TrendingUp, Users, ArrowDownRight } from 'lucide-react';
import api from '../utils/api';
import AppLayout from '../components/AppLayout';
import { useAuth } from '../context/auth';

const rupiah = (value) => `Rp ${parseFloat(value || 0).toLocaleString('id-ID')}`;

function monthLabel(month) {
  if (!month) return '—';
  const date = new Date(`${month}-01T00:00:00`);
  return date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
}

export default function AdminBillingLogs() {
  const { logout } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/admin/billing-logs');
      setData(res.data);
    } catch (err) {
      if (err.response?.status === 401) {
        logout();
        return;
      }
      setError(err.response?.data?.message || 'Gagal mengambil log billing.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const summary = data?.summary;

  return (
    <AppLayout active="admin-billing">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-extrabold tracking-tight">Billing &amp; audit</h1>
          <p className="mt-2 text-muted">Rekap pemasukan top-up, eksekusi cron billing, dan ARPU.</p>
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

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="card p-6">
          <p className="flex items-center gap-2 text-sm font-semibold text-muted">
            <Wallet className="h-4 w-4" /> Total pemasukan
          </p>
          <p className="font-display mt-2 text-3xl font-extrabold tabular-nums">{rupiah(summary?.total_income)}</p>
        </div>
        <div className="card p-6">
          <p className="flex items-center gap-2 text-sm font-semibold text-muted">
            <TrendingUp className="h-4 w-4" /> Bulan ini
          </p>
          <p className="font-display mt-2 text-3xl font-extrabold tabular-nums">{rupiah(summary?.current_month_income)}</p>
        </div>
        <div className="card p-6">
          <p className="flex items-center gap-2 text-sm font-semibold text-muted">
            <Users className="h-4 w-4" /> ARPU
          </p>
          <p className="font-display mt-2 text-3xl font-extrabold tabular-nums">{rupiah(summary?.arpu)}</p>
          <p className="mt-1 text-xs text-muted">{summary?.users ?? 0} user terdaftar</p>
        </div>
        <div className="card p-6">
          <p className="flex items-center gap-2 text-sm font-semibold text-muted">
            <ArrowDownRight className="h-4 w-4" /> Total pemotongan
          </p>
          <p className="font-display mt-2 text-3xl font-extrabold tabular-nums">{rupiah(summary?.total_debits)}</p>
        </div>
      </div>

      <section className="mt-10">
        <h2 className="font-display text-2xl font-extrabold tracking-tight">Pemasukan per bulan</h2>
        <div className="card mt-4 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b-2 border-ink bg-paper text-xs tracking-wide uppercase">
                  <th className="p-4 font-bold">Bulan</th>
                  <th className="p-4 font-bold">Transaksi disetujui</th>
                  <th className="p-4 font-bold">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-ink">
                {loading ? (
                  <tr><td colSpan="3" className="p-8 text-center text-muted">Memuat data...</td></tr>
                ) : (data?.monthly?.length ?? 0) === 0 ? (
                  <tr><td colSpan="3" className="p-8 text-center text-muted">Belum ada top-up yang disetujui.</td></tr>
                ) : (
                  data.monthly.map((row) => (
                    <tr key={row.month} className="hover:bg-paper">
                      <td className="p-4 font-semibold capitalize">{monthLabel(row.month)}</td>
                      <td className="p-4 tabular-nums">{row.count}</td>
                      <td className="p-4 font-semibold tabular-nums">{rupiah(row.total)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-2xl font-extrabold tracking-tight">Eksekusi cron billing</h2>
        <p className="mt-1 text-sm text-muted">
          Setiap eksekusi <code className="font-mono">billing:process-hourly</code> mencatat berapa container ditagih dan dihentikan.
        </p>
        <div className="card mt-4 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b-2 border-ink bg-paper text-xs tracking-wide uppercase">
                  <th className="p-4 font-bold">Waktu</th>
                  <th className="p-4 font-bold">Ditagih</th>
                  <th className="p-4 font-bold">Total tagihan</th>
                  <th className="p-4 font-bold">Gagal / skip</th>
                  <th className="p-4 font-bold">Auto-stop</th>
                  <th className="p-4 font-bold">Catatan</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-ink">
                {loading ? (
                  <tr><td colSpan="6" className="p-8 text-center text-muted">Memuat data...</td></tr>
                ) : (data?.runs?.length ?? 0) === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-muted">
                      Belum ada log eksekusi. Jalankan <code className="font-mono">php artisan billing:process-hourly</code>.
                    </td>
                  </tr>
                ) : (
                  data.runs.map((run) => (
                    <tr key={run.id} className="hover:bg-paper">
                      <td className="p-4">{new Date(run.run_at).toLocaleString('id-ID')}</td>
                      <td className="p-4 tabular-nums">{run.projects_charged}</td>
                      <td className="p-4 font-semibold tabular-nums">{rupiah(run.total_charged)}</td>
                      <td className="p-4 tabular-nums">{run.projects_skipped}</td>
                      <td className="p-4 tabular-nums">{run.projects_suspended}</td>
                      <td className="p-4 text-muted">{run.notes || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <p className="mt-8 text-sm text-muted">
        Ingin menyesuaikan tarif? Buka <Link to="/admin/settings" className="font-semibold underline underline-offset-4">Pengaturan</Link>.
      </p>
    </AppLayout>
  );
}
