import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productService } from '../services/product.service';
import { toast } from 'sonner';
import type { ProductsResponse } from '../types';

interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
}

export const useProducts = (page = 1, limit = 10, search = '', sortBy = 'createdAt', order = 'desc') => {
  const queryClient = useQueryClient();

  const productsQuery = useQuery({
    queryKey: ['products', page, limit, search, sortBy, order],
    queryFn: async () => {
      const response: any = await productService.listProducts(page, limit, search, sortBy, order);
      
      // Handle the different response structures more robustly
      let products = [];
      let pagination = { page: 1, limit: 10, total: 0, totalPages: 1 };

      if (Array.isArray(response)) {
        products = response;
        pagination = { page: 1, limit: response.length, total: response.length, totalPages: 1 };
      } else if (response) {
        products = response.products || response.data || [];
        pagination = response.pagination || { 
          page: 1, 
          limit: products.length, 
          total: products.length, 
          totalPages: 1 
        };
      }
      
      return { products, pagination } as ProductsResponse;
    },
    placeholderData: (previousData) => previousData,
  });

  const createMutation = useMutation({
    mutationFn: ({ name, categoryId, brand }: { name: string; categoryId: string; brand?: string }) => 
      productService.createProduct(name, categoryId, brand),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Novo modelo de item cadastrado!');
    },
    onError: (error: ApiError) => {
      const message = error.response?.data?.message || 'Erro ao cadastrar produto';
      toast.error(message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => productService.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Modelo de item removido!');
    },
    onError: (error: ApiError) => {
      const message = error.response?.data?.message || 'Erro ao remover produto';
      toast.error(message);
    },
  });

  return {
    productsData: productsQuery.data,
    isLoading: productsQuery.isLoading,
    isError: productsQuery.isError,
    createProduct: createMutation.mutate,
    isCreating: createMutation.isPending,
    deleteProduct: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
  };
};
