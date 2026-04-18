import { Navigate, Outlet } from 'react-router-dom';
import { Sidebar } from './layout/Sidebar';
import { Header } from './layout/Header';
import { toast } from 'sonner';
import { useEffect } from 'react';
import { useAuthContext } from '../contexts/AuthContext';
import { useAuth } from '../hooks/useAuth';
import { Spinner } from './ui/Spinner';
import type { UserPermissions } from '../types';

interface ProtectedRouteProps {
  title: string;
  requiredRole?: 'ADMIN' | 'OPERATOR';
  requiredPermission?: keyof UserPermissions;
}

export const ProtectedRoute = ({ title, requiredRole, requiredPermission }: ProtectedRouteProps) => {
  const { user, isLoading, isAuthenticated } = useAuthContext();
  const { hasPermission } = useAuth();
  const token = localStorage.getItem('token');
  
  const isAdmin = user?.role === 'ADMIN';
  
  let isAuthorized = true;
  if (requiredRole === 'ADMIN') {
    isAuthorized = isAdmin;
  }
  if (requiredPermission) {
    isAuthorized = hasPermission(requiredPermission);
  }

  useEffect(() => {
    if (isAuthenticated && !isAuthorized && !isLoading) {
      toast.error('Acesso insuficiente para esta funcionalidade.');
    }
  }, [isAuthenticated, isAuthorized, isLoading]);

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Spinner size={32} className="text-primary-500" />
          <p className="text-xs font-mono text-text-secondary uppercase tracking-[0.2em] animate-pulse">
            Sincronizando Sessão...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !token) {
    return <Navigate to="/login" replace />;
  }

  if (!isAuthorized) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden ml-72">
        <Header title={title} />
        <main className="flex-1 overflow-y-auto p-8 grid-bg">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

