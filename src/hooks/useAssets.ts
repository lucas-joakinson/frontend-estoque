import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { assetService } from '../services/asset.service';
import { toast } from 'sonner';
import type { AssetStatus, AssetsResponse } from '../types';

export const useAssets = (page = 1, limit = 10, search = '', sortBy = 'createdAt', order = 'desc') => {
  const queryClient = useQueryClient();

  const assetsQuery = useQuery({
    queryKey: ['assets', page, limit, search, sortBy, order],
    queryFn: async () => {
      const data = await assetService.listAssets(page, limit, search, sortBy, order);
      
      if (Array.isArray(data)) {
        return {
          assets: data,
          pagination: {
            page: 1,
            limit: data.length,
            total: data.length,
            totalPages: 1
          }
        } as AssetsResponse;
      }
      
      return data;
    },
    placeholderData: (previousData) => previousData,
  });

  const createMutation = useMutation({
    mutationFn: (data: { patrimonio: string; productId: string; status: AssetStatus; location: string }) => 
      assetService.createAsset(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      toast.success('Novo ativo registrado com sucesso!');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Erro ao registrar ativo';
      toast.error(message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { status?: AssetStatus; location?: string; notes?: string } }) => 
      assetService.updateAsset(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      toast.success('Ativo atualizado com sucesso!');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Erro ao atualizar ativo';
      toast.error(message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => assetService.deleteAsset(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      toast.success('Ativo removido do sistema.');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Erro ao remover ativo';
      toast.error(message);
    },
  });

  return {
    assetsData: assetsQuery.data,
    isLoading: assetsQuery.isLoading,
    isError: assetsQuery.isError,
    createAsset: createMutation.mutate,
    isCreating: createMutation.isPending,
    updateAsset: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
    deleteAsset: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
  };
};

export const useAssetHistory = (assetId: string | null) => {
  return useQuery({
    queryKey: ['assets', assetId, 'history'],
    queryFn: () => assetId ? assetService.getAssetHistory(assetId) : Promise.resolve([]),
    enabled: !!assetId,
  });
};
