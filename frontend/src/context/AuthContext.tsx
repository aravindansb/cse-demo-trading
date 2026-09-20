'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../lib/api';

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'USER' | 'ADMIN' | 'SUPER_ADMIN';
  balance?: number;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string, securityPin?: string, role?: 'USER' | 'ADMIN' | 'SUPER_ADMIN') => Promise<void>;
  resetPasswordWithPin: (identifier: string, pin: string, newPassword: string) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshProfile = async () => {
    try {
      const response = await api.get('/auth/me');
      if (response.data) {
        setUser({
          id: response.data.id,
          username: response.data.username,
          email: response.data.email,
          role: response.data.role,
          balance: response.data.wallet?.balance,
        });
      }
    } catch {
      logout();
    }
  };

  useEffect(() => {
    const savedToken = localStorage.getItem('cse_token');
    const savedUser = localStorage.getItem('cse_user');

    if (savedToken && savedUser) {
      setToken(savedToken);
      try {
        setUser(JSON.parse(savedUser));
        refreshProfile();
      } catch {
        logout();
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (identifier: string, password: string) => {
    const res = await api.post('/auth/login', { identifier, password });
    const { token: receivedToken, user: receivedUser } = res.data;
    setToken(receivedToken);
    setUser(receivedUser);
    localStorage.setItem('cse_token', receivedToken);
    localStorage.setItem('cse_user', JSON.stringify(receivedUser));
  };

  const register = async (username: string, email: string, password: string, securityPin?: string, role: 'USER' | 'ADMIN' | 'SUPER_ADMIN' = 'USER') => {
    const res = await api.post('/auth/register', { username, email, password, securityPin, role });
    const { token: receivedToken, user: receivedUser } = res.data;
    setToken(receivedToken);
    setUser(receivedUser);
    localStorage.setItem('cse_token', receivedToken);
    localStorage.setItem('cse_user', JSON.stringify(receivedUser));
  };

  const resetPasswordWithPin = async (identifier: string, pin: string, newPassword: string) => {
    const res = await api.post('/auth/reset-password-with-pin', { identifier, pin, newPassword });
    const { token: receivedToken, user: receivedUser } = res.data;
    setToken(receivedToken);
    setUser(receivedUser);
    localStorage.setItem('cse_token', receivedToken);
    localStorage.setItem('cse_user', JSON.stringify(receivedUser));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('cse_token');
    localStorage.removeItem('cse_user');
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, resetPasswordWithPin, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
