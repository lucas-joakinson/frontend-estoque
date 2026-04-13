import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '../services/user.service';
import { toast } from 'sonner';
import type { UsersResponse, User } from '../types';

interface ApiError {
  response?: {
    data?: {
      message?: string | string[];
    };
  };
}

export const useUsers = (
  page = 1, 
  limit = 10, 
  search = '', 
  role?: string,
  sortBy = 'createdAt', 
  order = 'desc'
) => {
  const queryClient = useQueryClient();

  const usersQuery = useQuery({
    queryKey: ['users', page, limit, search, role, sortBy, order],
    queryFn: async () => {
      const data = await userService.listUsers(page, limit, search, role, sortBy, order);
      
      let normalizedData: UsersResponse;
      if (Array.isArray(data)) {
        normalizedData = {
          users: data,
          pagination: {
            page: 1,
            limit: data.length,
            total: data.length,
            totalPages: 1
          }
        };
      } else {
        normalizedData = data;
      }

      // Filtragem no Cliente (Fallback caso o Backend não suporte)
      if (role) {
        const filteredUsers = normalizedData.users.filter((u: User) => u.role === role);
        return {
          ...normalizedData,
          users: filteredUsers,
          pagination: {
            ...normalizedData.pagination,
            total: filteredUsers.length,
            totalPages: Math.ceil(filteredUsers.length / limit)
          }
        };
      }
      
      return normalizedData;
    },
    placeholderData: (previousData) => previousData,
  });

  const createMutation = useMutation({
    mutationFn: ({ matricula, password, role }: { matricula: string; password: string; role: 'ADMIN' | 'OPERATOR' }) => 
      userService.createUser(matricula, password, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Novo usuário cadastrado com sucesso!');
    },
    onError: (error: ApiError) => {
      const backendMessage = error.response?.data?.message;
      const message = Array.isArray(backendMessage) 
        ? backendMessage.join(', ') 
        : backendMessage || 'Erro ao cadastrar usuário';
      toast.error(message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => userService.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Usuário removido com sucesso!');
    },
    onError: (error: ApiError) => {
      const message = (error.response?.data?.message as string) || 'Erro ao remover usuário';
      toast.error(message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { password?: string; role?: 'ADMIN' | 'OPERATOR' } }) => 
      userService.updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Usuário atualizado com sucesso!');
    },
    onError: (error: ApiError) => {
      const backendMessage = error.response?.data?.message;
      const message = Array.isArray(backendMessage) 
        ? backendMessage.join(', ') 
        : backendMessage || 'Erro ao atualizar usuário';
      toast.error(message);
    },
  });

  return {
    usersData: usersQuery.data,
    isLoading: usersQuery.isLoading,
    isError: usersQuery.isError,
    createUser: createMutation.mutate,
    isCreating: createMutation.isPending,
    deleteUser: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
    updateUser: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
  };
};
