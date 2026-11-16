import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Server, ArrowLeft, ExternalLink } from 'lucide-react';
import api from '../utils/api';
import ProjectOperations from './ProjectOperation';

const STATUS_CLASS = {
  active: 'bg-green-100 text-green-700',
  suspended: 'bg-red-100 text-red-700',
  stopped: 'bg-gray-100 text-gray-700',
};

const DEPLOYMENT_CLASS = {
  success: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
  processing: 'bg-amber-100 text-amber-700',
  pending: 'bg-gray-100 text-gray-700',
};

export default function ProjectDetail() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [error, setError] = useState(null);

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
      <div className="min-h-screen bg-gray-50 p-8 font-sans text-gray-800">
        <div className="max-w-5xl mx-auto">
          <Link to="/dashboard" className="text-sm text-blue-700 font-semibold hover:underline">
            ← Kembali ke Dashboard
          </Link>
          <div className="mt-6 p-4 bg-red-50 text-red-700 rounded-lg border border-red-100">{error}</div>
        </div>
      </div>
    );
  }

  if (!project) {
    return <div className="p-10 text-center text-gray-500">Memuat detail project...</div>;
  }

  const cleanName = project.name.toLowerCase().replace(/[^a-z0-9-]/g, '');
  const projectUrl = `https://${cleanName}.app.launchify.site`;
  const deployments = [...(project.deployments || [])].sort((a, b) => b.id - a.id).slice(0, 10);

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800 p-8">
      <div className="max-w-5xl mx-auto space-y-8">

        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="p-2 bg-white rounded-full shadow-sm hover:bg-gray-100 transition">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Server className="w-6 h-6 text-blue-700" /> {project.name}
          </h1>
          <span className={`text-xs px-2 py-1 rounded font-semibold uppercase ${STATUS_CLASS[project.status] || STATUS_CLASS.stopped}`}>
            {project.status}
          </span>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-6 border-b pb-2">Informasi Project</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            {project.status === 'active' && (
              <div className="md:col-span-2">
                <span className="text-gray-400 block mb-1">URL</span>
                <a href={projectUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-blue-700 font-semibold hover:underline">
                  {projectUrl} <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            )}
            <div>
              <span className="text-gray-400 block mb-1">Framework</span>
              <span className="font-semibold capitalize">{project.framework}</span>
            </div>
            <div>
              <span className="text-gray-400 block mb-1">Port Internal</span>
              <span className="font-semibold">{project.docker_port}</span>
            </div>
            <div className="md:col-span-2">
              <span className="text-gray-400 block mb-1">Repositori</span>
              <a href={project.github_url} target="_blank" rel="noreferrer" className="font-semibold text-blue-700 hover:underline break-all">
                {project.github_url}
              </a>
            </div>
            <div>
              <span className="text-gray-400 block mb-1">Folder Aplikasi</span>
              <span className="font-mono">{project.root_directory || '/ (root)'}</span>
            </div>
            <div>
              <span className="text-gray-400 block mb-1">Biaya</span>
              <span className="font-semibold">Rp {project.hourly_rate}/jam</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-6 border-b pb-2">Riwayat Deployment</h2>
          {deployments.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">Belum ada riwayat deployment.</p>
          ) : (
            <div className="divide-y border rounded-lg">
              {deployments.map((deployment) => (
                <div key={deployment.id} className="p-4 flex items-center justify-between text-sm">
                  <div>
                    <p className="font-semibold capitalize">{deployment.action}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(deployment.created_at).toLocaleString('id-ID')}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded font-semibold uppercase ${DEPLOYMENT_CLASS[deployment.status] || DEPLOYMENT_CLASS.pending}`}>
                    {deployment.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <ProjectOperations project={project} />
      </div>
    </div>
  );
}
