import api from '../lib/api';
import type { UsersResponse } from '../types';

export const userService = {
  async listUsers(page = 1, limit = 10, search = '', sortBy = 'createdAt', order = 'desc'): Promise<UsersResponse> {
    const { data } = await api.get('/users', {
      params: { page, limit, search, sortBy, order }
    });
    return data;
  },

  async deleteUser(id: string): Promise<void> {
    await api.delete(`/users/${id}`);
  }
};
