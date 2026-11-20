import { useState, useEffect } from 'react';
import { RefreshCw, Wallet, Ban, CheckCircle2, X, History } from 'lucide-react';
import api from '../utils/api';
import AppLayout from '../components/AppLayout';
import { useAuth } from '../context/auth';

const rupiah = (value) => `Rp ${parseFloat(value || 0).toLocaleString('id-ID')}`;

const TOPUP_STATUS = {
  pending: 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200',
  verifying: 'bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-200',
  approved: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200',
  rejected: 'bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-200',
};

export default function AdminUsers() {
  const { logout } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [creditUser, setCreditUser] = useState(null);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/admin/users');
      setUsers(res.data.data || []);
    } catch (err) {
      if (err.response?.status === 401) {
        logout();
        return;
      }
      setError(err.response?.data?.message || 'Gagal mengambil data user.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCredit = async () => {
    if (!creditUser) return;
    const value = parseFloat(amount);
    if (!value) {
      setError('Nominal penyesuaian tidak boleh 0.');
      return;
    }

    setBusyId(creditUser.id);
    setError(null);
    setNotice(null);
    try {
      const res = await api.post(`/admin/users/${creditUser.id}/credit`, { amount: value, note });
      setNotice({ type: 'success', text: `${res.data.message} Saldo baru ${rupiah(res.data.wallet_balance)}.` });
      setCreditUser(null);
      setAmount('');
      setNote('');
      await fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menyesuaikan saldo.');
    } finally {
      setBusyId(null);
    }
  };

  const handleSuspend = async (user) => {
    const next = !user.is_suspended;
    if (!window.confirm(next ? `Suspend akun ${user.name}? Project aktifnya akan ditandai suspended.` : `Cabut suspend untuk ${user.name}?`)) {
      return;
    }

    setBusyId(user.id);
    setError(null);
    setNotice(null);
    try {
      const res = await api.post(`/admin/users/${user.id}/suspend`, { suspended: next });
      setNotice({ type: 'success', text: res.data.message });
      await fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal mengubah status akun.');
    } finally {
      setBusyId(null);
    }
  };

  const openDetail = async (user) => {
    setDetail({ user, projects: [], topups: [], ledgers: [] });
    setDetailLoading(true);
    try {
      const res = await api.get(`/admin/users/${user.id}`);
      setDetail(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal mengambil detail user.');
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <AppLayout active="admin-users">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-extrabold tracking-tight">User &amp; suspend</h1>
          <p className="mt-2 text-muted">Kelola saldo manual, pantau project aktif, dan suspend akun bermasalah.</p>
        </div>
        <button type="button" onClick={fetchUsers} className="btn-secondary px-5 py-3 text-sm">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Muat ulang
        </button>
      </div>

      {error && (
        <div role="alert" className="mt-6 rounded-xl border-2 border-danger p-4 text-sm font-semibold text-danger">
          {error}
        </div>
      )}

      {notice && (
        <div role="status" className="mt-6 rounded-xl border-2 border-ink bg-accent p-4 text-sm font-semibold text-on-accent">
          {notice.text}
        </div>
      )}

      <div className="card mt-8 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b-2 border-ink bg-paper text-xs tracking-wide uppercase">
                <th className="p-4 font-bold">User</th>
                <th className="p-4 font-bold">Saldo</th>
                <th className="p-4 font-bold">Project</th>
                <th className="p-4 font-bold">Total top-up</th>
                <th className="p-4 font-bold">Status</th>
                <th className="p-4 text-right font-bold">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-ink">
              {loading ? (
                <tr><td colSpan="6" className="p-8 text-center text-muted">Memuat user...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan="6" className="p-8 text-center text-muted">Belum ada user.</td></tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-paper">
                    <td className="p-4">
                      <p className="font-semibold">{user.name}</p>
                      <p className="text-xs text-muted">{user.email}</p>
                    </td>
                    <td className="p-4 font-semibold tabular-nums">{rupiah(user.wallet_balance)}</td>
                    <td className="p-4 tabular-nums">
                      {user.active_projects_count} aktif / {user.projects_count} total
                    </td>
                    <td className="p-4 tabular-nums">{rupiah(user.topup_total)}</td>
                    <td className="p-4">
                      <span
                        className={`rounded-md px-2.5 py-1 text-xs font-bold uppercase ${
                          user.is_suspended
                            ? 'bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-200'
                            : 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200'
                        }`}
                      >
                        {user.is_suspended ? 'Suspended' : 'Aktif'}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setCreditUser(user);
                            setAmount('');
                            setNote('');
                          }}
                          className="btn-secondary px-3 py-2 text-xs"
                        >
                          <Wallet className="h-3.5 w-3.5" /> Saldo
                        </button>
                        <button type="button" onClick={() => openDetail(user)} className="btn-secondary px-3 py-2 text-xs">
                          <History className="h-3.5 w-3.5" /> Riwayat
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSuspend(user)}
                          disabled={busyId === user.id || user.role === 'admin'}
                          className={`px-3 py-2 text-xs ${user.is_suspended ? 'btn-primary' : 'btn-secondary text-danger'}`}
                        >
                          {user.is_suspended ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Ban className="h-3.5 w-3.5" />}
                          {user.is_suspended ? 'Pulihkan' : 'Suspend'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal penyesuaian saldo */}
      {creditUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div role="dialog" aria-modal="true" aria-label="Penyesuaian saldo" className="w-full max-w-md rounded-2xl border-2 border-ink bg-surface p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-display text-xl font-extrabold">Penyesuaian saldo</h3>
                <p className="mt-1 text-sm text-muted">{creditUser.name} · saldo {rupiah(creditUser.wallet_balance)}</p>
              </div>
              <button type="button" onClick={() => setCreditUser(null)} aria-label="Tutup" className="icon-btn">
                <X className="h-5 w-5" />
              </button>
            </div>

            <label htmlFor="credit-amount" className="mt-4 mb-2 block text-sm font-semibold">
              Nominal (positif = tambah, negatif = kurangi)
            </label>
            <input
              id="credit-amount"
              type="number"
              className="field text-lg font-semibold"
              placeholder="50000"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
            />

            <label htmlFor="credit-note" className="mt-4 mb-2 block text-sm font-semibold">
              Catatan
            </label>
            <input
              id="credit-note"
              type="text"
              className="field"
              placeholder="Kompensasi downtime / bonus"
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />

            <div className="mt-5 flex gap-2">
              <button type="button" onClick={handleCredit} disabled={busyId === creditUser.id} className="btn-primary flex-1 py-2.5 text-sm">
                {busyId === creditUser.id ? 'Menyimpan...' : 'Simpan penyesuaian'}
              </button>
              <button type="button" onClick={() => setCreditUser(null)} className="btn-secondary px-4 py-2.5 text-sm">
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal riwayat user */}
      {detail && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4">
          <div role="dialog" aria-modal="true" aria-label="Riwayat user" className="my-8 w-full max-w-3xl rounded-2xl border-2 border-ink bg-surface p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-display text-2xl font-extrabold">{detail.user.name}</h3>
                <p className="text-sm text-muted">{detail.user.email} · saldo {rupiah(detail.user.wallet_balance)}</p>
              </div>
              <button type="button" onClick={() => setDetail(null)} aria-label="Tutup" className="icon-btn">
                <X className="h-5 w-5" />
              </button>
            </div>

            {detailLoading ? (
              <p className="mt-6 animate-pulse text-muted">Memuat riwayat...</p>
            ) : (
              <>
                <h4 className="font-display mt-6 text-lg font-bold">Project</h4>
                <div className="mt-2 overflow-x-auto">
                  <table className="w-full min-w-[420px] text-left text-sm">
                    <tbody className="divide-y-2 divide-ink">
                      {detail.projects.length === 0 ? (
                        <tr><td className="p-3 text-muted">Belum ada project.</td></tr>
                      ) : (
                        detail.projects.map((project) => (
                          <tr key={project.id}>
                            <td className="p-3 font-semibold">{project.name}</td>
                            <td className="p-3 text-muted">{project.status}</td>
                            <td className="p-3 tabular-nums">{rupiah(project.hourly_rate)}/jam</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <h4 className="font-display mt-6 text-lg font-bold">Top-up terakhir</h4>
                <ul className="mt-2 divide-y-2 divide-ink rounded-xl border-2 border-ink">
                  {detail.topups.length === 0 ? (
                    <li className="p-3 text-sm text-muted">Belum ada top-up.</li>
                  ) : (
                    detail.topups.map((topup) => (
                      <li key={topup.id} className="flex items-center justify-between gap-4 p-3 text-sm">
                        <div>
                          <p className="font-semibold tabular-nums">{rupiah(topup.total_transfer)}</p>
                          <p className="text-xs text-muted">{new Date(topup.created_at).toLocaleString('id-ID')}</p>
                        </div>
                        <span className={`rounded-md px-2 py-0.5 text-xs font-bold uppercase ${TOPUP_STATUS[topup.status] || ''}`}>
                          {topup.status}
                        </span>
                      </li>
                    ))
                  )}
                </ul>

                <h4 className="font-display mt-6 text-lg font-bold">Mutasi saldo</h4>
                <ul className="mt-2 divide-y-2 divide-ink rounded-xl border-2 border-ink">
                  {detail.ledgers.length === 0 ? (
                    <li className="p-3 text-sm text-muted">Belum ada mutasi.</li>
                  ) : (
                    detail.ledgers.map((ledger) => (
                      <li key={ledger.id} className="flex items-center justify-between gap-4 p-3 text-sm">
                        <div>
                          <p className="font-semibold">{ledger.description}</p>
                          <p className="text-xs text-muted">{new Date(ledger.created_at).toLocaleString('id-ID')}</p>
                        </div>
                        <span className={`font-semibold tabular-nums ${ledger.type === 'credit' ? 'text-emerald-700 dark:text-emerald-300' : 'text-danger'}`}>
                          {ledger.type === 'credit' ? '+' : '−'} {rupiah(ledger.amount)}
                        </span>
                      </li>
                    ))
                  )}
                </ul>
              </>
            )}
          </div>
        </div>
      )}
    </AppLayout>
  );
}
