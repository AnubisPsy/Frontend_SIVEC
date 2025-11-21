// AuthContext.tsx - CON SISTEMA DE TIMESTAMP Y AUTO-LOGOUT + reCAPTCHA
// Maneja token de 12 horas + logout automático después de X horas de inactividad + reCAPTCHA

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
  login: (
    loginInput: string,
    password: string,
    recaptchaToken?: string | null
  ) => Promise<LoginResult>;
  logout: () => void;
  loading: boolean;
  actualizarActividad: () => void;
}

// ✅ ACTUALIZADO: Incluye más tipos de error y requiereCaptcha
export interface LoginResult {
  success: boolean;
  error?:
    | "CREDENCIALES_INVALIDAS"
    | "PILOTO_BLOQUEADO"
    | "ERROR_SERVIDOR"
    | "CAPTCHA_REQUERIDO"
    | "CAPTCHA_INVALIDO"
    | "USUARIO_INACTIVO";
  message?: string;
  requiereCaptcha?: boolean; // ✅ NUEVO
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
const HORAS_INACTIVIDAD = 8; // Tiempo máximo de inactividad permitido
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
    //  console.log("⚠️ No hay registro de última actividad");
      return false;
    }

    const ahora = Date.now();
    const tiempoInactivo = ahora - parseInt(ultimaActividad);
    const horasInactivo = tiempoInactivo / MILISEGUNDOS_POR_HORA;

  //  console.log(`⏰ Tiempo inactivo: ${horasInactivo.toFixed(2)} horas`);

    if (tiempoInactivo > TIEMPO_MAXIMO_INACTIVIDAD) {
    //  console.log(
    //    `❌ Inactividad excedida (>${HORAS_INACTIVIDAD}h) - Forzando logout`
    //  );
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
   /* console.log("═══════════════════════════════════════════════════");
    console.log("🔍 VERIFICAR AUTENTICACIÓN");
    console.log("═══════════════════════════════════════════════════");*/

    try {
      const token = localStorage.getItem("sivec_token");
      const userData = localStorage.getItem("sivec_user");

      if (token && userData) {
        // ✅ VERIFICAR INACTIVIDAD PRIMERO
        const hayInactividad = verificarInactividad();

        if (hayInactividad) {
        //  console.log("⏰ Sesión expirada por inactividad - Limpiando...");
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
      /*  console.log("📄 Usuario de localStorage:", user);
        console.log("  - sucursal_id (directo):", user.sucursal_id);
        console.log("  - sucursal (objeto):", user.sucursal);
        console.log("  - rol_id:", user.rol_id);
        */

        // Si es admin, verificar preferencia guardada
        if (user.rol_id === 3) {
       //   console.log("👤 Usuario es ADMIN");
          const sucursalGuardada = localStorage.getItem("sucursal_admin");
        //  console.log("🏢 Preferencia guardada:", sucursalGuardada);

          if (sucursalGuardada) {
            const nuevaSucursalId = parseInt(sucursalGuardada);

            // ✅ Actualizar AMBOS: el campo directo Y el objeto
            user.sucursal_id = nuevaSucursalId;

            // Si tiene objeto sucursal, actualizar su ID también
            if (user.sucursal) {
              user.sucursal.sucursal_id = nuevaSucursalId;
           /*  console.log(
                `✅ Objeto sucursal actualizado a ID: ${nuevaSucursalId}`
              );
              */
            }

          //  console.log("📄 Usuario FINAL:", user);
          }
        }

        setUser(user);
        setIsAuthenticated(true);

        // ✅ ACTUALIZAR ACTIVIDAD AL VERIFICAR
        actualizarActividad();
      //  console.log("✅ Usuario cargado en estado + actividad actualizada");
      }
    } catch (error) {
    //  console.log("❌ Token inválido, limpiando...");
      localStorage.removeItem("sivec_token");
      localStorage.removeItem("sivec_user");
      localStorage.removeItem("sucursal_admin");
      localStorage.removeItem("sivec_last_activity");
    } finally {
      setLoading(false);
    //  console.log("═══════════════════════════════════════════════════");
    }
  };

  // ✅ ACTUALIZADO: Ahora acepta recaptchaToken opcional
  const login = async (
    loginInput: string,
    password: string,
    recaptchaToken?: string | null
  ): Promise<LoginResult> => {
    try {
      // ✅ NUEVO: Incluir recaptchaToken en la petición
      const response = await authApi.login({
        loginInput,
        password,
        recaptchaToken,
      });

    //  console.log("📡 Respuesta del servidor:", response.data);

      if (response.data.success) {
        const { token, usuario } = response.data.data!;

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
          const sucursalId =
            usuario.sucursal?.sucursal_id || usuario.sucursal_id;
          localStorage.setItem("sucursal_admin", sucursalId.toString());
      //    console.log(`✅ Preferencia inicializada: ${sucursalId}`);
        }

        // ✅ INICIALIZAR TIMESTAMP DE ACTIVIDAD
        actualizarActividad();
    /*    console.log("✅ Timestamp de actividad inicializado");
        console.log("Token:", token);
        console.log("Usuario:", usuario);
        */

        setUser(usuario);
        setIsAuthenticated(true);

        return { success: true };
      }

      // ✅ Manejar respuesta de error del servidor
      const errorData = response.data;

      return {
        success: false,
        error: (errorData.error as any) || "CREDENCIALES_INVALIDAS",
        message: errorData.message || "Error en el login",
        requiereCaptcha: errorData.requiereCaptcha || false, // ✅ NUEVO
      };
    } catch (error: any) {
      console.error("❌ Error en login:", error);

      // ✅ NUEVO: Extraer requiereCaptcha de la respuesta de error
      const errorResponse = error.response?.data;

      return {
        success: false,
        error: (errorResponse?.error as any) || "ERROR_SERVIDOR",
        message:
          errorResponse?.message ||
          error.message ||
          "No se pudo conectar con el servidor",
        requiereCaptcha: errorResponse?.requiereCaptcha || false, // ✅ NUEVO
      };
    }
  };

  const logout = () => {
 //   console.log("👋 Logout - Limpiando...");

    localStorage.removeItem("sivec_token");
    localStorage.removeItem("sivec_user");
    localStorage.removeItem("sucursal_admin");
    localStorage.removeItem("sivec_last_activity");

    window.location.href = "/login";

    authApi.logout().catch(() => {
      //console.log("⚠️ No se pudo notificar logout al servidor");
    });
  };

  const value = {
    isAuthenticated,
    user,
    login,
    logout,
    loading,
    actualizarActividad,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
