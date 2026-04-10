import api from '../lib/api';
import type { Category } from '../types';

export const categoryService = {
  async getAll(): Promise<Category[]> {
    const { data } = await api.get('/categories');
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
