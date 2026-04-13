import axios from 'axios';
import { toast } from 'sonner';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      toast.error('Erro de conexão: Servidor offline.');
      return Promise.reject(error);
    }

    const { status } = error.response;

    if (status === 401 && !window.location.pathname.includes('/login')) {
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      toast.error('Sessão expirada. Faça login novamente.');
    
      setTimeout(() => {
        window.location.href = '/login';
      }, 1500);
    }

    if (status === 403) {
      toast.error('Acesso negado.');
    }

    if (status >= 500) {
      toast.error('Erro interno no servidor.');
    }

    return Promise.reject(error);
  }
);

export default api;

