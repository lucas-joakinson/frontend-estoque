import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { computerService } from '../services/computer.service';
import type { ComputerInput } from '../schemas/computer.schema';

export const useComputers = (
  page = 1,
  limit = 10,
  search = '',
  status = ''
) => {
  const queryClient = useQueryClient();

  const { data: computersData, isLoading } = useQuery({
    queryKey: ['computers', page, limit, search, status],
    queryFn: async () => {
      const data = await computerService.listComputers(page, limit, search, status);
      if (data.computers) {
        data.computers = data.computers.map((comp: any) => ({
          ...comp,
          localizacao: comp.localizacao || comp.location || 'Não informada'
        }));
      }
      return data;
    },
  });

  const { mutate: createComputer, isPending: isCreating } = useMutation({
    mutationFn: (data: ComputerInput) => computerService.createComputer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['computers'] });
      toast.success('Computador cadastrado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao cadastrar computador');
    },
  });

  const { mutate: bulkCreateComputers, isPending: isBulkCreating } = useMutation({
    mutationFn: (data: ComputerInput[]) => computerService.bulkCreateComputers(data as any),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['computers'] });
      toast.success(`${response.count} computadores importados com sucesso!`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao importar computadores');
    },
  });

  const { mutate: updateComputer, isPending: isUpdating } = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ComputerInput> }) =>
      computerService.updateComputer(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['computers'] });
      toast.success('Computador atualizado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao atualizar computador');
    },
  });

  const { mutate: deleteComputer, isPending: isDeleting } = useMutation({
    mutationFn: (id: string) => computerService.deleteComputer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['computers'] });
      toast.success('Computador excluído com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao excluir computador');
    },
  });

  return {
    computersData,
    isLoading,
    createComputer,
    isCreating,
    bulkCreateComputers,
    isBulkCreating,
    updateComputer,
    isUpdating,
    deleteComputer,
    isDeleting,
  };
};

export const useComputerHistory = (computerId: string | null) => {
  return useQuery({
    queryKey: ['computer-history', computerId],
    queryFn: () => computerService.getComputerHistory(computerId!),
    enabled: !!computerId,
  });
};

export const useComputerStats = () => {
  return useQuery({
    queryKey: ['computers', 'stats'],
    queryFn: () => computerService.getStats(),
  });
};
