// src/contexts/AuthContext.tsx
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { authApi, Usuario } from "../services/api";

interface AuthContextType {
  isAuthenticated: boolean;
  user: Usuario | null;
  login: (loginInput: string, password: string) => Promise<LoginResult>;
  logout: () => void;
  loading: boolean;
}

export interface LoginResult {
  success: boolean;
  error?: "CREDENCIALES_INVALIDAS" | "PILOTO_BLOQUEADO" | "ERROR_SERVIDOR";
  message?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
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
      const token = localStorage.getItem("sivec_token");
      const userData = localStorage.getItem("sivec_user");

      if (token && userData) {
        await authApi.verificarToken();
        setUser(JSON.parse(userData));
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.log("⚠️ Token inválido, limpiando...");
      localStorage.removeItem("sivec_token");
      localStorage.removeItem("sivec_user");
    } finally {
      setLoading(false);
    }
  };

  const login = async (
    loginInput: string,
    password: string
  ): Promise<LoginResult> => {
    try {
      const response = await authApi.login({ loginInput, password });

      if (response.data.success) {
        const { token, usuario } = response.data.data;

        if (usuario.rol_id === 1) {
          return {
            success: false,
            error: "PILOTO_BLOQUEADO",
            message: "Los pilotos deben usar la aplicación móvil",
          };
        }

        localStorage.setItem("sivec_token", token);
        localStorage.setItem("sivec_user", JSON.stringify(usuario));
        setUser(usuario);
        setIsAuthenticated(true);

        return { success: true };
      }

      return {
        success: false,
        error: "CREDENCIALES_INVALIDAS",
        message: "Usuario o contraseña incorrectos",
      };
    } catch (error: any) {
      console.error("❌ Error en login:", error);

      return {
        success: false,
        error: "ERROR_SERVIDOR",
        message:
          error.response?.data?.error ||
          error.response?.data?.message ||
          "No se pudo conectar con el servidor",
      };
    }
  };

  const logout = () => {
    console.log("👋 Logout - Limpiando y redirigiendo...");

    // ✅ SOLO limpiar localStorage
    localStorage.removeItem("sivec_token");
    localStorage.removeItem("sivec_user");

    // ✅ NO cambiar estado (evita re-renders)
    // ✅ Redirigir INMEDIATAMENTE
    window.location.href = "/login";

    // Intentar notificar al backend (asíncrono, no importa si falla)
    authApi.logout().catch(() => {
      console.log("⚠️ No se pudo notificar logout al servidor");
    });
  };

  const value = {
    isAuthenticated,
    user,
    login,
    logout,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
