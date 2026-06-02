import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User, LoginRequest, RegisterRequest } from '../types/user';
import * as authApi from '../api/auth';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  loading: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const saveAuth = (tokenData: { access_token: string; refresh_token: string; user: User }) => {
    localStorage.setItem('access_token', tokenData.access_token);
    localStorage.setItem('refresh_token', tokenData.refresh_token);
    localStorage.setItem('user', JSON.stringify(tokenData.user));
    setUser(tokenData.user);
  };

  const login = useCallback(async (data: LoginRequest) => {
    const res = await authApi.login(data);
    saveAuth(res);
  }, []);

  const register = useCallback(async (data: RegisterRequest) => {
    const res = await authApi.register(data);
    saveAuth(res);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const u = await authApi.getMe();
      setUser(u);
      localStorage.setItem('user', JSON.stringify(u));
    } catch {
      logout();
    }
  }, [logout]);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const savedUser = localStorage.getItem('user');
    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
        authApi.getMe().then((u) => {
          setUser(u);
          localStorage.setItem('user', JSON.stringify(u));
        }).catch(() => {});
      } catch {
        logout();
      }
    }
    setLoading(false);
  }, [logout]);

  const value: AuthState = {
    user,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    loading,
    login,
    register,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
