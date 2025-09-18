// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authApi, Usuario } from '../services/api';

interface AuthContextType {
  isAuthenticated: boolean;
  user: Usuario | null;
  login: (correo: string, password: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    verificarAutenticacion();
  }, []);

  const verificarAutenticacion = async () => {
    try {
      const token = localStorage.getItem('sivec_token');
      const userData = localStorage.getItem('sivec_user');

      if (token && userData) {
        // Verificar que el token sea válido
        await authApi.verificarToken();
        
        setUser(JSON.parse(userData));
        setIsAuthenticated(true);
      }
    } catch (error) {
      // Token inválido o expirado
      localStorage.removeItem('sivec_token');
      localStorage.removeItem('sivec_user');
    } finally {
      setLoading(false);
    }
  };

  const login = async (correo: string, password: string): Promise<boolean> => {
    try {
      const response = await authApi.login({ correo, password });
      
      if (response.data.success) {
        const { token, usuario } = response.data.data;
        
        localStorage.setItem('sivec_token', token);
        localStorage.setItem('sivec_user', JSON.stringify(usuario));
        
        setUser(usuario);
        setIsAuthenticated(true);
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error en login:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      // Ignorar errores en logout
    } finally {
      localStorage.removeItem('sivec_token');
      localStorage.removeItem('sivec_user');
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const value = {
    isAuthenticated,
    user,
    login,
    logout,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};