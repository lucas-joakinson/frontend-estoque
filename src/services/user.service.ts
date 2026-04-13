import api from '../lib/api';
import type { User, UsersResponse } from '../types';

export const userService = {
  async listUsers(
    page = 1, 
    limit = 10, 
    search = '', 
    role?: string,
    sortBy = 'createdAt', 
    order = 'desc'
  ): Promise<UsersResponse> {
    const params: any = { page, limit, search, sortBy, order };
    if (role) params.role = role;

    const response = await api.get('/users', { params });
    return response.data;
  },

  async createUser(matricula: string, password: string, role: 'ADMIN' | 'OPERATOR'): Promise<User> {
    const response = await api.post('/users', { matricula, password, role });
    return response.data;
  },

  async deleteUser(id: string): Promise<void> {
    await api.delete(`/users/${id}`);
  },

  async updateUser(id: string, data: { password?: string; role?: 'ADMIN' | 'OPERATOR' }): Promise<User> {
    const response = await api.patch(`/users/${id}`, data);
    return response.data;
  },
};
