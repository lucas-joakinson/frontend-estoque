import { Navigate, Outlet } from 'react-router-dom';
import { Sidebar } from './layout/Sidebar';
import { Header } from './layout/Header';
import { toast } from 'sonner';
import { useEffect } from 'react';
import { useAuthContext } from '../contexts/AuthContext';
import { Spinner } from './ui/Spinner';

interface ProtectedRouteProps {
  title: string;
  requiredRole?: 'ADMIN' | 'OPERATOR';
}

export const ProtectedRoute = ({ title, requiredRole }: ProtectedRouteProps) => {
  const { user, isLoading, isAuthenticated } = useAuthContext();
  const token = localStorage.getItem('token');
  
  const isAdmin = user?.role === 'ADMIN';
  const isAuthorized = !requiredRole || (requiredRole === 'ADMIN' ? isAdmin : true);

  useEffect(() => {
    if (isAuthenticated && !isAuthorized && !isLoading) {
      toast.error('Acesso restrito a administradores.');
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

