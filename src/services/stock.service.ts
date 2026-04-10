import api from '../lib/api';
import type { StockMovement } from '../types';

export const stockService = {
  async stockIn(productId: string, quantity: number, reason?: string): Promise<void> {
    await api.post('/stock/in', { productId, quantity, reason });
  },
  async stockOut(productId: string, quantity: number, reason?: string): Promise<void> {
    await api.post('/stock/out', { productId, quantity, reason });
  },
  async getMovements(): Promise<StockMovement[]> {
    const { data } = await api.get('/stock/movements');
    return data;
  },
  async updateMovement(id: string, reason: string): Promise<void> {
    await api.patch(`/stock/movements/${id}`, { reason });
  },
};
