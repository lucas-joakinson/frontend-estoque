export interface UserPermissions {
  canManageUsers: boolean;
  canManageProducts: boolean;
  canManageCategories: boolean;
  canManageAssets: boolean;
  canDeleteItems: boolean;
  canViewReports: boolean;
  canManageComputers: boolean;
  canDeleteComputers: boolean;
  canManageHeadsets: boolean;
  canDeleteHeadsets: boolean;
  canExportData: boolean;
}

export interface Role {
  id: string;
  name: string;
  permissions: UserPermissions;
  _count?: {
    users: number;
  };
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

export type HeadsetStatus = 'EM_USO' | 'RESERVA' | 'TROCA_PENDENTE' | 'EM_MANUTENCAO' | 'DEFEITO' | 'DISPONIVEL';

export interface Headset {
  id: string;
  matricula: string | null;
  lacre: string;
  marca: string;
  numeroSerie?: string | null;
  status: HeadsetStatus;
  observacoes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface HeadsetHistory {
  id: string;
  headsetId: string;
  oldStatus?: HeadsetStatus | null;
  newStatus: HeadsetStatus;
  observation?: string | null;
  userId: string;
  user: User;
  createdAt: string;
}

export interface HeadsetsResponse {
  headsets: Headset[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export type ComputerStatus = 'Em uso' | 'Manutenção' | 'Defeito' | 'Troca pendente' | 'Em estoque';

export interface Computer {
  id: string;
  patrimonio: string;
  hostname: string;
  status: ComputerStatus;
  localizacao: string;
  observacoes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ComputerHistory {
  id: string;
  computerId: string;
  oldStatus?: ComputerStatus | null;
  newStatus: ComputerStatus;
  oldLocalizacao?: string | null;
  newLocalizacao: string;
  observation?: string | null;
  userId: string;
  user: User;
  createdAt: string;
}

export interface ComputersResponse {
  computers: Computer[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
