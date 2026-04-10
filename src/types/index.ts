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
  sku: string;
  quantity: number;
  categoryId: string;
  category: Category;
  createdAt: string;
}

export interface StockMovement {
  id: string;
  type: 'IN' | 'OUT' | 'ADJUSTMENT';
  quantity: number;
  reason?: string;
  productId: string;
  product: Product;
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
