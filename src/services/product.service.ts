import api from '../lib/api';
import type { Product } from '../types';

export const productService = {
  async getAll(): Promise<Product[]> {
    const { data } = await api.get('/products');
    return data;
  },
  async create(name: string, sku: string, categoryId: string): Promise<Product> {
    const { data } = await api.post('/products', { name, sku, categoryId });
    return data;
  },
  async update(id: string, name: string, sku: string, categoryId: string): Promise<Product> {
    const { data } = await api.put(`/products/${id}`, { name, sku, categoryId });
    return data;
  },
  async delete(id: string): Promise<void> {
    await api.delete(`/products/${id}`);
  },
};
