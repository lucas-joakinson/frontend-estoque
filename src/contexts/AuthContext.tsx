import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  login: (token: string, userData: User) => void;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const getSafeUser = (): User | null => {
  const saved = localStorage.getItem('user');
  if (!saved || saved === 'undefined') return null;
  try { return JSON.parse(saved); } catch { return null; }
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(getSafeUser);
  const navigate = useNavigate();

  const login = (token: string, userData: User) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
    navigate('/login');
  };

  const updateUser = (userData: Partial<User>) => {
    if (!user) return;
    const updated = { ...user, ...userData };
    localStorage.setItem('user', JSON.stringify(updated));
    setUser(updated);
  };

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
    isAuthenticated: !!user && !!localStorage.getItem('token'),
    isAdmin: user?.role === 'ADMIN'
  }), [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuthContext must be used within AuthProvider');
  return context;
};
