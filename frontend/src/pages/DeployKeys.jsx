import { useState, useEffect } from 'react';
import {
  KeyRound,
  Copy,
  Check,
  RefreshCw,
  Trash2,
  GitBranch,
  ShieldCheck,
  ShieldAlert,
  ExternalLink,
  Terminal,
  Upload,
} from 'lucide-react';
import api from '../utils/api';
import AppLayout from '../components/AppLayout';
import { useAuth } from '../context/auth';

const STEPS = [
  'Pilih salah satu: Generate otomatis di server, atau tempel private key hasil ssh-keygen milikmu sendiri.',
  'Salin public key yang muncul, lalu buka repo GitHub → Settings → Deploy keys → Add deploy key.',
  'Tempel public key, simpan. Write access tidak perlu dicentang untuk clone.',
  'Jalankan Build/Rebuild. URL GitHub https otomatis diubah ke SSH saat key tersedia.',
];

// Ubah URL repo GitHub (https atau SSH) menjadi https://github.com/owner/repo.
function githubRepoBase(url) {
  if (!url) return null;

  const https = url.match(/^https?:\/\/github\.com\/([^/]+)\/([^/]+?)(?:\.git)?\/?$/i);
  if (https) return `https://github.com/${https[1]}/${https[2]}`;

  const ssh = url.match(/^git@github\.com:([^/]+)\/(.+?)(?:\.git)?$/i);
  if (ssh) return `https://github.com/${ssh[1]}/${ssh[2]}`;

  return null;
}

export default function DeployKeys() {
  const { logout } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [copied, setCopied] = useState(null);
  const [manualFor, setManualFor] = useState(null);
  const [manualKey, setManualKey] = useState('');

  const fetchKeys = async () => {
    try {
      const res = await api.get('/settings/ssh-keys');
      setProjects(res.data.data || []);
      setError(null);
    } catch (err) {
      if (err.response?.status === 401) {
        logout();
        return;
      }
      setError(err.response?.data?.message || 'Gagal mengambil data deploy key.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchKeys();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const copyText = async (text, key) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      setError('Browser menolak akses clipboard. Salin public key secara manual.');
    }
  };

  const handleGenerate = async (project, regenerate = false) => {
    if (
      regenerate &&
      !window.confirm(`Buat ulang key untuk ${project.name}? Key lama langsung tidak berlaku dan harus diganti di GitHub.`)
    ) {
      return;
    }

    setBusyId(project.project_id);
    setError(null);
    setNotice(null);
    try {
      const res = await api.post(`/projects/${project.project_id}/deploy-key`, { regenerate });
      setNotice({ type: 'success', text: res.data.message });
      await fetchKeys();
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal membuat deploy key.');
    } finally {
      setBusyId(null);
    }
  };

  const handleUploadKey = async (project) => {
    if (!manualKey.trim()) {
      setError('Tempel private key terlebih dahulu.');
      return;
    }

    setBusyId(project.project_id);
    setError(null);
    setNotice(null);
    try {
      const res = await api.post(`/projects/${project.project_id}/deploy-key`, {
        private_key: manualKey,
        regenerate: true,
      });
      setNotice({ type: 'success', text: res.data.message });
      setManualKey('');
      setManualFor(null);
      await fetchKeys();
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menyimpan private key.');
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (project) => {
    if (!window.confirm(`Hapus deploy key untuk ${project.name}? Hapus juga di GitHub agar tidak tertinggal.`)) return;

    setBusyId(project.project_id);
    setError(null);
    setNotice(null);
    try {
      const res = await api.delete(`/projects/${project.project_id}/deploy-key`);
      setNotice({ type: 'success', text: res.data.message });
      await fetchKeys();
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menghapus deploy key.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <AppLayout active="ssh-keys">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-extrabold tracking-tight">Deploy Keys &amp; GitHub</h1>
          <p className="mt-2 text-muted">
            Buat SSH deploy key per project agar repositori GitHub private bisa di-clone saat build.
          </p>
        </div>
        <button type="button" onClick={fetchKeys} className="btn-secondary px-5 py-3 text-sm">
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

      <section className="card mt-8 p-6 md:p-8">
        <h2 className="font-display flex items-center gap-2 border-b-2 border-ink pb-3 text-2xl font-bold">
          <GitBranch className="h-6 w-6" /> Cara pakai
        </h2>
        <ol className="mt-5 space-y-3">
          {STEPS.map((step, index) => (
            <li key={step} className="flex items-start gap-3 text-sm">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-2 border-ink bg-paper text-xs font-bold">
                {index + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
        <p className="mt-5 rounded-xl border-2 border-hair bg-paper p-4 text-sm text-muted">
          Private key disimpan di server dan tidak pernah ditampilkan kembali. Hanya public key yang bisa disalin.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-2xl font-extrabold tracking-tight">Project</h2>

        {loading ? (
          <p className="mt-6 animate-pulse text-muted">Memuat project...</p>
        ) : projects.length === 0 ? (
          <div className="mt-6 rounded-2xl border-2 border-dashed border-ink p-10 text-center">
            <GitBranch className="mx-auto h-10 w-10" />
            <p className="font-display mt-4 text-xl font-bold">Belum ada project.</p>
            <p className="mt-2 text-muted">Buat project terlebih dahulu di dashboard.</p>
          </div>
        ) : (
          <ul className="mt-6 space-y-4">
            {projects.map((project) => {
              const isBusy = busyId === project.project_id;
              const copyKey = `key-${project.project_id}`;
              const repoBase = githubRepoBase(project.github_url);
              const manualOpen = manualFor === project.project_id;
              const slug = project.name.toLowerCase().replace(/[^a-z0-9-]/g, '-');

              return (
                <li key={project.project_id} className="card p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-display text-xl font-bold">{project.name}</p>
                      <p className="mt-1 truncate font-mono text-xs text-muted">{project.github_url}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {project.has_key && (
                        <span className="rounded-md bg-paper px-2.5 py-1 text-xs font-bold uppercase">
                          {project.source === 'uploaded' ? 'Key dari kamu' : 'Dibuat server'}
                        </span>
                      )}
                      <span
                        className={`inline-flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-bold uppercase ${
                          project.has_key
                            ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200'
                            : 'bg-paper text-ink'
                        }`}
                      >
                        <ShieldCheck className="h-3.5 w-3.5" />
                        {project.has_key ? 'Key aktif' : 'Belum ada key'}
                      </span>
                    </div>
                  </div>

                  {project.has_key ? (
                    <>
                      <div className="mt-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <p className="text-sm font-semibold">Public key</p>
                          <button
                            type="button"
                            onClick={() => copyText(project.public_key, copyKey)}
                            className="inline-flex items-center gap-1.5 rounded-lg border-2 border-ink px-3 py-1.5 text-xs font-bold"
                          >
                            {copied === copyKey ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                            {copied === copyKey ? 'Tersalin' : 'Salin public key'}
                          </button>
                        </div>
                        <pre className="mt-2 overflow-x-auto rounded-xl border-2 border-ink bg-[#0e1116] p-4 font-mono text-xs leading-relaxed break-all whitespace-pre-wrap text-[#c7f464]">
                          {project.public_key}
                        </pre>
                      </div>

                      <div className="mt-4 rounded-xl border-2 border-ink bg-paper p-4">
                        <p className="text-sm font-bold">Langkah selanjutnya di GitHub</p>
                        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm">
                          <li>Klik tombol salin di atas.</li>
                          <li>
                            Buka{' '}
                            {repoBase ? (
                              <a
                                href={`${repoBase}/settings/keys`}
                                target="_blank"
                                rel="noreferrer"
                                className="font-semibold underline underline-offset-4"
                              >
                                Deploy keys repo ini
                              </a>
                            ) : (
                              <span className="font-semibold">Settings → Deploy keys</span>
                            )}
                            , lalu <strong>Add deploy key</strong>.
                          </li>
                          <li>Tempel public key, beri nama bebas, simpan.</li>
                          <li>Kembali ke dashboard, klik <strong>Build</strong> atau <strong>Update</strong>.</li>
                        </ol>
                        {repoBase && (
                          <a
                            href={`${repoBase}/settings/keys`}
                            target="_blank"
                            rel="noreferrer"
                            className="btn-secondary mt-3 px-4 py-2 text-sm"
                          >
                            Buka Deploy keys GitHub <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                      </div>

                      <dl className="mt-4 flex flex-wrap gap-x-8 gap-y-2 text-sm">
                        <div>
                          <dt className="text-muted">Fingerprint</dt>
                          <dd className="font-mono text-xs font-semibold">{project.fingerprint || '—'}</dd>
                        </div>
                        <div>
                          <dt className="text-muted">Dibuat</dt>
                          <dd className="font-semibold">
                            {project.created_at ? new Date(project.created_at).toLocaleString('id-ID') : '—'}
                          </dd>
                        </div>
                      </dl>
                    </>
                  ) : (
                    <p className="mt-4 rounded-xl border-2 border-hair p-4 text-sm text-muted">
                      Belum ada deploy key. Generate di server, atau tempel private key buatanmu sendiri di bawah.
                    </p>
                  )}

                  {manualOpen && (
                    <div className="mt-5 rounded-xl border-2 border-ink p-4">
                      <div className="flex items-start gap-3">
                        <Terminal className="mt-0.5 h-5 w-5 shrink-0" />
                        <div className="min-w-0 text-sm">
                          <p className="font-bold">Buat key sendiri di komputermu</p>
                          <p className="mt-1 text-muted">Jalankan di terminal (tanpa passphrase):</p>
                          <pre className="mt-2 overflow-x-auto rounded-lg border-2 border-ink bg-[#0e1116] p-3 font-mono text-xs text-[#c7f464]">
{`ssh-keygen -t ed25519 -C "launchify-${slug}" -f ~/.ssh/launchify_${slug}
cat ~/.ssh/launchify_${slug}.pub`}
                          </pre>
                          <p className="mt-2 text-muted">
                            Public key dari perintah <code className="font-mono">cat</code> tetap perlu ditempel ke GitHub.
                            Private key di bawah akan dipakai server untuk clone dan tidak ditampilkan lagi.
                          </p>
                        </div>
                      </div>

                      <div className="mt-4">
                        <label htmlFor={`private-key-${project.project_id}`} className="mb-2 block text-sm font-semibold">
                          Private key
                        </label>
                        <textarea
                          id={`private-key-${project.project_id}`}
                          className="field min-h-36 font-mono text-xs"
                          spellCheck={false}
                          autoComplete="off"
                          placeholder={'-----BEGIN OPENSSH PRIVATE KEY-----\n...\n-----END OPENSSH PRIVATE KEY-----'}
                          value={manualKey}
                          onChange={(event) => setManualKey(event.target.value)}
                        />
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => handleUploadKey(project)}
                            disabled={isBusy}
                            className="btn-primary px-4 py-2.5 text-sm"
                          >
                            <Upload className="h-4 w-4" /> {isBusy ? 'Menyimpan...' : 'Simpan key saya'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setManualFor(null);
                              setManualKey('');
                            }}
                            className="btn-secondary px-4 py-2.5 text-sm"
                          >
                            Batal
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mt-5 flex flex-wrap gap-2 border-t-2 border-ink pt-4">
                    <button
                      type="button"
                      onClick={() => handleGenerate(project, project.has_key)}
                      disabled={isBusy}
                      className={project.has_key ? 'btn-secondary px-4 py-2.5 text-sm' : 'btn-primary px-4 py-2.5 text-sm'}
                    >
                      <KeyRound className={`h-4 w-4 ${isBusy ? 'animate-pulse' : ''}`} />
                      {isBusy ? 'Memproses...' : project.has_key ? 'Regenerate' : 'Generate di server'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setManualFor(manualOpen ? null : project.project_id);
                        setManualKey('');
                        setError(null);
                      }}
                      className="btn-secondary px-4 py-2.5 text-sm"
                    >
                      <Terminal className="h-4 w-4" /> {manualOpen ? 'Tutup key sendiri' : 'Pakai key sendiri'}
                    </button>
                    {project.has_key && (
                      <button
                        type="button"
                        onClick={() => handleDelete(project)}
                        disabled={isBusy}
                        className="btn-secondary ml-auto px-4 py-2.5 text-sm text-danger"
                      >
                        <Trash2 className="h-4 w-4" /> Hapus key
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <div className="mt-10 flex items-start gap-3 rounded-xl border-2 border-hair bg-surface p-4 text-sm text-muted">
        <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" />
        <p>
          Hanya tempel private key yang memang kamu buat untuk project ini. Jangan gunakan key pribadi yang dipakai
          untuk akun GitHub-mu. Setelah build berhasil, key tetap tersimpan agar update berikutnya bisa clone repo private.
        </p>
      </div>
    </AppLayout>
  );
}
