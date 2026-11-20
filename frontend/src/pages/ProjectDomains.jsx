import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Globe,
  Plus,
  Trash2,
  ShieldCheck,
  ShieldAlert,
  RefreshCw,
  Copy,
  Check,
  ExternalLink,
} from 'lucide-react';
import api from '../utils/api';
import AppLayout from '../components/AppLayout';
import { useAuth } from '../context/auth';

const DNS_STATUS = {
  pending: { label: 'DNS belum dicek', className: 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200' },
  verified: { label: 'DNS terverifikasi', className: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200' },
  failed: { label: 'DNS gagal', className: 'bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-200' },
};

const SSL_STATUS = {
  none: { label: 'SSL belum ada', className: 'bg-paper text-ink' },
  pending: { label: 'SSL diproses', className: 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200' },
  issued: { label: 'SSL aktif', className: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200' },
  failed: { label: 'SSL gagal', className: 'bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-200' },
};

export default function ProjectDomains() {
  const { id } = useParams();
  const { logout } = useAuth();
  const [data, setData] = useState(null);
  const [domainInput, setDomainInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [copied, setCopied] = useState(null);

  const fetchDomains = async () => {
    try {
      const res = await api.get(`/projects/${id}/domains`);
      setData(res.data);
      setError(null);
    } catch (err) {
      if (err.response?.status === 401) {
        logout();
        return;
      }
      setError(err.response?.data?.message || 'Gagal mengambil data domain.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchDomains();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const copyText = async (text, key) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      setError('Browser menolak akses clipboard. Salin manual dari teks di atas.');
    }
  };

  const handleAdd = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setNotice(null);
    try {
      const res = await api.post(`/projects/${id}/domains`, { domain: domainInput });
      setDomainInput('');
      setNotice({ type: 'success', text: res.data.message });
      await fetchDomains();
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menambahkan domain.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerify = async (domain) => {
    setBusyId(domain.id);
    setError(null);
    setNotice(null);
    try {
      const res = await api.post(`/projects/${id}/domains/${domain.id}/verify`);
      setNotice({ type: 'success', text: res.data.message });
    } catch (err) {
      setError(err.response?.data?.message || 'Verifikasi DNS gagal.');
    } finally {
      setBusyId(null);
      fetchDomains();
    }
  };

  const handleSsl = async (domain) => {
    setBusyId(domain.id);
    setError(null);
    setNotice(null);
    try {
      const res = await api.post(`/projects/${id}/domains/${domain.id}/ssl`);
      setNotice({ type: 'success', text: res.data.message });
    } catch (err) {
      setError(err.response?.data?.message || 'Penerbitan SSL gagal.');
    } finally {
      setBusyId(null);
      fetchDomains();
    }
  };

  const handleDelete = async (domain) => {
    if (!window.confirm(`Hapus domain ${domain.domain}? Sertifikat SSL-nya juga akan berhenti dipakai.`)) return;

    setBusyId(domain.id);
    setError(null);
    setNotice(null);
    try {
      const res = await api.delete(`/projects/${id}/domains/${domain.id}`);
      setNotice({ type: 'success', text: res.data.message });
      await fetchDomains();
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menghapus domain.');
    } finally {
      setBusyId(null);
    }
  };

  const serverIp = data?.server_ip || '129.225.33.132';
  const defaultSubdomain = data?.default_subdomain || '';

  return (
    <AppLayout active="dashboard">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <Link to={`/projects/${id}`} aria-label="Kembali ke detail project" className="icon-btn">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-muted">Custom domain &amp; SSL</p>
            <h1 className="font-display truncate text-3xl font-extrabold tracking-tight">
              {data?.project?.name || 'Domain project'}
            </h1>
          </div>
        </div>
        <button type="button" onClick={fetchDomains} className="btn-secondary px-4 py-2.5 text-sm">
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

      {/* Subdomain bawaan */}
      <section className="mt-8 rounded-3xl border-2 border-ink bg-ink p-8 text-paper shadow-block">
        <p className="flex items-center gap-2 text-sm font-semibold opacity-85">
          <Globe className="h-4 w-4" /> Subdomain bawaan
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <a
            href={`https://${defaultSubdomain}`}
            target="_blank"
            rel="noreferrer"
            className="font-display break-all text-2xl font-extrabold underline underline-offset-4"
          >
            {defaultSubdomain || '—'} <ExternalLink className="inline h-4 w-4" />
          </a>
          <button
            type="button"
            onClick={() => copyText(defaultSubdomain, 'default')}
            className="inline-flex items-center gap-2 rounded-lg border-2 border-paper/40 px-3 py-1.5 text-xs font-bold"
          >
            {copied === 'default' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied === 'default' ? 'Tersalin' : 'Salin'}
          </button>
        </div>
        <p className="mt-2 text-sm opacity-80">Aktif otomatis, tanpa konfigurasi DNS.</p>
      </section>

      {/* Instruksi DNS */}
      <section className="card mt-8 p-6 md:p-8">
        <h2 className="font-display border-b-2 border-ink pb-3 text-2xl font-bold">Atur A Record</h2>
        <p className="mt-4 text-sm text-muted">
          Di panel DNS domainmu, tambahkan record berikut. Untuk domain utama gunakan <code className="font-mono">@</code>,
          untuk subdomain gunakan labelnya (misal <code className="font-mono">app</code>).
        </p>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b-2 border-ink bg-paper text-xs tracking-wide uppercase">
                <th className="p-3 font-bold">Type</th>
                <th className="p-3 font-bold">Name / Host</th>
                <th className="p-3 font-bold">Value</th>
                <th className="p-3 font-bold">TTL</th>
                <th className="p-3 font-bold">Salin</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="p-3 font-mono font-bold">A</td>
                <td className="p-3 font-mono">@</td>
                <td className="p-3 font-mono">{serverIp}</td>
                <td className="p-3 font-mono">3600</td>
                <td className="p-3">
                  <button
                    type="button"
                    onClick={() => copyText(serverIp, 'ip')}
                    className="inline-flex items-center gap-1.5 rounded-lg border-2 border-ink px-3 py-1.5 text-xs font-bold"
                  >
                    {copied === 'ip' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied === 'ip' ? 'Tersalin' : 'Salin IP'}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Tambah domain */}
      <section className="card mt-8 p-6 md:p-8">
        <h2 className="font-display border-b-2 border-ink pb-3 text-2xl font-bold">Tambah custom domain</h2>
        <form onSubmit={handleAdd} className="mt-5 flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            required
            className="field flex-1 font-mono text-sm"
            placeholder="app.namadomain.com"
            value={domainInput}
            onChange={(event) => setDomainInput(event.target.value)}
          />
          <button type="submit" disabled={submitting} className="btn-primary px-5 py-3 text-sm">
            <Plus className="h-4 w-4" /> {submitting ? 'Menambahkan...' : 'Tambah domain'}
          </button>
        </form>
        <p className="mt-2 text-sm text-muted">Maksimal 5 domain per project. Jangan sertakan https://.</p>
      </section>

      {/* Daftar domain */}
      <section className="mt-8">
        <h2 className="font-display text-2xl font-extrabold tracking-tight">Domain terdaftar</h2>

        {loading ? (
          <p className="mt-6 animate-pulse text-muted">Memuat domain...</p>
        ) : (data?.domains?.length ?? 0) === 0 ? (
          <div className="mt-6 rounded-2xl border-2 border-dashed border-ink p-10 text-center">
            <Globe className="mx-auto h-10 w-10" />
            <p className="font-display mt-4 text-xl font-bold">Belum ada custom domain.</p>
            <p className="mt-2 text-muted">Tambahkan domain di atas setelah mengatur A Record.</p>
          </div>
        ) : (
          <ul className="mt-6 space-y-4">
            {data.domains.map((domain) => {
              const dns = DNS_STATUS[domain.dns_status] || DNS_STATUS.pending;
              const ssl = SSL_STATUS[domain.ssl_status] || SSL_STATUS.none;
              const isBusy = busyId === domain.id;

              return (
                <li key={domain.id} className="card p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-display break-all text-xl font-bold">{domain.domain}</p>
                      <p className="mt-1 text-sm text-muted">
                        Ditambahkan {new Date(domain.created_at).toLocaleString('id-ID')}
                        {domain.ssl_issued_at ? ` · SSL terbit ${new Date(domain.ssl_issued_at).toLocaleDateString('id-ID')}` : ''}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className={`rounded-md px-2.5 py-1 text-xs font-bold uppercase ${dns.className}`}>{dns.label}</span>
                      <span className={`rounded-md px-2.5 py-1 text-xs font-bold uppercase ${ssl.className}`}>{ssl.label}</span>
                    </div>
                  </div>

                  {domain.last_error && (
                    <div className="mt-4 flex items-start gap-3 rounded-xl border-2 border-danger p-4 text-sm text-danger">
                      <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" />
                      <p>{domain.last_error}</p>
                    </div>
                  )}

                  <div className="mt-5 flex flex-wrap gap-2 border-t-2 border-ink pt-4">
                    <button
                      type="button"
                      onClick={() => handleVerify(domain)}
                      disabled={isBusy}
                      className="btn-secondary px-4 py-2.5 text-sm"
                    >
                      <RefreshCw className={`h-4 w-4 ${isBusy ? 'animate-spin' : ''}`} /> Cek DNS
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSsl(domain)}
                      disabled={isBusy || domain.dns_status !== 'verified'}
                      className="btn-primary px-4 py-2.5 text-sm"
                    >
                      <ShieldCheck className="h-4 w-4" /> Terbitkan SSL
                    </button>
                    {domain.ssl_status === 'issued' && (
                      <a
                        href={`https://${domain.domain}`}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-secondary px-4 py-2.5 text-sm"
                      >
                        Buka <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDelete(domain)}
                      disabled={isBusy}
                      className="btn-secondary ml-auto px-4 py-2.5 text-sm text-danger"
                    >
                      <Trash2 className="h-4 w-4" /> Hapus
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link to={`/projects/${id}`} className="btn-secondary px-5 py-3 text-sm">
          Detail project
        </Link>
        <Link to={`/projects/${id}/env`} className="btn-secondary px-5 py-3 text-sm">
          Environment variables
        </Link>
      </div>
    </AppLayout>
  );
}
