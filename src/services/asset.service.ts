import api from '../lib/api';
import type { AssetsResponse, Asset, AssetHistory, AssetStatus } from '../types';

export const assetService = {
  async listAssets(page?: number, limit?: number, search?: string, sortBy?: string, order?: string): Promise<AssetsResponse> {
    const params: any = {};
    
    // Só envia se não for o valor padrão ou se for explicitamente solicitado
    if (page && page > 1) params.page = page;
    if (limit && limit !== 10) params.limit = limit;
    if (search) params.search = search;
    if (sortBy && sortBy !== 'createdAt') params.sortBy = sortBy;
    if (order && order !== 'desc') params.order = order;

    const { data } = await api.get('/assets', { params });
    return data;
  },

  async getAssetByPatrimonio(patrimonio: string): Promise<Asset> {
    const { data } = await api.get(`/assets/${patrimonio}`);
    return data;
  },

  async createAsset(data: { patrimonio: string; productId: string; status: AssetStatus; location: string }): Promise<void> {
    await api.post('/assets', data);
  },

  async updateAsset(id: string, data: { status?: AssetStatus; location?: string; notes?: string }): Promise<void> {
    await api.patch(`/assets/${id}`, data);
  },

  async getAssetHistory(id: string): Promise<AssetHistory[]> {
    const { data } = await api.get(`/assets/${id}/history`);
    return data;
  },

  async deleteAsset(id: string): Promise<void> {
    await api.delete(`/assets/${id}`);
  }
};
