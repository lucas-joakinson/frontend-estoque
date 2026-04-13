import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '../services/user.service';
import { toast } from 'sonner';

export const useUsers = (page = 1, limit = 10, search = '', sortBy = 'createdAt', order = 'desc') => {
  const queryClient = useQueryClient();

  const usersQuery = useQuery({
    queryKey: ['users', page, limit, search, sortBy, order],
    queryFn: async () => {
      const data = await userService.listUsers(page, limit, search, sortBy, order);
      
      if (Array.isArray(data)) {
        return {
          users: data,
          pagination: {
            page: 1,
            limit: data.length,
            total: data.length,
            totalPages: 1
          }
        } as any;
      }
      
      return data;
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
    onError: (error: any) => {
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
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Erro ao remover usuário';
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
    onError: (error: any) => {
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
