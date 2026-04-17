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

  async createAsset(data: { patrimonio: string; productId: string; status: AssetStatus; location: string; responsible?: string | null }): Promise<Asset> {
    const response = await api.post('/assets', data);
    return response.data;
  },

  async bulkCreateAssets(data: { patrimonio: string; productId: string; status: AssetStatus; location: string; responsible?: string | null }[]): Promise<{ count: number }> {
    const response = await api.post('/assets/bulk', data);
    return response.data;
  },

  async updateAsset(id: string, data: { status: AssetStatus; location: string; responsible?: string | null; observation?: string }): Promise<Asset> {
    const response = await api.patch(`/assets/${id}`, data);
    return response.data;
  },

  async deleteAsset(id: string): Promise<void> {
    await api.delete(`/assets/${id}`);
  },

  async getAssetHistory(assetId: string): Promise<AssetHistory[]> {
    const response = await api.get(`/assets/${assetId}/history`);
    return response.data;
  },

  async getStats(): Promise<Record<AssetStatus, number>> {
    const response = await api.get('/assets/stats');
    return response.data;
  },

  async exportAssets(search = '', status?: string, categoryId?: string) {
    try {
      const LIMIT_PER_REQUEST = 100;
      let allAssets: Asset[] = [];
      
      // Primeira requisição para saber o total de páginas
      const firstResponse = await this.listAssets(1, LIMIT_PER_REQUEST, search, status, categoryId);
      allAssets = [...firstResponse.assets];
      
      const totalPages = firstResponse.pagination.totalPages;

      // Busca as páginas restantes, se houver
      if (totalPages > 1) {
        const remainingPagesPromises = [];
        for (let p = 2; p <= totalPages; p++) {
          remainingPagesPromises.push(this.listAssets(p, LIMIT_PER_REQUEST, search, status, categoryId));
        }
        
        const remainingResponses = await Promise.all(remainingPagesPromises);
        remainingResponses.forEach(response => {
          allAssets = [...allAssets, ...response.assets];
        });
      }

      const headers = ['Patrimonio', 'Produto', 'Marca', 'Categoria', 'Status', 'Localizacao', 'Responsavel', 'Data Cadastro'];
      const rows = allAssets.map(asset => [
        asset.patrimonio,
        asset.product?.name || 'Item Removido',
        asset.product?.brand || '',
        asset.product?.category?.name || 'Sem Categoria',
        asset.status,
        asset.location,
        asset.responsible || 'Não informado',
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
