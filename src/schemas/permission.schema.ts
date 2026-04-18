import { z } from 'zod';

export const permissionSchema = z.object({
  canManageUsers: z.boolean().default(false),
  canManageProducts: z.boolean().default(false),
  canManageCategories: z.boolean().default(false),
  canManageAssets: z.boolean().default(false),
  canDeleteItems: z.boolean().default(false),
  canViewReports: z.boolean().default(false),
  canManageComputers: z.boolean().default(false),
  canDeleteComputers: z.boolean().default(false),
  canManageHeadsets: z.boolean().default(false),
  canDeleteHeadsets: z.boolean().default(false),
  canExportData: z.boolean().default(false),
});

export const createRoleSchema = z.object({
  name: z.string()
    .min(2, 'Role name must have at least 2 characters')
    .transform(val => val.toUpperCase()),
  permissions: permissionSchema.partial().optional(),
});

export type PermissionFormData = z.infer<typeof permissionSchema>;
export type CreateRoleFormData = z.infer<typeof createRoleSchema>;
