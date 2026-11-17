import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { AuthContext } from './auth';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Ambil data user aktif sekali saat aplikasi dimuat.
  // Dipakai juga oleh ProtectedRoute untuk menentukan role.
  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await api.get('/user');
        setUser(res.data);
      } catch (err) {
        if (err.response?.status === 401) {
          localStorage.removeItem('auth_token');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const login = (token, userData) => {
    localStorage.setItem('auth_token', token);
    setUser(userData);
  };

  const logout = async () => {
    try {
      await api.post('/logout');
    } catch {
      // Token mungkin sudah tidak valid, tetap bersihkan sesi lokal.
    }
    localStorage.removeItem('auth_token');
    setUser(null);
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
