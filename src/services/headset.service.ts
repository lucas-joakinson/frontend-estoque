import api from '../lib/api';
import type { Headset, HeadsetsResponse, HeadsetHistory } from '../types';

export const headsetService = {
  async listHeadsets(
    page = 1, 
    limit = 10, 
    search = '', 
    status?: string,
    sortBy?: string,
    order?: 'asc' | 'desc'
  ): Promise<HeadsetsResponse> {
    const response = await api.get('/headsets', {
      params: { page, limit, search, status, sortBy, order },
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

  async getStats(): Promise<Record<HeadsetStatus, number>> {
    const response = await api.get('/headsets/stats');
    return response.data;
  },

  async exportHeadsets(search = '', status?: string) {
    try {
      const LIMIT_PER_REQUEST = 100;
      let allHeadsets: Headset[] = [];
      
      // Primeira requisição para saber o total de páginas
      const firstResponse = await this.listHeadsets(1, LIMIT_PER_REQUEST, search, status);
      allHeadsets = [...firstResponse.headsets];
      
      const totalPages = firstResponse.pagination.totalPages;

      // Busca as páginas restantes, se houver
      if (totalPages > 1) {
        const remainingPagesPromises = [];
        for (let p = 2; p <= totalPages; p++) {
          remainingPagesPromises.push(this.listHeadsets(p, LIMIT_PER_REQUEST, search, status));
        }
        
        const remainingResponses = await Promise.all(remainingPagesPromises);
        remainingResponses.forEach(response => {
          allHeadsets = [...allHeadsets, ...response.headsets];
        });
      }

      const headers = ['Matricula', 'Lacre', 'Marca', 'Numero de Serie', 'Status'];
      const rows = allHeadsets.map(headset => [
        headset.matricula || '',
        headset.lacre || '',
        headset.brand || '',
        headset.serialNumber || '',
        headset.status
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      ].join('\n');

      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `relatorio_headsets_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error: any) {
      console.error('Erro na exportação:', error);
      throw error;
    }
  },
};
