import api from '../lib/api';
import type { ProductsResponse } from '../types';

export const productService = {
  async listProducts(page = 1, limit = 10, search = '', sortBy = 'createdAt', order = 'desc'): Promise<ProductsResponse> {
    const { data } = await api.get('/products', {
      params: { page, limit, search, sortBy, order }
    });
    return data;
  },

  async createProduct(name: string, categoryId: string, brand?: string): Promise<void> {
    await api.post('/products', { name, categoryId, brand });
  },

  async deleteProduct(id: string): Promise<void> {
    await api.delete(`/products/${id}`);
  }
};
