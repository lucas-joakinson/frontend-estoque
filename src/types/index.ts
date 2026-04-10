export interface User {
  id: string;
  matricula: string;
  role: 'ADMIN' | 'OPERATOR';
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
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
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AssetHistory {
  id: string;
  assetId: string;
  status: AssetStatus;
  location: string;
  notes?: string;
  userId: string;
  user: User;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  role: 'ADMIN' | 'OPERATOR';
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
