import { useMutation } from '@tanstack/react-query';
import { authService } from '../services/auth.service';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import type { LoginInput } from '../schemas/auth.schema';

export const useAuth = () => {
  const navigate = useNavigate();

  const loginMutation = useMutation({
    mutationFn: (data: LoginInput) => authService.login(data.matricula, data.password),
    onSuccess: (data) => {
      localStorage.setItem('token', data.token);
      localStorage.setItem('role', data.role);
      toast.success('Bem-vindo ao sistema!');
      navigate('/dashboard');
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message || 'Erro ao realizar login');
    },
  });

  const registerMutation = useMutation({
    mutationFn: (data: LoginInput) => authService.register(data.matricula, data.password),
    onSuccess: () => {
      toast.success('Conta criada com sucesso! Faça login para acessar.');
      navigate('/login');
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message || 'Erro ao criar conta');
    },
  });

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/login');
    toast.info('Sessão encerrada.');
  };

  const isAdmin = localStorage.getItem('role') === 'ADMIN';

  return {
    login: loginMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    register: registerMutation.mutate,
    isRegistering: registerMutation.isPending,
    logout,
    isAdmin,
  };
};
