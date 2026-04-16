import api from '../lib/api';
import type { Computer, ComputersResponse, ComputerHistory } from '../types';

export const computerService = {
  async listComputers(page = 1, limit = 10, search = '', status?: string): Promise<ComputersResponse> {
    const response = await api.get('/computadores', {
      params: { page, limit, search, status },
    });
    return response.data;
  },

  async getComputerById(id: string): Promise<Computer> {
    const response = await api.get(`/computadores/${id}`);
    return response.data;
  },

  async createComputer(data: Omit<Computer, 'id' | 'createdAt' | 'updatedAt'>): Promise<Computer> {
    const response = await api.post('/computadores', data);
    return response.data;
  },

  async bulkCreateComputers(data: Omit<Computer, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<{ count: number }> {
    const response = await api.post('/computadores/bulk', data);
    return response.data;
  },

  async updateComputer(id: string, data: Partial<Omit<Computer, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Computer> {
    const response = await api.put(`/computadores/${id}`, data);
    return response.data;
  },

  async deleteComputer(id: string): Promise<void> {
    await api.delete(`/computadores/${id}`);
  },

  async getComputerHistory(id: string): Promise<ComputerHistory[]> {
    const response = await api.get(`/computadores/${id}/history`);
    return response.data;
  },

  async exportComputers(search = '', status?: string) {
    try {
      const LIMIT_PER_REQUEST = 100;
      let allComputers: Computer[] = [];
      // Primeira requisição para saber o total de páginas
      const firstResponse = await this.listComputers(1, LIMIT_PER_REQUEST, search, status);
      allComputers = [...firstResponse.computers];

      const totalPages = firstResponse.pagination.totalPages;

      // Busca as páginas restantes, se houver
      if (totalPages > 1) {
        const remainingPagesPromises = [];
        for (let p = 2; p <= totalPages; p++) {
          remainingPagesPromises.push(this.listComputers(p, LIMIT_PER_REQUEST, search, status));
        }

        const remainingResponses = await Promise.all(remainingPagesPromises);
        remainingResponses.forEach(response => {
          allComputers = [...allComputers, ...response.computers];
        });
      }
      const headers = ['Patrimonio', 'Hostname', 'Status', 'Localizacao', 'Data Cadastro'];
      const rows = allComputers.map(comp => [
        comp.patrimonio,
        comp.hostname,
        comp.status,
        comp.localizacao,
        new Date(comp.createdAt).toLocaleDateString()
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      ].join('\n');

      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `relatorio_computadores_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Erro na exportação:', error);
      throw error;
    }
  },
};
