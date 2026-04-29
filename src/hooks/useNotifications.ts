import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationService } from '../services/notification.service';
import { toast } from 'sonner';
import { useAuth } from './useAuth';

export const useNotifications = () => {
  const queryClient = useQueryClient();
  const { hasPermission, isAuthenticated } = useAuth();
  
  const canView = isAuthenticated && hasPermission('canViewNotifications');

  const summaryQuery = useQuery({
    queryKey: ['notifications', 'summary'],
    queryFn: () => notificationService.getSummary(),
    refetchInterval: 30000,
    enabled: canView,
  });

  const recentActivitiesQuery = useQuery({
    queryKey: ['notifications', 'activities'],
    queryFn: () => notificationService.getRecentActivities(),
    refetchInterval: 30000,
    enabled: canView,
  });

  const settingsQuery = useQuery({
    queryKey: ['notifications', 'settings'],
    queryFn: () => notificationService.getSettings(),
    enabled: canView,
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
      queryClient.invalidateQueries({ queryKey: ['notifications', 'activities'] });
    },
  });

  return {
    summary: summaryQuery.data,
    activities: recentActivitiesQuery.data,
    settings: settingsQuery.data,
    isLoading: summaryQuery.isLoading || recentActivitiesQuery.isLoading,
    isRefetching: summaryQuery.isRefetching || recentActivitiesQuery.isRefetching,
    updateSettings: updateSettingsMutation.mutate,
    isUpdating: updateSettingsMutation.isPending,
    clearActivities: clearActivitiesMutation.mutate,
    refetch: () => {
      if (canView) {
        summaryQuery.refetch();
        recentActivitiesQuery.refetch();
      }
    },
  };
};
