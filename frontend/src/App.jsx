import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LandingPage from './pages/LandingPage';
import Login from './pages/LoginPage';
import Register from './pages/RegisterPage';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import TopUp from './pages/TopUp';
import CreateProject from './pages/CreateProjects';
import ProjectDetail from './pages/ProjectDetail';
import Panduan from './pages/Panduan';
import Artikel from './pages/Artikel';

// Scroll ke anchor (#fitur, #harga, dst.) saat pindah halaman, dan ke atas saat ganti halaman.
function ScrollManager() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const target = document.getElementById(hash.slice(1));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);

  return null;
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <ScrollManager />
        <div className="min-h-screen bg-paper text-ink font-sans">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/panduan" element={<Panduan />} />
            <Route path="/panduan/:slug" element={<Artikel />} />

            {/* Protected Routes - hanya user biasa */}
            <Route element={<ProtectedRoute role="user" />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/topup" element={<TopUp />} />
              <Route path="/projects/create" element={<CreateProject />} />
              <Route path="/projects/:id" element={<ProjectDetail />} />
            </Route>

            {/* Protected Routes - hanya admin */}
            <Route element={<ProtectedRoute role="admin" />}>
              <Route path="/admin" element={<AdminDashboard />} />
            </Route>
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
