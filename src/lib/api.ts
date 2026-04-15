import axios from 'axios';
import { toast } from 'sonner';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3333',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    if (response.data && typeof response.data === 'object') {
      const { data } = response.data;
      
      if (data !== undefined && (Object.keys(response.data).length <= 2)) {
        return { ...response, data: data };
      }
    }
    return response;
  },
  (error) => {
    if (!error.response) {
      toast.error('Erro de conexão: Servidor offline.');
      return Promise.reject(error);
    }

    const { status } = error.response;

    if (status === 401 && !window.location.pathname.includes('/login')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('role');
      toast.error('Sessão expirada. Faça login novamente.');
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

