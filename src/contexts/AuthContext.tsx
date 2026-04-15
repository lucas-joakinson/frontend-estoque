import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { userService } from '../services/user.service';
import type { User, UserPermissions } from '../types';

interface AuthContextType {
  user: User | null;
  login: (token: string, userData: User) => void;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  refreshProfile: () => Promise<void>;
  hasPermission: (permission: keyof UserPermissions) => boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const getDefaultPermissions = (role: 'ADMIN' | 'OPERATOR'): UserPermissions => {
  if (role === 'ADMIN') {
    return {
      canManageUsers: true,
      canManageProducts: true,
      canManageCategories: true,
      canManageAssets: true,
      canDeleteItems: true,
      canViewReports: true,
    };
  }
  return {
    canManageUsers: false,
    canManageProducts: true,
    canManageCategories: true,
    canManageAssets: true,
    canDeleteItems: false,
    canViewReports: false,
  };
};

const getSafeUser = (): User | null => {
  const saved = localStorage.getItem('user');
  if (!saved || saved === 'undefined') return null;
  try { 
    const user = JSON.parse(saved);
    if (user && !user.permissions) {
      user.permissions = getDefaultPermissions(user.role);
    }
    return user;
  } catch { 
    return null; 
  }
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(getSafeUser);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login', { replace: true });
  }, [navigate]);

  const refreshProfile = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const userData = await userService.getProfile();
      
      if (!userData.permissions) {
        userData.permissions = getDefaultPermissions(userData.role);
      }
      
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
      if ((error as any).response?.status === 401) {
        logout();
      }
    } finally {
      setIsLoading(false);
    }
  }, [logout]);

  const login = (token: string, userData: User | any) => {
    localStorage.setItem('token', token);
    
    if (userData?.id && userData?.name) {
      if (!userData.permissions) {
        userData.permissions = getDefaultPermissions(userData.role);
      }
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData as User);
    } else {
      const placeholder = { 
        ...userData, 
        name: 'Carregando...',
        permissions: getDefaultPermissions(userData.role || 'OPERATOR')
      };
      setUser(placeholder as User);
      refreshProfile();
    }
    
    navigate('/dashboard', { replace: true });
  };

  const hasPermission = useCallback((permission: keyof UserPermissions) => {
    if (!user) return false;
    if (user.role === 'ADMIN') return true;
    return !!user.permissions?.[permission];
  }, [user]);

  const updateUser = useCallback((userData: Partial<User>) => {
    setUser(prev => {
      if (!prev) return null;
      const updated = { ...prev, ...userData };
      localStorage.setItem('user', JSON.stringify(updated));
      return updated;
    });
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        await refreshProfile();
      } else {
        setIsLoading(false);
      }
    };

    initAuth();
  }, [refreshProfile]);

  useEffect(() => {
    const handleStorage = () => setUser(getSafeUser());
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const value = useMemo(() => ({
    user,
    login,
    logout,
    updateUser,
    refreshProfile,
    hasPermission,
    isAuthenticated: !!user && !!localStorage.getItem('token'),
    isAdmin: user?.role === 'ADMIN',
    isLoading
  }), [user, logout, updateUser, refreshProfile, hasPermission, isLoading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuthContext must be used within AuthProvider');
  return context;
};
