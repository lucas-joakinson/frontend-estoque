import api from '../lib/api';
import type { UserPermissions, Role } from '../types';

export const permissionService = {
  async listRoles(): Promise<Role[]> {
    const response = await api.get('/permissions');
    return response.data;
  },

  async getRolePermissions(role: string): Promise<UserPermissions> {
    const response = await api.get(`/permissions/${role.toUpperCase()}`);
    return response.data.permissions || response.data;
  },

  async updateRolePermissions(role: string, permissions: Partial<UserPermissions>): Promise<UserPermissions> {
    const response = await api.patch(`/permissions/${role.toUpperCase()}`, permissions);
    return response.data;
  },

  async createRole(name: string, permissions?: Partial<UserPermissions>): Promise<Role> {
    const response = await api.post('/permissions/roles', { 
      name: name.toUpperCase(),
      permissions 
    });
    return response.data;
  },

  async deleteRole(role: string): Promise<void> {
    await api.delete(`/permissions/${role.toUpperCase()}`);
  },
};
