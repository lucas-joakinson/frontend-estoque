import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { headsetService } from '../services/headset.service';
import { toast } from 'sonner';
import type { Headset } from '../types';

export const useHeadsets = (
  page = 1, 
  limit = 10, 
  search = '', 
  status?: string,
  sortBy?: string,
  order?: 'asc' | 'desc'
) => {
  const queryClient = useQueryClient();

  const headsetsQuery = useQuery({
    queryKey: ['headsets', page, limit, search, status, sortBy, order],
    queryFn: async () => {
      const response = await headsetService.listHeadsets(page, limit, search, status, sortBy, order);
      return response;
    },
    placeholderData: (previousData) => previousData,
  });

  const createMutation = useMutation({
    mutationFn: (data: Omit<Headset, 'id' | 'createdAt' | 'updatedAt'>) => 
      headsetService.createHeadset(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['headsets'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Headset registrado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao registrar headset');
    },
  });

  const bulkCreateMutation = useMutation({
    mutationFn: (data: Omit<Headset, 'id' | 'createdAt' | 'updatedAt'>[]) => 
      headsetService.bulkCreateHeadsets(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['headsets'] });
      toast.success(`${response.count} headsets registrados com sucesso!`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao registrar headsets em lote');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Omit<Headset, 'id' | 'createdAt' | 'updatedAt'>> }) => 
      headsetService.updateHeadset(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['headsets'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
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
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
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
    bulkCreateHeadset: bulkCreateMutation.mutate,
    isBulkCreating: bulkCreateMutation.isPending,
    updateHeadset: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
    deleteHeadset: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
  };
};

export const useHeadsetHistory = (headsetId: string | null) => {
  return useQuery({
    queryKey: ['headsets', headsetId, 'history'],
    queryFn: () => headsetId ? headsetService.getHeadsetHistory(headsetId) : Promise.resolve([]),
    enabled: !!headsetId,
  });
};

export const useHeadsetStats = () => {
  return useQuery({
    queryKey: ['headsets', 'stats'],
    queryFn: () => headsetService.getStats(),
  });
};
