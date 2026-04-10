import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '../services/user.service';
import { toast } from 'sonner';

export const useUsers = (page = 1, limit = 10, search = '', sortBy = 'createdAt', order = 'desc') => {
  const queryClient = useQueryClient();

  const usersQuery = useQuery({
    queryKey: ['users', page, limit, search, sortBy, order],
    queryFn: () => userService.listUsers(page, limit, search, sortBy, order),
    placeholderData: (previousData) => previousData,
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

  return {
    usersData: usersQuery.data,
    isLoading: usersQuery.isLoading,
    isError: usersQuery.isError,
    deleteUser: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
  };
};
