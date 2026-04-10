import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productService } from '../services/product.service';
import { toast } from 'sonner';

export const useProducts = (page = 1, limit = 10, search = '', sortBy = 'createdAt', order = 'desc') => {
  const queryClient = useQueryClient();

  const productsQuery = useQuery({
    queryKey: ['products', page, limit, search, sortBy, order],
    queryFn: () => productService.listProducts(page, limit, search, sortBy, order),
    placeholderData: (previousData) => previousData,
  });

  const createMutation = useMutation({
    mutationFn: ({ name, categoryId, brand }: { name: string; categoryId: string; brand?: string }) => 
      productService.createProduct(name, categoryId, brand),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Novo modelo de item cadastrado!');
    },
    onError: (error: any) => {
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
    onError: (error: any) => {
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
