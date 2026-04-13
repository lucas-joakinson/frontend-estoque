import api from '../lib/api';
import type { Product, ProductsResponse } from '../types';

export const productService = {
  async listProducts(page = 1, limit = 10, search = '', sortBy = 'createdAt', order = 'desc'): Promise<ProductsResponse> {
    const response = await api.get('/products', {
      params: { page, limit, search, sortBy, order },
    });
    return response.data;
  },

  async createProduct(name: string, categoryId: string, brand?: string): Promise<Product> {
    const response = await api.post('/products', { name, categoryId, brand });
    return response.data;
  },

  async deleteProduct(id: string): Promise<void> {
    await api.delete(`/products/${id}`);
  },
};
