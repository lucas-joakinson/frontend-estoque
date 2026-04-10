import api from '../lib/api';
import type { Category, CategoriesResponse } from '../types';

export const categoryService = {
  async getAll(page?: number, limit?: number, search?: string): Promise<CategoriesResponse> {
    const params: any = {};
    if (page) params.page = page;
    if (limit) params.limit = limit;
    if (search) params.search = search;

    const { data } = await api.get('/categories', { params });
    return data;
  },
  async create(name: string): Promise<Category> {
    const { data } = await api.post('/categories', { name });
    return data;
  },
  async update(id: string, name: string): Promise<Category> {
    const { data } = await api.put(`/categories/${id}`, { name });
    return data;
  },
  async delete(id: string): Promise<void> {
    await api.delete(`/categories/${id}`);
  },
};
