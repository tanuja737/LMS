import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthState } from '../types';
import { authApi, setAuthToken } from '../services/api';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, name: string, role?: 'user' | 'admin') => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  useEffect(() => {
    const bootstrap = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          setAuthToken(token);
          const res = await authApi.me();
          const backendUser = res.data.data.user;
          const mappedUser: User = {
            id: backendUser._id,
            email: backendUser.email,
            name: backendUser.name,
            role: backendUser.role === 'librarian' ? 'admin' : 'user',
            createdAt: backendUser.createdAt || new Date().toISOString(),
          };
          localStorage.setItem('library_user', JSON.stringify(mappedUser));
          setAuthState({ user: mappedUser, isAuthenticated: true, isLoading: false });
          return;
        } catch (e) {
          localStorage.removeItem('token');
        }
      }
      // No token
      setAuthToken(null);
      setAuthState(prev => ({ ...prev, isLoading: false }));
    };
    bootstrap();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const res = await authApi.login(email, password);
      const { user: backendUser, token } = res.data.data;
      localStorage.setItem('token', token);
      setAuthToken(token);
      const mappedUser: User = {
        id: backendUser._id,
        email: backendUser.email,
        name: backendUser.name,
        role: backendUser.role === 'librarian' ? 'admin' : 'user',
        createdAt: backendUser.createdAt || new Date().toISOString(),
      };
      localStorage.setItem('library_user', JSON.stringify(mappedUser));
      setAuthState({ user: mappedUser, isAuthenticated: true, isLoading: false });
      return true;
    } catch {
      return false;
    }
  };

  const register = async (email: string, password: string, name: string, role: 'user' | 'admin' = 'user'): Promise<boolean> => {
    try {
      const res = await authApi.register({ email, password, name, role: role === 'admin' ? 'librarian' : 'borrower' });
      const { user: backendUser, token } = res.data.data;
      localStorage.setItem('token', token);
      setAuthToken(token);
      const mappedUser: User = {
        id: backendUser._id,
        email: backendUser.email,
        name: backendUser.name,
        role: backendUser.role === 'librarian' ? 'admin' : 'user',
        createdAt: backendUser.createdAt || new Date().toISOString(),
      };
      localStorage.setItem('library_user', JSON.stringify(mappedUser));
      setAuthState({ user: mappedUser, isAuthenticated: true, isLoading: false });
      return true;
    } catch {
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('library_user');
    localStorage.removeItem('token');
    setAuthToken(null);
    setAuthState({ user: null, isAuthenticated: false, isLoading: false });
  };

  const value = {
    ...authState,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};