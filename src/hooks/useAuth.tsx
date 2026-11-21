import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';
import { User } from '../types';
import { notifications } from '@mantine/notifications';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: { username: string; password: string }) => Promise<boolean>;
  logout: () => Promise<void>;
  updateUser: (updatedUser: User) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const res = await api.get<User>('/auth/me/');
      setUser(res.data);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (credentials: { username: string; password: string }): Promise<boolean> => {
    try {
      const res = await api.post('/auth/login/', credentials);
      setUser(res.data.user);
      notifications.show({
        title: 'Bienvenido',
        message: `Sesión iniciada como ${res.data.user.full_name}`,
        color: 'teal',
      });
      return true;
    } catch (err: any) {
      const message = err.response?.data?.detail || 'Error al iniciar sesión.';
      notifications.show({
        title: 'Error de Autenticación',
        message,
        color: 'red',
      });
      return false;
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout/');
    } catch (e) {
      // ignore
    } finally {
      setUser(null);
      // Replace window location to prevent browser back-button re-entry
      window.location.replace('/login');
    }
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser, refreshUser }}>
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
