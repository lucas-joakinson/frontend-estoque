import api from '../lib/api';
import type { Category, CategoriesResponse } from '../types';

export const categoryService = {
  async getAll(page = 1, limit = 10, search = '', sortBy = 'name', order = 'asc'): Promise<CategoriesResponse | Category[]> {
    const response = await api.get('/categories', {
      params: { page, limit, search, sortBy, order }
    });
    return response.data;
  },

  async create(name: string): Promise<Category> {
    const response = await api.post('/categories', { name });
    return response.data;
  },

  async update(id: string, name: string): Promise<Category> {
    const response = await api.post(`/categories/${id}`, { name });
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/categories/${id}`);
  }
};
