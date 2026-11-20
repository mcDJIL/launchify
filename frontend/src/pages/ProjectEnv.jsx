import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Save,
  ClipboardPaste,
  ShieldAlert,
  Database,
  X,
} from 'lucide-react';
import api from '../utils/api';
import AppLayout from '../components/AppLayout';
import { useAuth } from '../context/auth';

let rowSeq = 0;
const nextId = () => `row-${++rowSeq}`;

// Ubah teks .env menjadi baris { key, value }.
function parseEnv(text) {
  return String(text || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .map((line) => {
      const index = line.indexOf('=');
      if (index === -1) return null;
      return {
        id: nextId(),
        key: line.slice(0, index).trim(),
        value: line.slice(index + 1),
        visible: false,
      };
    })
    .filter(Boolean);
}

export default function ProjectEnv() {
  const { id } = useParams();
  const { logout } = useAuth();
  const [rows, setRows] = useState([]);
  const [dbRows, setDbRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [showDb, setShowDb] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState('');

  useEffect(() => {
    const fetchEnv = async () => {
      try {
        const res = await api.get(`/projects/${id}/env`);
        setRows(parseEnv(res.data.env));
        setDbRows(parseEnv(res.data.db_env));
        setMeta(res.data);
      } catch (err) {
        if (err.response?.status === 401) {
          logout();
          return;
        }
        setError(err.response?.data?.message || 'Gagal mengambil environment variables.');
      } finally {
        setLoading(false);
      }
    };
    fetchEnv();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const updateRow = (rowId, field, value) => {
    setRows((current) => current.map((row) => (row.id === rowId ? { ...row, [field]: value } : row)));
  };

  const addRow = () => {
    setRows((current) => [...current, { id: nextId(), key: '', value: '', visible: true }]);
  };

  const removeRow = (rowId) => {
    setRows((current) => current.filter((row) => row.id !== rowId));
  };

  const allVisible = rows.length > 0 && rows.every((row) => row.visible);
  const toggleAll = () => {
    const next = !allVisible;
    setRows((current) => current.map((row) => ({ ...row, visible: next })));
  };

  const applyPaste = () => {
    const parsed = parseEnv(pasteText);
    if (parsed.length === 0) {
      setError('Tidak ada baris KEY=VALUE yang bisa dibaca dari teks yang ditempel.');
      return;
    }
    setRows(parsed);
    setPasteText('');
    setPasteOpen(false);
    setError(null);
    setNotice({ type: 'info', text: `${parsed.length} variabel dimuat dari teks. Klik Simpan untuk menerapkan.` });
  };

  const handleSave = async () => {
    setError(null);
    setNotice(null);

    const cleaned = rows
      .map((row) => ({ key: row.key.trim(), value: row.value }))
      .filter((row) => row.key !== '' || row.value !== '');

    const invalid = cleaned.find((row) => !/^[A-Za-z_][A-Za-z0-9_]*$/.test(row.key));
    if (invalid) {
      setError(`Key "${invalid.key || '(kosong)'}" tidak valid. Gunakan huruf, angka, dan underscore, diawali huruf.`);
      return;
    }

    const keys = cleaned.map((row) => row.key);
    const duplicate = keys.find((key, index) => keys.indexOf(key) !== index);
    if (duplicate) {
      setError(`Key ${duplicate} ditulis lebih dari sekali.`);
      return;
    }

    setSaving(true);
    try {
      const env = cleaned.map((row) => `${row.key}=${row.value}`).join('\n');
      const res = await api.put(`/projects/${id}/env`, { env });
      setRows(parseEnv(res.data.env));
      setNotice({ type: 'success', text: res.data.message });
    } catch (err) {
      if (err.response?.status === 401) {
        logout();
        return;
      }
      const message = err.response?.data?.message || err.response?.data?.errors?.env?.[0];
      setError(message || 'Gagal menyimpan environment variables.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout active="dashboard">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <Link to={`/projects/${id}`} aria-label="Kembali ke detail project" className="icon-btn">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-muted">Environment &amp; secret</p>
            <h1 className="font-display truncate text-3xl font-extrabold tracking-tight">
              {meta?.framework ? `Env project (${meta.framework})` : 'Environment variables'}
            </h1>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={toggleAll} className="btn-secondary px-4 py-2.5 text-sm">
            {allVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {allVisible ? 'Sembunyikan semua' : 'Tampilkan semua'}
          </button>
          <button type="button" onClick={() => setPasteOpen((open) => !open)} className="btn-secondary px-4 py-2.5 text-sm">
            <ClipboardPaste className="h-4 w-4" /> Tempel .env
          </button>
          <button type="button" onClick={handleSave} disabled={saving || loading} className="btn-primary px-5 py-2.5 text-sm">
            <Save className="h-4 w-4" /> {saving ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </div>

      <div className="mt-6 flex items-start gap-3 rounded-xl border-2 border-ink bg-surface p-4 text-sm">
        <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" />
        <p>
          Nilai di bawah bersifat rahasia. Disimpan sebagai <code className="font-mono">custom_env</code> pada project
          dan ikut ditulis ke <code className="font-mono">.env</code> saat build.
          {meta && !meta.supports_hot_reload && (
            <> Framework <strong>{meta.framework}</strong> membaca env saat build, jadi setelah menyimpan lakukan <strong>Rebuild</strong>.</>
          )}
        </p>
      </div>

      {error && (
        <div role="alert" className="mt-4 rounded-xl border-2 border-danger p-4 text-sm font-semibold text-danger">
          {error}
        </div>
      )}

      {notice && (
        <div
          role="status"
          className={`mt-4 flex items-start justify-between gap-3 rounded-xl border-2 p-4 text-sm font-semibold ${
            notice.type === 'success' ? 'border-ink bg-accent text-on-accent' : 'border-hair bg-surface'
          }`}
        >
          <span>{notice.text}</span>
          <button type="button" onClick={() => setNotice(null)} aria-label="Tutup notifikasi">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {pasteOpen && (
        <div className="card mt-6 p-6">
          <label htmlFor="bulk-env" className="mb-2 block font-semibold">
            Tempel isi .env
          </label>
          <textarea
            id="bulk-env"
            className="field min-h-40 font-mono text-sm"
            placeholder={'APP_NAME=Launchify\nAPP_KEY=base64:...\nMAIL_MAILER=smtp'}
            value={pasteText}
            onChange={(event) => setPasteText(event.target.value)}
          />
          <p className="mt-2 text-sm text-muted">
            Baris komentar dan baris kosong diabaikan. Isi yang ditempel akan menggantikan daftar saat ini.
          </p>
          <div className="mt-4 flex gap-2">
            <button type="button" onClick={applyPaste} className="btn-primary px-4 py-2.5 text-sm">
              Muat ke editor
            </button>
            <button type="button" onClick={() => setPasteOpen(false)} className="btn-secondary px-4 py-2.5 text-sm">
              Batal
            </button>
          </div>
        </div>
      )}

      <section className="mt-8">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-display text-2xl font-extrabold tracking-tight">Variabel aplikasi</h2>
          <button type="button" onClick={addRow} className="btn-secondary px-4 py-2.5 text-sm">
            <Plus className="h-4 w-4" /> Tambah variabel
          </button>
        </div>

        {loading ? (
          <p className="mt-6 animate-pulse text-muted">Memuat environment variables...</p>
        ) : rows.length === 0 ? (
          <div className="mt-6 rounded-2xl border-2 border-dashed border-ink p-10 text-center">
            <p className="font-display text-xl font-bold">Belum ada variabel.</p>
            <p className="mt-2 text-muted">Tambahkan satu per satu, atau tempel isi .env sekaligus.</p>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {rows.map((row) => (
              <div
                key={row.id}
                className="grid items-center gap-3 rounded-xl border-2 border-ink bg-surface p-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)_auto]"
              >
                <input
                  aria-label="Nama variabel"
                  className="field font-mono text-sm"
                  placeholder="NAMA_VARIABEL"
                  value={row.key}
                  onChange={(event) => updateRow(row.id, 'key', event.target.value)}
                />
                <div className="relative">
                  <input
                    aria-label={`Nilai ${row.key || 'variabel'}`}
                    type={row.visible ? 'text' : 'password'}
                    className="field pr-11 font-mono text-sm"
                    placeholder="nilai"
                    value={row.value}
                    onChange={(event) => updateRow(row.id, 'value', event.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => updateRow(row.id, 'visible', !row.visible)}
                    aria-label={row.visible ? 'Sembunyikan nilai' : 'Tampilkan nilai'}
                    className="absolute top-1/2 right-2 -translate-y-1/2 rounded-lg p-2 hover:bg-paper"
                  >
                    {row.visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => removeRow(row.id)}
                  aria-label={`Hapus ${row.key || 'variabel'}`}
                  className="justify-self-start rounded-lg border-2 border-ink p-2.5 text-danger hover:bg-paper sm:justify-self-auto"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {dbRows.length > 0 && (
        <section className="mt-10">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-display flex items-center gap-2 text-2xl font-extrabold tracking-tight">
              <Database className="h-5 w-5" /> Database (otomatis)
            </h2>
            <button type="button" onClick={() => setShowDb((value) => !value)} className="btn-secondary px-4 py-2.5 text-sm">
              {showDb ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {showDb ? 'Sembunyikan' : 'Tampilkan'}
            </button>
          </div>
          <p className="mt-1 text-sm text-muted">Disuntik otomatis saat build, tidak bisa diubah dari sini.</p>
          <dl className="mt-4 divide-y-2 divide-ink overflow-hidden rounded-xl border-2 border-ink bg-surface">
            {dbRows.map((row) => (
              <div key={row.id} className="flex items-center justify-between gap-4 p-4 text-sm">
                <dt className="font-mono font-semibold">{row.key}</dt>
                <dd className="font-mono break-all text-muted">{showDb ? row.value : '••••••••'}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      <div className="mt-10 flex flex-wrap gap-3">
        <Link to={`/projects/${id}`} className="btn-secondary px-5 py-3 text-sm">
          Detail project
        </Link>
        <Link to={`/projects/${id}/metrics`} className="btn-secondary px-5 py-3 text-sm">
          Lihat metrics
        </Link>
      </div>
    </AppLayout>
  );
}
