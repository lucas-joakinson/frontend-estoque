import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoryService } from '../services/category.service';
import { toast } from 'sonner';
import type { CategoriesResponse } from '../types';

interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
}

export const useCategories = (page = 1, limit = 10, search = '') => {
  const queryClient = useQueryClient();

  const categoriesQuery = useQuery({
    queryKey: ['categories', page, limit, search],
    queryFn: async () => {
      const data = await categoryService.getAll(page, limit, search);
      
      if (Array.isArray(data)) {
        return {
          categories: data,
          pagination: {
            page: 1,
            limit: data.length,
            total: data.length,
            totalPages: 1
          }
        } as CategoriesResponse;
      }
      
      return data as CategoriesResponse;
    },
    placeholderData: (previousData) => previousData,
  });

  const createMutation = useMutation({
    mutationFn: (name: string) => categoryService.create(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Categoria criada com sucesso!');
    },
    onError: (error: ApiError) => {
      toast.error(error.response?.data?.message || 'Erro ao criar categoria');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => categoryService.update(id, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Categoria atualizada com sucesso!');
    },
    onError: (error: ApiError) => {
      toast.error(error.response?.data?.message || 'Erro ao atualizar categoria');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => categoryService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Categoria excluída com sucesso!');
    },
    onError: (error: ApiError) => {
      toast.error(error.response?.data?.message || 'Erro ao excluir categoria');
    },
  });

  return {
    categoriesData: categoriesQuery.data,
    isLoading: categoriesQuery.isLoading,
    createCategory: createMutation.mutate,
    updateCategory: updateMutation.mutate,
    deleteCategory: deleteMutation.mutate,
  };
};
