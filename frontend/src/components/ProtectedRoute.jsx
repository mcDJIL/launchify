import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/auth';

/**
 * Membatasi akses route berdasarkan role.
 * - role="user"  : hanya user biasa (admin dialihkan ke /admin)
 * - role="admin" : hanya admin (user biasa dialihkan ke /dashboard)
 */
export default function ProtectedRoute({ role }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper text-muted">
        Memeriksa sesi...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (role === 'admin' && user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  if (role === 'user' && user.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  return <Outlet />;
}
