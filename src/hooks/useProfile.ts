import { useMutation } from '@tanstack/react-query';
import { userService } from '../services/user.service';
import { toast } from 'sonner';
import { useAuthContext } from '../contexts/AuthContext';
import type { ChangePasswordInput } from '../schemas/profile.schema';

export const useProfile = () => {
  const { updateUser } = useAuthContext();

  const updateProfileMutation = useMutation({
    mutationFn: (name: string) => userService.updateProfile(name),
    onSuccess: (updatedUser) => {
      updateUser(updatedUser);
      toast.success('Perfil atualizado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao atualizar perfil.');
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: (data: ChangePasswordInput) => userService.changePassword({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
      confirmPassword: data.confirmPassword,
    }),
    onSuccess: () => {
      toast.success('Senha alterada com sucesso!');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Erro ao alterar senha.';
      toast.error(message);
    },
  });

  const uploadAvatarMutation = useMutation({
    mutationFn: (file: File) => userService.uploadAvatar(file),
    onSuccess: (updatedUser) => {
      updateUser(updatedUser);
      toast.success('Foto de perfil atualizada!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao fazer upload da imagem.');
    },
  });

  return {
    updateProfile: updateProfileMutation.mutate,
    isUpdatingProfile: updateProfileMutation.isPending,
    changePassword: changePasswordMutation.mutate,
    isChangingPassword: changePasswordMutation.isPending,
    uploadAvatar: uploadAvatarMutation.mutate,
    isUploadingAvatar: uploadAvatarMutation.isPending,
  };
};
