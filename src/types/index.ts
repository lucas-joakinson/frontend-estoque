export interface UserPermissions {
  canManageUsers: boolean;
  canManageProducts: boolean;
  canManageCategories: boolean;
  canManageAssets: boolean;
  canDeleteItems: boolean;
  canViewReports: boolean;
}

export interface Role {
  id: string;
  name: string;
  permissions: UserPermissions;
}

export interface User {
  id: string;
  matricula: string;
  name: string;
  avatarUrl?: string | null;
  role: string;
  permissions: UserPermissions;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  brand?: string;
  categoryId: string;
  category: Category;
  createdAt: string;
}

export type AssetStatus = 'DISPONIVEL' | 'EM_USO' | 'EM_MANUTENCAO' | 'DEFEITO' | 'DESCARTADO';

export interface Asset {
  id: string;
  patrimonio: string;
  productId: string;
  product: Product;
  status: AssetStatus;
  location: string;
  responsible?: string | null;
  observation?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AssetHistory {
  id: string;
  assetId: string;
  oldStatus?: AssetStatus;
  newStatus: AssetStatus;
  oldLocation?: string;
  newLocation: string;
  observation?: string;
  userId: string;
  user: User;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  role: 'ADMIN' | 'OPERATOR';
  user: User;
}

export interface UsersResponse {
  users: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CategoriesResponse {
  categories: Category[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ProductsResponse {
  products: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AssetsResponse {
  assets: Asset[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
