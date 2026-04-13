import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface UserData {
  role: 'ADMIN' | 'OPERATOR' | null;
  token: string | null;
}

interface AuthContextType {
  user: UserData;
  login: (token: string, role: 'ADMIN' | 'OPERATOR') => void;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserData>({
    token: localStorage.getItem('token'),
    role: localStorage.getItem('role') as 'ADMIN' | 'OPERATOR' | null,
  });

  const navigate = useNavigate();

  const login = (token: string, role: 'ADMIN' | 'OPERATOR') => {
    localStorage.setItem('token', token);
    localStorage.setItem('role', role);
    setUser({ token, role });
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    setUser({ token: null, role: null });
    navigate('/login');
  };

  useEffect(() => {
    const handleStorageChange = () => {
      const token = localStorage.getItem('token');
      const role = localStorage.getItem('role') as 'ADMIN' | 'OPERATOR' | null;
      setUser({ token, role });
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const isAuthenticated = !!user.token;
  const isAdmin = user.role === 'ADMIN';

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext deve ser usado dentro de um AuthProvider');
  }
  return context;
};
