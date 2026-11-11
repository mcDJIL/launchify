import { useState, useEffect } from 'react';
import api from '../utils/api';
import { CheckCircle, ImageIcon, ShieldCheck } from 'lucide-react';

export default function AdminDashboard() {
  const [pendingTopups, setPendingTopups] = useState([]);

  useEffect(() => {
    fetchPendingTopups();
  }, []);

  const fetchPendingTopups = async () => {
    try {
      // Pastikan endpoint ini sudah kamu buat di routes Laravel
      const res = await api.get('/admin/topups'); 
      setPendingTopups(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleApprove = async (transactionId) => {
    const confirmApprove = window.confirm('Yakin ingin menyetujui dan menambah saldo user?');
    if (!confirmApprove) return;

    try {
      await api.post(`/topup/${transactionId}/approve`);
      alert('Transaksi berhasil disetujui! Transaksi DB::commit() berjalan sukses.');
      fetchPendingTopups(); // Refresh tabel
    } catch (err) {
      alert('Gagal menyetujui transaksi.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-10 font-sans">
      <div className="max-w-6xl mx-auto">
        
        <div className="flex items-center gap-3 mb-8">
          <ShieldCheck className="w-8 h-8 text-blue-700" />
          <h1 className="text-3xl font-bold text-gray-900">Admin Approval QRIS</h1>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-200 text-sm text-gray-600 uppercase">
                <th className="p-4 font-semibold">Nama User</th>
                <th className="p-4 font-semibold">Nominal Base</th>
                <th className="p-4 font-semibold">Kode Unik</th>
                <th className="p-4 font-semibold text-blue-700">Total Transfer</th>
                <th className="p-4 font-semibold">Bukti Gambar</th>
                <th className="p-4 font-semibold text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {pendingTopups.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-gray-500">Tidak ada transaksi yang menunggu verifikasi.</td>
                </tr>
              ) : (
                pendingTopups.map((topup) => (
                  <tr key={topup.id} className="hover:bg-gray-50 transition">
                    <td className="p-4 text-gray-900 font-medium">{topup.user?.name || 'User'}</td>
                    <td className="p-4 text-gray-600">Rp {parseFloat(topup.base_amount).toLocaleString('id-ID')}</td>
                    <td className="p-4 font-mono text-orange-600 font-bold">+{topup.unique_code}</td>
                    <td className="p-4 text-blue-700 font-bold text-lg">
                      Rp {parseFloat(topup.total_transfer).toLocaleString('id-ID')}
                    </td>
                    <td className="p-4">
                      {/* URL base diarahkan ke storage lokal Laravel kamu */}
                      <a 
                        href={`http://127.0.0.1:8000/storage/${topup.proof_image}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="flex items-center gap-2 text-blue-600 hover:underline text-sm font-medium"
                      >
                        <ImageIcon className="w-4 h-4" /> Lihat Bukti
                      </a>
                    </td>
                    <td className="p-4 text-center">
                      <button 
                        onClick={() => handleApprove(topup.id)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-semibold rounded hover:bg-green-700 transition shadow"
                      >
                        <CheckCircle className="w-4 h-4" /> Verifikasi
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}