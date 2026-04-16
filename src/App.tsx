import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Inventory } from './pages/Inventory';
import { Headsets } from './pages/Headsets';
import { Users } from './pages/Users';
import { Profile } from './pages/Profile';
import { ProtectedRoute } from './components/ProtectedRoute';
import { PublicRoute } from './components/PublicRoute';
import { AuthProvider } from './contexts/AuthContext';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route element={<PublicRoute />}>
                <Route path="/login" element={<Login />} />
              </Route>
              
              <Route element={<ProtectedRoute title="Dashboard" />}>
                <Route path="/dashboard" element={<Dashboard />} />
              </Route>

              <Route element={<ProtectedRoute title="Gerenciar Estoque (Geral)" />}>
                <Route path="/inventory" element={<Inventory />} />
              </Route>

              <Route element={<ProtectedRoute title="Headsets" />}>
                <Route path="/headsets" element={<Headsets />} />
              </Route>

              <Route element={<ProtectedRoute title="Gerenciar Usuários" requiredRole="ADMIN" />}>
                <Route path="/users" element={<Users />} />
              </Route>

              <Route element={<ProtectedRoute title="Meu Perfil" />}>
                <Route path="/profile" element={<Profile />} />
              </Route>

              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
        
        <Toaster 
          theme="dark" 
          position="top-right" 
          richColors 
          toastOptions={{
            style: {
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-primary)',
              color: 'var(--text-primary)',
            }
          }}
        />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
