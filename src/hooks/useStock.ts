import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { stockService } from '../services/stock.service';
import { toast } from 'sonner';

export const useStock = () => {
  const queryClient = useQueryClient();

  const movementsQuery = useQuery({
    queryKey: ['movements'],
    queryFn: stockService.getMovements,
  });

  const stockInMutation = useMutation({
    mutationFn: ({ productId, quantity, reason }: { productId: string; quantity: number; reason?: string }) =>
      stockService.stockIn(productId, quantity, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movements'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Entrada de estoque realizada!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao realizar entrada');
    },
  });

  const stockOutMutation = useMutation({
    mutationFn: ({ productId, quantity, reason }: { productId: string; quantity: number; reason?: string }) =>
      stockService.stockOut(productId, quantity, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movements'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Saída de estoque realizada!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao realizar saída');
    },
  });

  const updateMovementMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      stockService.updateMovement(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movements'] });
      toast.success('Motivo atualizado!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao atualizar motivo');
    },
  });

  return {
    movements: movementsQuery.data ?? [],
    isLoading: movementsQuery.isLoading,
    stockIn: stockInMutation.mutate,
    stockOut: stockOutMutation.mutate,
    updateMovement: updateMovementMutation.mutate,
  };
};
