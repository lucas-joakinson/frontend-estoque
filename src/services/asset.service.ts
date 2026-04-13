import api from '../lib/api';
import type { Asset, AssetHistory, AssetStatus, AssetsResponse } from '../types';

export const assetService = {
  async listAssets(
    page = 1, 
    limit = 10, 
    search = '', 
    status?: string, 
    categoryId?: string,
    sortBy = 'createdAt', 
    order = 'desc'
  ): Promise<AssetsResponse> {
    const params: any = { page, limit, search, sortBy, order };
    if (status) params.status = status;
    if (categoryId) params.categoryId = categoryId;

    const response = await api.get('/assets', { params });
    return response.data;
  },

  async createAsset(data: { patrimonio: string; productId: string; status: AssetStatus; location: string }): Promise<Asset> {
    const response = await api.post('/assets', data);
    return response.data;
  },

  async updateAsset(id: string, data: { status: AssetStatus; location: string; notes?: string }): Promise<Asset> {
    const response = await api.post(`/assets/${id}`, data);
    return response.data;
  },

  async deleteAsset(id: string): Promise<void> {
    await api.delete(`/assets/${id}`);
  },

  async getAssetHistory(assetId: string): Promise<AssetHistory[]> {
    const response = await api.get(`/assets/${assetId}/history`);
    return response.data;
  },

  async exportAssets() {
    try {
      const response = await api.get('/assets', {
        params: { limit: 10000 }
      });
      
      const assets: Asset[] = response.data.assets || response.data;
      
      if (!Array.isArray(assets)) {
        throw new Error('Formato de dados inválido para exportação');
      }

      const headers = ['Patrimonio', 'Produto', 'Marca', 'Categoria', 'Status', 'Localizacao', 'Data Cadastro'];
      const rows = assets.map(asset => [
        asset.patrimonio,
        asset.product.name,
        asset.product.brand || '',
        asset.product.category.name,
        asset.status,
        asset.location,
        new Date(asset.createdAt).toLocaleDateString()
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      ].join('\n');

      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `relatorio_ativos_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Erro na exportação:', error);
      throw error;
    }
  }
};
