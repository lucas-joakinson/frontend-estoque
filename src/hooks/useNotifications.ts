import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationService } from '../services/notification.service';
import { toast } from 'sonner';

export const useNotifications = () => {
  const queryClient = useQueryClient();

  const summaryQuery = useQuery({
    queryKey: ['notifications', 'summary'],
    queryFn: () => notificationService.getSummary(),
    refetchInterval: 120000, // 2 minutes
  });

  const recentActivitiesQuery = useQuery({
    queryKey: ['notifications', 'activities'],
    queryFn: () => notificationService.getRecentActivities(),
    refetchInterval: 120000,
  });

  const settingsQuery = useQuery({
    queryKey: ['notifications', 'settings'],
    queryFn: () => notificationService.getSettings(),
  });

  const updateSettingsMutation = useMutation({
    mutationFn: notificationService.updateSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', 'settings'] });
      toast.success('Configurações de alerta atualizadas!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao atualizar configurações');
    },
  });

  const clearActivitiesMutation = useMutation({
    mutationFn: notificationService.clearRecentActivities,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', 'activities'] });
    },
    onError: () => {
      // Mesmo se falhar no back (ex: rota não existe ainda), 
      // podemos invalidar para manter o front limpo se o usuário desejar
      queryClient.invalidateQueries({ queryKey: ['notifications', 'activities'] });
    },
  });

  return {
    summary: summaryQuery.data,
    activities: recentActivitiesQuery.data,
    settings: settingsQuery.data,
    isLoading: summaryQuery.isLoading || recentActivitiesQuery.isLoading,
    updateSettings: updateSettingsMutation.mutate,
    isUpdating: updateSettingsMutation.isPending,
    clearActivities: clearActivitiesMutation.mutate,
  };
};
