import { useMutation } from '@tanstack/react-query';
import { authService } from '../services/auth.service';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export const useAuth = () => {
  const navigate = useNavigate();
  const role = localStorage.getItem('role');
  const isAdmin = role === 'ADMIN';

  const loginMutation = useMutation({
    mutationFn: ({ matricula, password }: { matricula: string; password: string }) =>
      authService.login(matricula, password),
    onSuccess: (data) => {
      localStorage.setItem('token', data.token);
      localStorage.setItem('role', data.role);
      toast.success('Login realizado com sucesso!');
      navigate('/dashboard');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Erro ao realizar login';
      toast.error(message);
    },
  });

  const registerMutation = useMutation({
    mutationFn: ({ matricula, password }: { matricula: string; password: string }) =>
      authService.register(matricula, password),
    onSuccess: () => {
      toast.success('Conta criada! Faça login.');
      navigate('/login');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Erro ao criar conta';
      toast.error(message);
    },
  });

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/login');
    toast.success('Sessão encerrada.');
  };

  return {
    login: loginMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    register: registerMutation.mutate,
    isRegistering: registerMutation.isPending,
    logout,
    role,
    isAdmin,
  };
};
