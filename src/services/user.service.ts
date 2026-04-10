import api from '../lib/api';
import type { UsersResponse } from '../types';

export const userService = {
  async listUsers(page = 1, limit = 10, search = '', sortBy = 'createdAt', order = 'desc'): Promise<UsersResponse> {
    const { data } = await api.get('/users', {
      params: { page, limit, search, sortBy, order }
    });
    return data;
  },

  async createUser(matricula: string, password: string, role: 'ADMIN' | 'OPERATOR'): Promise<void> {
    await api.post('/auth/register', { matricula, password, role });
  },

  async deleteUser(id: string): Promise<void> {
    await api.delete(`/users/${id}`);
  }
};
