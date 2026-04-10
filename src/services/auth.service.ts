import api from '../lib/api';
import type { AuthResponse } from '../types';

export const authService = {
  async login(matricula: string, password: string): Promise<AuthResponse> {
    const { data } = await api.post('/auth/login', { matricula, password });
    return data;
  },
  async register(matricula: string, password: string): Promise<void> {
    await api.post('/auth/register', { matricula, password });
  },
};
