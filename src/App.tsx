import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Inventory } from './pages/Inventory';
import { Headsets } from './pages/Headsets';
import { Computers } from './pages/Computers';
import { Users } from './pages/Users';
import { Profile } from './pages/Profile';
import { Home } from './pages/Home';
import { ProtectedRoute } from './components/ProtectedRoute';
import { PublicRoute } from './components/PublicRoute';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';

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
          <ThemeProvider>
            <AppContent />
          </ThemeProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

function AppContent() {
  const { theme } = useTheme();

  return (
    <>
      <AuthProvider>
        <Routes>
          <Route element={<PublicRoute />}>
            <Route path="/login" element={<Login />} />
          </Route>
          
          <Route element={<ProtectedRoute title="Início" />}>
            <Route path="/" element={<Home />} />
          </Route>

          <Route element={<ProtectedRoute title="Dashboard" requiredPermission="canViewReports" />}>
            <Route path="/dashboard" element={<Dashboard />} />
          </Route>

          <Route element={<ProtectedRoute title="Gerenciar Estoque (Geral)" />}>
            <Route path="/inventory" element={<Inventory />} />
          </Route>

          <Route element={<ProtectedRoute title="Headsets" />}>
            <Route path="/headsets" element={<Headsets />} />
          </Route>

          <Route element={<ProtectedRoute title="Computadores" />}>
            <Route path="/computers" element={<Computers />} />
          </Route>

          <Route element={<ProtectedRoute title="Gestão de Acessos" requiredPermission="canManageUsers" />}>
            <Route path="/users" element={<Users />} />
          </Route>

          <Route element={<ProtectedRoute title="Meu Perfil" />}>
            <Route path="/profile" element={<Profile />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
      
      <Toaster 
        theme={theme} 
        position="top-right" 
        richColors 
        toastOptions={{
          style: {
            background: 'var(--surface)',
            border: '1px solid var(--border-primary)',
            color: 'var(--text-primary)',
          }
        }}
      />
    </>
  );
}

export default App;
