import api from '../lib/api';
import type { Headset, HeadsetsResponse, HeadsetHistory } from '../types';

export const headsetService = {
  async listHeadsets(page = 1, limit = 10, search = '', status?: string): Promise<HeadsetsResponse> {
    const response = await api.get('/headsets', {
      params: { page, limit, search, status },
    });
    return response.data;
  },

  async getHeadsetById(id: string): Promise<Headset> {
    const response = await api.get(`/headsets/${id}`);
    return response.data;
  },

  async createHeadset(data: Omit<Headset, 'id' | 'createdAt' | 'updatedAt'>): Promise<Headset> {
    const response = await api.post('/headsets', data);
    return response.data;
  },

  async bulkCreateHeadsets(data: Omit<Headset, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<{ count: number }> {
    const response = await api.post('/headsets/bulk', data);
    return response.data;
  },

  async updateHeadset(id: string, data: Partial<Omit<Headset, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Headset> {
    const response = await api.put(`/headsets/${id}`, data);
    return response.data;
  },

  async deleteHeadset(id: string): Promise<void> {
    await api.delete(`/headsets/${id}`);
  },

  async getHeadsetHistory(id: string): Promise<HeadsetHistory[]> {
    const response = await api.get(`/headsets/${id}/history`);
    return response.data;
  },
};
