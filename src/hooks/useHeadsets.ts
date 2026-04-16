import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { headsetService } from '../services/headset.service';
import { toast } from 'sonner';
import type { HeadsetStatus, HeadsetsResponse, Headset } from '../types';

export const useHeadsets = (
  page = 1, 
  limit = 10, 
  search = '', 
  status?: string
) => {
  const queryClient = useQueryClient();

  const headsetsQuery = useQuery({
    queryKey: ['headsets', page, limit, search, status],
    queryFn: async () => {
      const response = await headsetService.listHeadsets(page, limit, search, status);
      return response;
    },
    placeholderData: (previousData) => previousData,
  });

  const createMutation = useMutation({
    mutationFn: (data: Omit<Headset, 'id' | 'createdAt' | 'updatedAt'>) => 
      headsetService.createHeadset(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['headsets'] });
      toast.success('Headset registrado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao registrar headset');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Omit<Headset, 'id' | 'createdAt' | 'updatedAt'>> }) => 
      headsetService.updateHeadset(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['headsets'] });
      toast.success('Headset atualizado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao atualizar headset');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => headsetService.deleteHeadset(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['headsets'] });
      toast.success('Headset removido do sistema!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao remover headset');
    },
  });

  return {
    headsetsData: headsetsQuery.data,
    isLoading: headsetsQuery.isLoading,
    createHeadset: createMutation.mutate,
    isCreating: createMutation.isPending,
    updateHeadset: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
    deleteHeadset: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
  };
};
