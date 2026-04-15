import { useMutation } from '@tanstack/react-query';
import { authService } from '../services/auth.service';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../contexts/AuthContext';
import type { LoginInput } from '../schemas/auth.schema';

export const useAuth = () => {
  const navigate = useNavigate();
  const { login: contextLogin, logout: contextLogout, isAdmin, isAuthenticated, user } = useAuthContext();

  const loginMutation = useMutation({
    mutationFn: (data: LoginInput) => authService.login(data.matricula, data.password),
    onSuccess: (data: any) => {
      const token = data.token;
      const user = data.user || { role: data.role, matricula: '' };
      
      contextLogin(token, user);
      toast.success('Bem-vindo ao sistema!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao realizar login');
    },
  });

  const registerMutation = useMutation({
    mutationFn: (data: LoginInput) => authService.register(data.matricula, data.password),
    onSuccess: () => {
      toast.success('Conta criada com sucesso!');
      navigate('/login');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao criar conta');
    },
  });

  return {
    login: loginMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    register: registerMutation.mutate,
    isRegistering: registerMutation.isPending,
    logout: contextLogout,
    isAdmin,
    isAuthenticated,
    user
  };
};
