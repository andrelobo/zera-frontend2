import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User } from '@/types/api';
import { authApi } from '@/services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (token: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('zera_token'));
  const [isLoading, setIsLoading] = useState(!!token);

  const refreshUser = useCallback(async () => {
    try {
      const me = await authApi.me();
      setUser({
        ...me,
        name: me.name || me.email,
      });
    } catch {
      setUser(null);
      setToken(null);
      localStorage.removeItem('zera_token');
    }
  }, []);

  useEffect(() => {
    if (token) {
      setIsLoading(true);
      refreshUser().finally(() => setIsLoading(false));
    }
  }, [token, refreshUser]);

  const login = async (newToken: string) => {
    setIsLoading(true);
    localStorage.setItem('zera_token', newToken);
    setToken(newToken);
    try {
      await refreshUser();
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('zera_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isLoading,
      isAuthenticated: !!user,
      login,
      logout,
      refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
