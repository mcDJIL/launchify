import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ReceiptText,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
} from 'lucide-react';
import api from '../utils/api';
import AppLayout from '../components/AppLayout';
import { useAuth } from '../context/auth';

// Label dan gaya badge untuk setiap status transaksi top-up.
const STATUS = {
  pending: {
    label: 'Menunggu pembayaran',
    className: 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200',
    icon: Clock,
  },
  verifying: {
    label: 'Menunggu verifikasi',
    className: 'bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-200',
    icon: Clock,
  },
  approved: {
    label: 'Berhasil',
    className: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200',
    icon: CheckCircle2,
  },
  rejected: {
    label: 'Gagal',
    className: 'bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-200',
    icon: XCircle,
  },
};

const FILTERS = [
  { key: 'all', label: 'Semua' },
  { key: 'process', label: 'Diproses' },
  { key: 'approved', label: 'Berhasil' },
  { key: 'rejected', label: 'Gagal' },
];

function formatRupiah(value) {
  return `Rp ${parseFloat(value || 0).toLocaleString('id-ID')}`;
}

function formatDate(value) {
  return new Date(value).toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Ubah jumlah jam jadi teks "X hari Y jam" agar estimasi runway mudah dibaca.
function formatRunway(hours) {
  if (hours === null || hours === undefined) return null;
  const days = Math.floor(hours / 24);
  const rest = Math.floor(hours % 24);
  if (days <= 0) return `${rest} jam`;
  return `${days} hari ${rest} jam`;
}

export default function TransactionHistory() {
  const { logout } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [ledgers, setLedgers] = useState([]);
  const [summary, setSummary] = useState(null);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [topupRes, billingRes] = await Promise.all([
        api.get('/topup/history'),
        api.get('/billing/history'),
      ]);
      setTransactions(topupRes.data.data || []);
      setLedgers(billingRes.data.data || []);
      setSummary(billingRes.data.summary || null);
    } catch (err) {
      if (err.response?.status === 401) {
        logout();
        return;
      }
      setError(err.response?.data?.message || 'Gagal mengambil data billing.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = transactions.filter((trx) => {
    if (filter === 'all') return true;
    if (filter === 'process') return trx.status === 'pending' || trx.status === 'verifying';
    return trx.status === filter;
  });

  const approvedTotal = transactions
    .filter((trx) => trx.status === 'approved')
    .reduce((sum, trx) => sum + parseFloat(trx.total_transfer || 0), 0);
  const rejectedCount = transactions.filter((trx) => trx.status === 'rejected').length;
  const processCount = transactions.filter(
    (trx) => trx.status === 'pending' || trx.status === 'verifying'
  ).length;

  const runway = formatRunway(summary?.runway_hours);

  return (
    <AppLayout active="transactions">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-extrabold tracking-tight">Billing &amp; Wallet</h1>
          <p className="mt-2 text-muted">
            Pantau saldo, estimasi pemakaian, mutasi saldo per jam, dan status pengajuan top-up.
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={fetchData} className="btn-secondary px-5 py-3 text-sm">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Muat ulang
          </button>
          <Link to="/topup" className="btn-primary px-5 py-3 text-sm">
            Top up saldo
          </Link>
        </div>
      </div>

      {error && (
        <div role="alert" className="mt-6 rounded-xl border-2 border-danger p-4 text-sm font-semibold text-danger">
          {error}
        </div>
      )}

      {/* Ringkasan saldo dan estimasi runway */}
      <section className="mt-8 grid gap-6 rounded-3xl border-2 border-ink bg-ink p-8 text-paper shadow-block md:grid-cols-[1fr_auto] md:items-center md:p-10">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold opacity-85">
            <Wallet className="h-4 w-4" /> Saldo pay-as-you-go
          </p>
          <p className="font-display mt-2 text-5xl font-extrabold tabular-nums md:text-6xl">
            {formatRupiah(summary?.wallet_balance ?? 0)}
          </p>
          <p className="mt-3 max-w-xl text-sm opacity-85">
            {summary?.active_projects > 0 ? (
              <>
                {summary.active_projects} project aktif memakai {formatRupiah(summary.hourly_burn)}/jam.
                {runway
                  ? ` Saldo ini cukup untuk sekitar ${runway} ke depan.`
                  : ' Saldo sudah habis, project akan berhenti otomatis.'}
              </>
            ) : (
              'Belum ada project aktif, jadi saldo tidak terpotong per jam.'
            )}
          </p>
        </div>
        <Link to="/topup" className="btn-primary px-6 py-4 text-lg">
          Top up saldo
        </Link>
      </section>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="card p-6">
          <p className="text-sm font-semibold text-muted">Total top-up berhasil</p>
          <p className="font-display mt-2 text-3xl font-extrabold tabular-nums">{formatRupiah(approvedTotal)}</p>
        </div>
        <div className="card p-6">
          <p className="text-sm font-semibold text-muted">Sedang diproses</p>
          <p className="font-display mt-2 text-3xl font-extrabold tabular-nums">{processCount}</p>
        </div>
        <div className="card p-6">
          <p className="text-sm font-semibold text-muted">Transaksi gagal</p>
          <p className="font-display mt-2 text-3xl font-extrabold tabular-nums">{rejectedCount}</p>
        </div>
      </div>

      {/* Mutasi saldo dari billing ledger */}
      <section className="mt-12">
        <h2 className="font-display text-2xl font-extrabold tracking-tight">Mutasi saldo</h2>
        <p className="mt-1 text-muted">Pemotongan per jam dan penambahan saldo tercatat di sini.</p>

        {loading ? (
          <p className="mt-6 animate-pulse text-muted">Memuat mutasi saldo...</p>
        ) : ledgers.length === 0 ? (
          <div className="mt-6 rounded-2xl border-2 border-dashed border-ink p-8 text-center text-muted">
            Belum ada mutasi saldo. Saldo akan terpotong otomatis saat project berjalan.
          </div>
        ) : (
          <ul className="mt-6 divide-y-2 divide-ink overflow-hidden rounded-2xl border-2 border-ink bg-surface">
            {ledgers.map((ledger) => {
              const isCredit = ledger.type === 'credit';
              const Icon = isCredit ? ArrowDownLeft : ArrowUpRight;
              return (
                <li key={ledger.id} className="flex flex-wrap items-center justify-between gap-4 p-5">
                  <div className="flex min-w-0 items-start gap-3">
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-ink ${
                        isCredit ? 'bg-emerald-100 text-emerald-900' : 'bg-red-100 text-red-900'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold">{ledger.description}</p>
                      <p className="mt-0.5 text-sm text-muted">
                        {formatDate(ledger.created_at)}
                        {ledger.project?.name ? ` · ${ledger.project.name}` : ''}
                      </p>
                    </div>
                  </div>
                  <p
                    className={`font-display shrink-0 text-lg font-extrabold tabular-nums ${
                      isCredit ? 'text-emerald-700 dark:text-emerald-300' : 'text-danger'
                    }`}
                  >
                    {isCredit ? '+' : '−'} {formatRupiah(ledger.amount)}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Riwayat pengajuan top-up */}
      <section className="mt-12">
        <h2 className="font-display text-2xl font-extrabold tracking-tight">Pengajuan top-up</h2>
        <p className="mt-1 text-muted">Status verifikasi dan alasan jika pengajuan gagal.</p>

        <div className="mt-6 flex flex-wrap gap-2">
          {FILTERS.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setFilter(item.key)}
              aria-pressed={filter === item.key}
              className={`rounded-xl border-2 border-ink px-4 py-2 text-sm font-semibold ${
                filter === item.key ? 'bg-accent text-on-accent' : 'hover:bg-surface'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="mt-8 animate-pulse text-muted">Memuat riwayat top-up...</p>
        ) : filtered.length === 0 ? (
          <div className="mt-8 rounded-2xl border-2 border-dashed border-ink p-10 text-center">
            <ReceiptText className="mx-auto h-10 w-10" />
            <p className="font-display mt-4 text-2xl font-bold">Belum ada transaksi.</p>
            <p className="mx-auto mt-2 max-w-md text-muted">
              {transactions.length === 0
                ? 'Riwayat top-up saldo akan muncul di sini setelah kamu membuat tagihan pertama.'
                : 'Tidak ada transaksi pada filter ini.'}
            </p>
            {transactions.length === 0 && (
              <Link to="/topup" className="btn-primary mt-6 px-5 py-3 text-sm">
                Buat tagihan top-up
              </Link>
            )}
          </div>
        ) : (
          <ul className="mt-6 space-y-4">
            {filtered.map((trx) => {
              const status = STATUS[trx.status] || STATUS.pending;
              const StatusIcon = status.icon;
              return (
                <li key={trx.id} className="card p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-display text-2xl font-extrabold tabular-nums">
                        {formatRupiah(trx.total_transfer)}
                      </p>
                      <p className="mt-1 text-sm text-muted">
                        Nominal {formatRupiah(trx.base_amount)} + kode unik {trx.unique_code}
                      </p>
                    </div>
                    <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-bold uppercase ${status.className}`}>
                      <StatusIcon className="h-3.5 w-3.5" /> {status.label}
                    </span>
                  </div>

                  <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted">Tanggal</dt>
                      <dd className="font-semibold">{formatDate(trx.created_at)}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted">ID transaksi</dt>
                      <dd className="truncate font-mono text-xs font-semibold">{trx.id.slice(0, 8).toUpperCase()}</dd>
                    </div>
                  </dl>

                  {/* Alasan gagal hanya muncul untuk transaksi yang ditolak */}
                  {trx.status === 'rejected' && (
                    <div className="mt-4 flex items-start gap-3 rounded-xl border-2 border-danger p-4 text-sm text-danger">
                      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                      <div>
                        <p className="font-bold">Alasan gagal</p>
                        <p className="mt-1">{trx.admin_note || 'Tidak ada catatan dari admin.'}</p>
                      </div>
                    </div>
                  )}

                  {trx.status === 'pending' && !trx.proof_image && (
                    <p className="mt-4 rounded-xl border-2 border-hair p-3 text-sm text-muted">
                      Tagihan belum dibayar. Transfer sesuai nominal lalu unggah bukti di halaman top-up.
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </AppLayout>
  );
}
