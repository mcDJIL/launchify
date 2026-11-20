import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, XCircle, RefreshCw, X } from 'lucide-react';
import api, { STORAGE_BASE_URL } from '../utils/api';
import AppLayout from '../components/AppLayout';
import { useAuth } from '../context/auth';

const STATUS = {
  pending: { label: 'Menunggu bayar', className: 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200' },
  verifying: { label: 'Menunggu verifikasi', className: 'bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-200' },
  approved: { label: 'Disetujui', className: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200' },
  rejected: { label: 'Ditolak', className: 'bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-200' },
};

const rupiah = (value) => `Rp ${parseFloat(value || 0).toLocaleString('id-ID')}`;

export default function AdminTopups() {
  const { logout } = useAuth();
  const [pending, setPending] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState(null);
  const [preview, setPreview] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectNote, setRejectNote] = useState('Nominal transfer tidak sesuai.');

  const fetchAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [pendingRes, historyRes] = await Promise.all([
        api.get('/admin/topups'),
        api.get('/admin/topups/history'),
      ]);
      setPending(pendingRes.data || []);
      setHistory(historyRes.data?.data || []);
    } catch (err) {
      if (err.response?.status === 401) {
        logout();
        return;
      }
      setError(err.response?.data?.message || 'Gagal mengambil data top-up.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!preview && !rejectTarget) return;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setPreview(null);
        setRejectTarget(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [preview, rejectTarget]);

  const handleApprove = async (topup) => {
    if (!window.confirm(`Setujui top-up ${rupiah(topup.total_transfer)} dari ${topup.user?.name}?`)) return;

    setBusyId(topup.id);
    setError(null);
    try {
      await api.post(`/topup/${topup.id}/approve`);
      await fetchAll();
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menyetujui transaksi.');
    } finally {
      setBusyId(null);
    }
  };

  const submitReject = async () => {
    if (!rejectTarget) return;
    if (!rejectNote.trim()) {
      setError('Alasan penolakan wajib diisi.');
      return;
    }

    setBusyId(rejectTarget.id);
    setError(null);
    try {
      await api.post(`/topup/${rejectTarget.id}/reject`, { admin_note: rejectNote.trim() });
      setRejectTarget(null);
      await fetchAll();
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menolak transaksi.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <AppLayout active="admin-topups">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-extrabold tracking-tight">Verifikasi top-up</h1>
          <p className="mt-2 text-muted">Antrean bukti transfer, preview gambar, lalu setujui atau tolak dengan alasan.</p>
        </div>
        <button type="button" onClick={fetchAll} className="btn-secondary px-5 py-3 text-sm">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Muat ulang
        </button>
      </div>

      {error && (
        <div role="alert" className="mt-6 rounded-xl border-2 border-danger p-4 text-sm font-semibold text-danger">
          {error}
        </div>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="card p-6">
          <p className="text-sm font-semibold text-muted">Antrean verifikasi</p>
          <p className="font-display mt-2 text-4xl font-extrabold tabular-nums">{pending.length}</p>
        </div>
        <div className="card p-6">
          <p className="text-sm font-semibold text-muted">Total nominal antrean</p>
          <p className="font-display mt-2 text-3xl font-extrabold tabular-nums">
            {rupiah(pending.reduce((sum, item) => sum + parseFloat(item.total_transfer || 0), 0))}
          </p>
        </div>
        <div className="card p-6">
          <p className="text-sm font-semibold text-muted">Transaksi terakhir</p>
          <p className="font-display mt-2 text-4xl font-extrabold tabular-nums">{history.length}</p>
        </div>
      </div>

      <section className="mt-10">
        <h2 className="font-display text-2xl font-extrabold tracking-tight">Menunggu verifikasi</h2>

        {loading ? (
          <p className="mt-6 animate-pulse text-muted">Memuat antrean...</p>
        ) : pending.length === 0 ? (
          <div className="mt-6 rounded-2xl border-2 border-dashed border-ink p-10 text-center text-muted">
            Tidak ada bukti transfer yang menunggu verifikasi.
          </div>
        ) : (
          <ul className="mt-6 grid gap-5 md:grid-cols-2">
            {pending.map((topup) => (
              <li key={topup.id} className="card p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-display truncate text-lg font-bold">{topup.user?.name || 'User'}</p>
                    <p className="truncate text-xs text-muted">{topup.user?.email}</p>
                  </div>
                  <p className="font-display shrink-0 text-xl font-extrabold tabular-nums">
                    {rupiah(topup.total_transfer)}
                  </p>
                </div>

                <p className="mt-2 text-sm text-muted">
                  Nominal {rupiah(topup.base_amount)} + kode unik {topup.unique_code} ·{' '}
                  {new Date(topup.created_at).toLocaleString('id-ID')}
                </p>

                {topup.proof_image ? (
                  <button
                    type="button"
                    onClick={() => setPreview(topup)}
                    className="mt-4 block w-full overflow-hidden rounded-xl border-2 border-ink"
                    aria-label="Perbesar bukti transfer"
                  >
                    <img
                      src={`${STORAGE_BASE_URL}/storage/${topup.proof_image}`}
                      alt={`Bukti transfer ${topup.user?.name || 'user'}`}
                      className="h-40 w-full object-cover"
                    />
                  </button>
                ) : (
                  <p className="mt-4 rounded-xl border-2 border-hair p-3 text-sm text-muted">Belum ada bukti gambar.</p>
                )}

                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleApprove(topup)}
                    disabled={busyId === topup.id}
                    className="btn-primary flex-1 py-2.5 text-sm"
                  >
                    <CheckCircle className="h-4 w-4" /> Setujui
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRejectTarget(topup);
                      setRejectNote('Nominal transfer tidak sesuai.');
                    }}
                    disabled={busyId === topup.id}
                    className="btn-secondary flex-1 py-2.5 text-sm text-danger"
                  >
                    <XCircle className="h-4 w-4" /> Tolak
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-12">
        <h2 className="font-display text-2xl font-extrabold tracking-tight">Riwayat transaksi</h2>
        <div className="card mt-4 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b-2 border-ink bg-paper text-xs tracking-wide uppercase">
                  <th className="p-4 font-bold">User</th>
                  <th className="p-4 font-bold">Total</th>
                  <th className="p-4 font-bold">Status</th>
                  <th className="p-4 font-bold">Catatan admin</th>
                  <th className="p-4 font-bold">Tanggal</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-ink">
                {history.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-muted">Belum ada transaksi.</td>
                  </tr>
                ) : (
                  history.map((topup) => {
                    const status = STATUS[topup.status] || STATUS.pending;
                    return (
                      <tr key={topup.id} className="hover:bg-paper">
                        <td className="p-4">
                          <p className="font-semibold">{topup.user?.name || 'User'}</p>
                          <p className="text-xs text-muted">{topup.user?.email}</p>
                        </td>
                        <td className="p-4 font-semibold tabular-nums">{rupiah(topup.total_transfer)}</td>
                        <td className="p-4">
                          <span className={`rounded-md px-2.5 py-1 text-xs font-bold uppercase ${status.className}`}>
                            {status.label}
                          </span>
                        </td>
                        <td className="p-4 text-muted">{topup.admin_note || '—'}</td>
                        <td className="p-4 text-muted">{new Date(topup.created_at).toLocaleString('id-ID')}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <p className="mt-8 text-sm text-muted">
        Butuh ringkasan pendapatan? Lihat <Link to="/admin/billing-logs" className="font-semibold underline underline-offset-4">Billing logs</Link>.
      </p>

      {/* Lightbox bukti transfer */}
      {preview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setPreview(null)}
          role="presentation"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Preview bukti transfer"
            className="max-h-[90vh] w-full max-w-3xl overflow-auto rounded-2xl border-2 border-ink bg-surface p-4"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between gap-4">
              <div>
                <p className="font-display text-lg font-bold">{preview.user?.name}</p>
                <p className="text-sm text-muted">{rupiah(preview.total_transfer)}</p>
              </div>
              <button type="button" onClick={() => setPreview(null)} aria-label="Tutup preview" className="icon-btn">
                <X className="h-5 w-5" />
              </button>
            </div>
            <img
              src={`${STORAGE_BASE_URL}/storage/${preview.proof_image}`}
              alt="Bukti transfer diperbesar"
              className="max-h-[70vh] w-full rounded-xl border-2 border-ink object-contain"
            />
          </div>
        </div>
      )}

      {/* Modal alasan penolakan */}
      {rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div role="dialog" aria-modal="true" aria-label="Alasan penolakan" className="w-full max-w-md rounded-2xl border-2 border-ink bg-surface p-6">
            <div className="flex items-start justify-between gap-4">
              <h3 className="font-display text-xl font-extrabold">Tolak transaksi</h3>
              <button type="button" onClick={() => setRejectTarget(null)} aria-label="Tutup" className="icon-btn">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mt-2 text-sm text-muted">
              {rejectTarget.user?.name} · {rupiah(rejectTarget.total_transfer)}
            </p>
            <label htmlFor="reject-note" className="mt-4 mb-2 block text-sm font-semibold">
              Alasan penolakan (tampil ke user)
            </label>
            <textarea
              id="reject-note"
              className="field min-h-28 text-sm"
              value={rejectNote}
              onChange={(event) => setRejectNote(event.target.value)}
            />
            <div className="mt-4 flex gap-2">
              <button type="button" onClick={submitReject} disabled={busyId === rejectTarget.id} className="btn-primary flex-1 py-2.5 text-sm text-danger">
                {busyId === rejectTarget.id ? 'Memproses...' : 'Tolak transaksi'}
              </button>
              <button type="button" onClick={() => setRejectTarget(null)} className="btn-secondary px-4 py-2.5 text-sm">
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
