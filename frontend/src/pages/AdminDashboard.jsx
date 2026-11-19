import { useState, useEffect } from 'react';
import { ImageIcon, CheckCircle, RefreshCw } from 'lucide-react';
import api, { STORAGE_BASE_URL } from '../utils/api';
import AppLayout from '../components/AppLayout';

export default function AdminDashboard() {
  const [pendingTopups, setPendingTopups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPendingTopups = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/admin/topups');
      setPendingTopups(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal mengambil data transaksi.');
    } finally {
      setLoading(false);
    }
  };

  // Muat transaksi sekali saat halaman dibuka.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPendingTopups();
  }, []);

  const handleApprove = async (transactionId) => {
    const confirmApprove = window.confirm('Yakin ingin menyetujui dan menambah saldo user?');
    if (!confirmApprove) return;

    try {
      await api.post(`/topup/${transactionId}/approve`);
      alert('Transaksi berhasil disetujui. Saldo user sudah bertambah.');
      fetchPendingTopups();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menyetujui transaksi.');
    }
  };

  const totalTransfer = pendingTopups.reduce(
    (sum, topup) => sum + parseFloat(topup.total_transfer || 0),
    0
  );
  const uniqueUsers = new Set(pendingTopups.map((topup) => topup.user_id ?? topup.user?.id)).size;

  return (
    <AppLayout active="admin">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-muted">Panel admin</p>
          <h1 className="font-display text-4xl font-extrabold tracking-tight">Dashboard admin</h1>
          <p className="mt-2 text-muted">Pantau dan verifikasi top-up QRIS yang masuk dari user.</p>
        </div>
        <button type="button" onClick={fetchPendingTopups} className="btn-secondary px-5 py-3 text-sm">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Muat ulang
        </button>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="card p-6">
          <p className="text-sm font-semibold text-muted">Menunggu verifikasi</p>
          <p className="font-display mt-2 text-4xl font-extrabold tabular-nums">{pendingTopups.length}</p>
        </div>
        <div className="card p-6">
          <p className="text-sm font-semibold text-muted">Total nominal</p>
          <p className="font-display mt-2 text-4xl font-extrabold tabular-nums">
            Rp {totalTransfer.toLocaleString('id-ID')}
          </p>
        </div>
        <div className="card p-6">
          <p className="text-sm font-semibold text-muted">User terlibat</p>
          <p className="font-display mt-2 text-4xl font-extrabold tabular-nums">{uniqueUsers}</p>
        </div>
      </div>

      {error && (
        <div role="alert" className="mt-6 rounded-xl border-2 border-danger p-4 text-sm font-semibold text-danger">
          {error}
        </div>
      )}

      <h2 id="verifikasi" className="font-display mt-12 text-2xl font-extrabold tracking-tight">
        Verifikasi top-up QRIS
      </h2>

      <div className="card mt-4 overflow-hidden">
        {/* Tabel digulir horizontal di layar kecil agar kolom tetap terbaca */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-left">
            <thead>
              <tr className="border-b-2 border-ink bg-paper text-xs tracking-wide uppercase">
                <th scope="col" className="p-4 font-bold">Nama user</th>
                <th scope="col" className="p-4 font-bold">Nominal dasar</th>
                <th scope="col" className="p-4 font-bold">Kode unik</th>
                <th scope="col" className="p-4 font-bold">Total transfer</th>
                <th scope="col" className="p-4 font-bold">Bukti</th>
                <th scope="col" className="p-4 text-center font-bold">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-ink">
              {loading ? (
                <tr>
                  <td colSpan="6" className="p-10 text-center text-muted">Memuat transaksi...</td>
                </tr>
              ) : pendingTopups.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-10 text-center text-muted">Tidak ada transaksi yang menunggu verifikasi.</td>
                </tr>
              ) : (
                pendingTopups.map((topup) => (
                  <tr key={topup.id} className="hover:bg-paper">
                    <td className="p-4 font-semibold">{topup.user?.name || 'User'}</td>
                    <td className="p-4 text-muted">Rp {parseFloat(topup.base_amount).toLocaleString('id-ID')}</td>
                    <td className="p-4 font-mono font-bold">+{topup.unique_code}</td>
                    <td className="p-4 font-display text-lg font-extrabold tabular-nums">
                      Rp {parseFloat(topup.total_transfer).toLocaleString('id-ID')}
                    </td>
                    <td className="p-4">
                      {/* URL storage mengikuti VITE_API_URL, bukan alamat lokal */}
                      <a
                        href={`${STORAGE_BASE_URL}/storage/${topup.proof_image}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 text-sm font-semibold underline underline-offset-4"
                      >
                        <ImageIcon className="h-4 w-4" /> Lihat bukti
                      </a>
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => handleApprove(topup.id)}
                        className="btn-primary px-4 py-2 text-sm"
                      >
                        <CheckCircle className="h-4 w-4" /> Verifikasi
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
}
