import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoryService } from '../services/category.service';
import { toast } from 'sonner';
import type { CategoriesResponse, Category } from '../types';

interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
}

export const useCategories = (page = 1, limit = 10, search = '', sortBy = 'name', order = 'asc') => {
  const queryClient = useQueryClient();

  const categoriesQuery = useQuery({
    queryKey: ['categories', page, limit, search, sortBy, order],
    queryFn: async () => {
      const response: any = await categoryService.getAll(page, limit, search, sortBy, order);
      
      let categories: Category[] = [];
      let pagination = { page: 1, limit: 10, total: 0, totalPages: 1 };

      if (Array.isArray(response)) {
        categories = response;
      } else if (response) {
        categories = response.categories || response.data || [];
        pagination = response.pagination || { 
          page: 1, 
          limit: categories.length, 
          total: categories.length, 
          totalPages: 1 
        };
      }

      if (pagination.total === 0 && categories.length > 0) {
        pagination.total = categories.length;
      }

      // FALLBACK: Client-side filtering
      if (search) {
        const s = search.toLowerCase();
        categories = categories.filter(c => c.name.toLowerCase().includes(s));
      }

      // FALLBACK: Client-side sorting
      categories.sort((a, b) => {
        const valA = (a[sortBy as keyof Category] || '').toString().toLowerCase();
        const valB = (b[sortBy as keyof Category] || '').toString().toLowerCase();
        if (order === 'asc') return valA.localeCompare(valB);
        return valB.localeCompare(valA);
      });
      
      return { categories, pagination } as CategoriesResponse;
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
