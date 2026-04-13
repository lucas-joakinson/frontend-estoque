import axios from 'axios';
import { toast } from 'sonner';

const api = axios.create({
  baseURL: 'http://localhost:3000',
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
      toast.error('Erro de conexão: O servidor parece estar offline ou inacessível.');
      return Promise.reject(error);
    }

    const { status } = error.response;

    if (status === 401 && !window.location.pathname.includes('/login')) {
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      window.location.href = '/login';
      toast.error('Sessão expirada. Por favor, faça login novamente.');
    }

    if (status === 403) {
      toast.error('Acesso negado: Você não tem permissão para realizar esta ação.');
    }

    if (status === 500) {
      toast.error('Erro interno do servidor. Nossa equipe técnica já foi notificada.');
    }

    return Promise.reject(error);
  }
);

export default api;
