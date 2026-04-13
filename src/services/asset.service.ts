import api from '../lib/api';
import type { AssetsResponse, Asset, AssetHistory, AssetStatus } from '../types';

export const assetService = {
  async listAssets(page?: number, limit?: number, search?: string, sortBy?: string, order?: string): Promise<AssetsResponse> {
    const params: any = {};
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
    const payload = {
      ...data,
      observation: data.notes 
    };
    await api.patch(`/assets/${id}`, payload);
  },

  async getAssetHistory(id: string): Promise<AssetHistory[]> {
    try {
      const response = await api.get(`/assets/${id}/history`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        try {
          const altResponse = await api.get(`/assets/history/${id}`);
          return altResponse.data;
        } catch (altError) {
          console.error(`Falha total ao buscar histórico. O Backend não responde em /assets/:id/history nem em /assets/history/:id`);
          return [];
        }
      }
      throw error;
    }
  },

  async deleteAsset(id: string): Promise<void> {
    await api.delete(`/assets/${id}`);
  },

  async exportAssets(): Promise<void> {
    let allAssets: any[] = [];
    let currentPage = 1;
    let totalPages = 1;
    const LIMIT = 100; // Limite máximo do backend

    try {
      // Loop para buscar todas as páginas disponíveis
      do {
        const { data } = await api.get('/assets', { 
          params: { page: currentPage, limit: LIMIT } 
        });

        const pageAssets = Array.isArray(data) ? data : data.assets;
        const pagination = Array.isArray(data) ? null : data.pagination;

        allAssets = [...allAssets, ...pageAssets];
        
        if (pagination) {
          totalPages = pagination.totalPages;
          currentPage++;
        } else {
          break; // Se não houver paginação no retorno, para no primeiro fetch
        }
      } while (currentPage <= totalPages);

      if (allAssets.length === 0) {
        throw new Error('Nenhum dado encontrado para exportar.');
      }

      // Cabeçalhos das colunas
      const headers = ['Patrimonio', 'Item', 'Marca', 'Categoria', 'Status', 'Localizacao', 'Data Cadastro'];
      
      // Mapeamento dos dados
      const csvRows = allAssets.map((asset: any) => [
        asset.patrimonio,
        asset.product?.name || '',
        asset.product?.brand || '',
        asset.product?.category?.name || '',
        asset.status,
        asset.location,
        new Date(asset.createdAt).toLocaleDateString()
      ].map(value => `"${String(value).replace(/"/g, '""')}"`).join(','));

      const csvContent = [headers.join(','), ...csvRows].join('\n');
      
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
      throw new Error('Falha ao gerar relatório. Verifique a conexão com o servidor.');
    }
  }
};
