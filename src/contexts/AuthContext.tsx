// AuthContext.tsx - CON SISTEMA DE TIMESTAMP Y AUTO-LOGOUT
// Maneja token de 12 horas + logout automático después de X horas de inactividad

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
  actualizarActividad: () => void; // ✅ NUEVO
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

// ⏰ CONSTANTES DE TIEMPO
const HORAS_INACTIVIDAD = 1; // Tiempo máximo de inactividad permitido
const MILISEGUNDOS_POR_HORA = 60 * 60 * 1000;
const TIEMPO_MAXIMO_INACTIVIDAD = HORAS_INACTIVIDAD * MILISEGUNDOS_POR_HORA;

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    verificarAutenticacion();
  }, []);

  // ✅ FUNCIÓN PARA VERIFICAR SI HAY INACTIVIDAD
  const verificarInactividad = (): boolean => {
    const ultimaActividad = localStorage.getItem("sivec_last_activity");

    if (!ultimaActividad) {
      console.log("⚠️ No hay registro de última actividad");
      return false;
    }

    const ahora = Date.now();
    const tiempoInactivo = ahora - parseInt(ultimaActividad);
    const horasInactivo = tiempoInactivo / MILISEGUNDOS_POR_HORA;

    console.log(`⏰ Tiempo inactivo: ${horasInactivo.toFixed(2)} horas`);

    if (tiempoInactivo > TIEMPO_MAXIMO_INACTIVIDAD) {
      console.log(
        `❌ Inactividad excedida (>${HORAS_INACTIVIDAD}h) - Forzando logout`
      );
      return true;
    }

    return false;
  };

  // ✅ FUNCIÓN PARA ACTUALIZAR TIMESTAMP DE ACTIVIDAD
  const actualizarActividad = () => {
    const ahora = Date.now().toString();
    localStorage.setItem("sivec_last_activity", ahora);
  };

  const verificarAutenticacion = async () => {
    console.log("═══════════════════════════════════════════════════");
    console.log("🔍 VERIFICAR AUTENTICACIÓN");
    console.log("═══════════════════════════════════════════════════");

    try {
      const token = localStorage.getItem("sivec_token");
      const userData = localStorage.getItem("sivec_user");

      if (token && userData) {
        // ✅ VERIFICAR INACTIVIDAD PRIMERO
        const hayInactividad = verificarInactividad();

        if (hayInactividad) {
          console.log("⏰ Sesión expirada por inactividad - Limpiando...");
          localStorage.removeItem("sivec_token");
          localStorage.removeItem("sivec_user");
          localStorage.removeItem("sucursal_admin");
          localStorage.removeItem("sivec_last_activity");
          setLoading(false);
          return;
        }

        // Verificar validez del token con el backend
        await authApi.verificarToken();

        const user = JSON.parse(userData);
        console.log("📄 Usuario de localStorage:", user);
        console.log("  - sucursal_id (directo):", user.sucursal_id);
        console.log("  - sucursal (objeto):", user.sucursal);
        console.log("  - rol_id:", user.rol_id);

        // Si es admin, verificar preferencia guardada
        if (user.rol_id === 3) {
          console.log("👤 Usuario es ADMIN");
          const sucursalGuardada = localStorage.getItem("sucursal_admin");
          console.log("🏢 Preferencia guardada:", sucursalGuardada);

          if (sucursalGuardada) {
            const nuevaSucursalId = parseInt(sucursalGuardada);

            // ✅ Actualizar AMBOS: el campo directo Y el objeto
            user.sucursal_id = nuevaSucursalId;

            // Si tiene objeto sucursal, actualizar su ID también
            if (user.sucursal) {
              user.sucursal.sucursal_id = nuevaSucursalId;
              console.log(
                `✅ Objeto sucursal actualizado a ID: ${nuevaSucursalId}`
              );
            }

            console.log("📄 Usuario FINAL:", user);
          }
        }

        setUser(user);
        setIsAuthenticated(true);

        // ✅ ACTUALIZAR ACTIVIDAD AL VERIFICAR
        actualizarActividad();
        console.log("✅ Usuario cargado en estado + actividad actualizada");
      }
    } catch (error) {
      console.log("❌ Token inválido, limpiando...");
      localStorage.removeItem("sivec_token");
      localStorage.removeItem("sivec_user");
      localStorage.removeItem("sucursal_admin");
      localStorage.removeItem("sivec_last_activity");
    } finally {
      setLoading(false);
      console.log("═══════════════════════════════════════════════════");
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

        // Si es admin, inicializar preferencia con su sucursal actual
        if (usuario.rol_id === 3) {
          // ✅ Usar el ID del objeto sucursal si existe
          const sucursalId =
            usuario.sucursal?.sucursal_id || usuario.sucursal_id;
          localStorage.setItem("sucursal_admin", sucursalId.toString());
          console.log(`✅ Preferencia inicializada: ${sucursalId}`);
        }

        // ✅ INICIALIZAR TIMESTAMP DE ACTIVIDAD
        actualizarActividad();
        console.log("✅ Timestamp de actividad inicializado");

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
    console.log("👋 Logout - Limpiando...");

    localStorage.removeItem("sivec_token");
    localStorage.removeItem("sivec_user");
    localStorage.removeItem("sucursal_admin");
    localStorage.removeItem("sivec_last_activity"); // ✅ LIMPIAR TIMESTAMP

    window.location.href = "/login";

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
    actualizarActividad, // ✅ EXPORTAR FUNCIÓN
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
