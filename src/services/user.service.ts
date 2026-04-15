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

  async createUser(name: string, matricula: string, password: string, role: string): Promise<User> {
    const response = await api.post('/users', { name, matricula, password, role });
    return response.data;
  },

  async deleteUser(id: string): Promise<void> {
    await api.delete(`/users/${id}`);
  },

  async updateUser(id: string, data: { name?: string; password?: string; role?: string }): Promise<User> {
    const response = await api.patch(`/users/${id}`, data);
    return response.data;
  },

  async getProfile(): Promise<User> {
    const response = await api.get('/users/profile');
    return response.data;
  },

  async updateProfile(name: string): Promise<User> {
    const response = await api.patch('/users/profile', { name });
    return response.data;
  },

  async changePassword(data: any): Promise<void> {
    await api.patch('/users/password', data);
  },

  async uploadAvatar(file: File): Promise<User> {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post('/users/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};
