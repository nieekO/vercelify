import { useState, useEffect } from 'react';
import api from '../services/api';

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('vercelify_token');
    if (!token) { setIsAuthenticated(false); return; }
    api.get('/auth/verify')
      .then(res => setIsAuthenticated(res.data.valid))
      .catch(() => setIsAuthenticated(false));
  }, []);

  const login = async (password: string): Promise<void> => {
    const res = await api.post('/auth/login', { password });
    localStorage.setItem('vercelify_token', res.data.token);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('vercelify_token');
    setIsAuthenticated(false);
  };

  return { isAuthenticated, login, logout };
}
