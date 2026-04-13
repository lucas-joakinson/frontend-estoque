import { Navigate, Outlet } from 'react-router-dom';
import { Sidebar } from './layout/Sidebar';
import { Header } from './layout/Header';
import { toast } from 'sonner';
import { useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';

interface ProtectedRouteProps {
  title: string;
  requiredRole?: 'ADMIN' | 'OPERATOR';
}

export const ProtectedRoute = ({ title, requiredRole }: ProtectedRouteProps) => {
  const { isAuthenticated, isAdmin } = useAuth();

  const isAuthorized = !requiredRole || (requiredRole === 'ADMIN' ? isAdmin : true);

  useEffect(() => {
    if (isAuthenticated && !isAuthorized) {
      toast.error('Acesso restrito a administradores.');
    }
  }, [isAuthenticated, isAuthorized]);

  if (!isAuthenticated) {
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

