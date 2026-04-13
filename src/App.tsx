import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Products } from './pages/Products';
import { Categories } from './pages/Categories';
import { Assets } from './pages/Assets';
import { Users } from './pages/Users';
import { ProtectedRoute } from './components/ProtectedRoute';
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
              <Route path="/login" element={<Login />} />
              
              <Route element={<ProtectedRoute title="Dashboard" />}>
                <Route path="/dashboard" element={<Dashboard />} />
              </Route>

              <Route element={<ProtectedRoute title="Gerenciar Produtos" />}>
                <Route path="/products" element={<Products />} />
              </Route>

              <Route element={<ProtectedRoute title="Categorias" />}>
                <Route path="/categories" element={<Categories />} />
              </Route>

              <Route element={<ProtectedRoute title="Gestão de Ativos (Patrimônio)" />}>
                <Route path="/assets" element={<Assets />} />
              </Route>

              <Route element={<ProtectedRoute title="Gerenciar Usuários" requiredRole="ADMIN" />}>
                <Route path="/users" element={<Users />} />
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

