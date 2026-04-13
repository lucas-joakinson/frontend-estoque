import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { assetService } from '../services/asset.service';
import { toast } from 'sonner';
import type { AssetStatus, AssetsResponse } from '../types';

export const useAssets = (
  page = 1, 
  limit = 10, 
  search = '', 
  status?: string, 
  categoryId?: string,
  sortBy = 'createdAt', 
  order = 'desc'
) => {
  const queryClient = useQueryClient();

  const assetsQuery = useQuery({
    queryKey: ['assets', page, limit, search, status, categoryId, sortBy, order],
    queryFn: async () => {
      const data = await assetService.listAssets(page, limit, search, status, categoryId, sortBy, order);
      
      let normalizedData: AssetsResponse;
      if (Array.isArray(data)) {
        normalizedData = {
          assets: data,
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

      if (status || categoryId) {
        let filteredAssets = [...normalizedData.assets];
        
        if (status) {
          filteredAssets = filteredAssets.filter(a => a.status === status);
        }
        
        if (categoryId) {
          filteredAssets = filteredAssets.filter(a => a.product.categoryId === categoryId);
        }

        return {
          ...normalizedData,
          assets: filteredAssets,
          pagination: {
            ...normalizedData.pagination,
            total: filteredAssets.length,
            totalPages: Math.ceil(filteredAssets.length / limit)
          }
        };
      }
      
      return normalizedData;
    },
    placeholderData: (previousData) => previousData,
  });

  const createMutation = useMutation({
    mutationFn: (data: { patrimonio: string; productId: string; status: AssetStatus; location: string }) => 
      assetService.createAsset(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      toast.success('Ativo registrado com sucesso!');
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message || 'Erro ao registrar ativo');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { status: AssetStatus; location: string; notes?: string } }) => 
      assetService.updateAsset(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      toast.success('Ativo atualizado com sucesso!');
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message || 'Erro ao atualizar ativo');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => assetService.deleteAsset(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      toast.success('Ativo removido do sistema!');
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message || 'Erro ao remover ativo');
    },
  });

  return {
    assetsData: assetsQuery.data,
    isLoading: assetsQuery.isLoading,
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
