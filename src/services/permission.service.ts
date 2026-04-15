import api from '../lib/api';
import type { UserPermissions } from '../types';

export const permissionService = {
  async listRoles(): Promise<Role[]> {
    const response = await api.get('/permissions');
    return response.data;
  },

  async getRolePermissions(role: string): Promise<UserPermissions> {
    const response = await api.get(`/permissions/${role}`);
    return response.data.permissions || response.data;
  },

  async updateRolePermissions(role: string, permissions: UserPermissions): Promise<UserPermissions> {
    const response = await api.patch(`/permissions/${role}`, permissions);
    return response.data;
  },

  async createRole(name: string): Promise<Role> {
    const response = await api.post('/permissions/roles', { name });
    return response.data;
  },
};
