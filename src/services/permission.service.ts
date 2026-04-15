import api from '../lib/api';
import type { UserPermissions } from '../types';

export const permissionService = {
  async getRolePermissions(role: 'ADMIN' | 'OPERATOR'): Promise<UserPermissions> {
    const response = await api.get(`/permissions/${role}`);
    return response.data;
  },

  async updateRolePermissions(role: 'ADMIN' | 'OPERATOR', permissions: UserPermissions): Promise<UserPermissions> {
    const response = await api.patch(`/permissions/${role}`, permissions);
    return response.data;
  },
};
