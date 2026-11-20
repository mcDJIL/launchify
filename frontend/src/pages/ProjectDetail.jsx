import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Activity, KeyRound, Globe, Trash2 } from 'lucide-react';
import api from '../utils/api';
import ProjectOperations from './ProjectOperation';
import ThemeToggle from '../components/ThemeToggle';

const STATUS_CLASS = {
  active: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  suspended: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
  stopped: 'bg-paper text-ink',
};

const DEPLOYMENT_CLASS = {
  success: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  failed: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
  processing: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  pending: 'bg-paper text-ink',
};

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [error, setError] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    const confirmed = window.confirm(
      `Hapus project "${project.name}"?\n\nContainer, database, dan semua data project ini akan dihapus permanen.`
    );
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      await api.delete(`/projects/${project.id}`);
      alert('Project berhasil dihapus.');
      navigate('/dashboard');
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menghapus project.');
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const res = await api.get(`/projects/${id}`);
        setProject(res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Project tidak ditemukan.');
      }
    };
    fetchProject();
  }, [id]);

  if (error) {
    return (
      <div className="min-h-screen bg-paper px-6 py-10 font-sans text-ink md:px-10">
        <div className="mx-auto max-w-5xl">
          <Link to="/dashboard" className="font-semibold underline underline-offset-4">
            Kembali ke dashboard
          </Link>
          <div role="alert" className="mt-6 rounded-xl border-2 border-danger p-4 font-semibold text-danger">{error}</div>
        </div>
      </div>
    );
  }

  if (!project) {
    return <div className="flex min-h-screen items-center justify-center bg-paper text-muted">Memuat detail project...</div>;
  }

  const cleanName = project.name.toLowerCase().replace(/[^a-z0-9-]/g, '');
  const projectUrl = `https://${cleanName}.app.launchify.site`;
  const deployments = [...(project.deployments || [])].sort((a, b) => b.id - a.id).slice(0, 10);

  return (
    <div className="min-h-screen bg-paper px-6 py-8 font-sans text-ink md:px-10 md:py-10">
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-4">
            <Link to="/dashboard" aria-label="Kembali ke dashboard" className="icon-btn">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="font-display min-w-0 truncate text-3xl font-extrabold tracking-tight">{project.name}</h1>
            <span className={`shrink-0 rounded-md px-2.5 py-1 text-xs font-bold uppercase ${STATUS_CLASS[project.status] || STATUS_CLASS.stopped}`}>
              {project.status}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link to={`/projects/${project.id}/metrics`} className="btn-secondary px-4 py-2.5 text-sm">
              <Activity className="h-4 w-4" /> Metrics
            </Link>
            <Link to={`/projects/${project.id}/env`} className="btn-secondary px-4 py-2.5 text-sm">
              <KeyRound className="h-4 w-4" /> Env
            </Link>
            <Link to={`/projects/${project.id}/domains`} className="btn-secondary px-4 py-2.5 text-sm">
              <Globe className="h-4 w-4" /> Domain
            </Link>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="inline-flex items-center gap-2 rounded-xl border-2 border-danger px-4 py-2.5 text-sm font-bold text-danger disabled:opacity-60"
            >
              <Trash2 className="h-4 w-4" /> {isDeleting ? 'Menghapus...' : 'Hapus'}
            </button>
            <ThemeToggle />
          </div>
        </div>

        <section aria-labelledby="section-info" className="card p-6 md:p-8">
          <h2 id="section-info" className="font-display border-b-2 border-ink pb-3 text-2xl font-bold">Informasi project</h2>
          <dl className="mt-6 grid grid-cols-1 gap-6 text-sm md:grid-cols-2">
            {project.status === 'active' && (
              <div className="rounded-xl border-2 border-ink bg-accent p-4 text-on-accent md:col-span-2">
                <dt className="text-xs font-bold tracking-wide uppercase">URL live</dt>
                <dd className="mt-1">
                  <a href={projectUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold underline underline-offset-4 break-all">
                    {projectUrl} <ExternalLink className="h-4 w-4 shrink-0" />
                  </a>
                </dd>
              </div>
            )}
            <div>
              <dt className="mb-1 text-muted">Framework</dt>
              <dd className="font-semibold capitalize">{project.framework}</dd>
            </div>
            <div>
              <dt className="mb-1 text-muted">Port internal</dt>
              <dd className="font-semibold">{project.docker_port}</dd>
            </div>
            <div className="md:col-span-2">
              <dt className="mb-1 text-muted">Repositori</dt>
              <dd>
                <a href={project.github_url} target="_blank" rel="noreferrer" className="font-semibold break-all underline underline-offset-4">
                  {project.github_url}
                </a>
              </dd>
            </div>
            <div>
              <dt className="mb-1 text-muted">Folder aplikasi</dt>
              <dd className="font-mono">{project.root_directory || '/ (root)'}</dd>
            </div>
            <div>
              <dt className="mb-1 text-muted">Biaya</dt>
              <dd className="font-semibold">Rp {project.hourly_rate}/jam</dd>
            </div>
          </dl>
        </section>

        <section aria-labelledby="section-deployments" className="card p-6 md:p-8">
          <h2 id="section-deployments" className="font-display border-b-2 border-ink pb-3 text-2xl font-bold">Riwayat deployment</h2>
          {deployments.length === 0 ? (
            <p className="py-8 text-center text-muted">Belum ada riwayat deployment.</p>
          ) : (
            <ul className="mt-6 divide-y-2 divide-ink rounded-xl border-2 border-ink">
              {deployments.map((deployment) => (
                <li key={deployment.id} className="flex items-center justify-between gap-4 p-4 text-sm">
                  <div>
                    <p className="font-semibold capitalize">{deployment.action}</p>
                    <p className="mt-1 text-xs text-muted">
                      {new Date(deployment.created_at).toLocaleString('id-ID')}
                    </p>
                  </div>
                  <span className={`shrink-0 rounded-md px-2.5 py-1 text-xs font-bold uppercase ${DEPLOYMENT_CLASS[deployment.status] || DEPLOYMENT_CLASS.pending}`}>
                    {deployment.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <ProjectOperations project={project} />
      </div>
    </div>
  );
}
