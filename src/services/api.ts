// src/services/api.ts - CON SOPORTE reCAPTCHA
import axios from "axios";

const API_URL = "http://localhost:3000";

// Configurar interceptor para incluir token automáticamente
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor para agregar token a todas las requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("sivec_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ✅ Interceptor INTELIGENTE - Maneja login, logout y tokens expirados
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const url = error.config?.url || "";

      // ✅ CASO 1: Login fallido - NO redirigir (deja que Login.tsx lo maneje)
      const isLoginRequest = url.includes("/auth/login");

      // ✅ CASO 2: Logout o verificar token - NO redirigir
      const isLogoutRequest = url.includes("/auth/logout");
      const isVerifyRequest = url.includes("/auth/verificar");

      // ✅ CASO 3: Token expirado en ruta protegida - SÍ redirigir
      if (!isLoginRequest && !isLogoutRequest && !isVerifyRequest) {
        console.log("🔒 Token expirado o inválido, redirigiendo a login...");
        localStorage.removeItem("sivec_token");
        localStorage.removeItem("sivec_user");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

// ✅ INTERFAZ USUARIO CORREGIDA - CON CAMPO SUCURSAL
export interface Usuario {
  usuario_id: number;
  nombre_usuario: string;
  correo: string;
  rol_id: number;
  sucursal_id: number;
  created_at: string;
  rol: {
    rol_id: number;
    nombre_rol: string;
    descripcion: string;
  };
  sucursal?: {
    sucursal_id: number;
    nombre_sucursal: string;
  };
}

export interface FacturaAsignada {
  factura_id: number;
  numero_factura: string;
  piloto: string;
  numero_vehiculo: string;
  fecha_asignacion: string;
  estado_id: number;
  viaje_id?: number;
  notas_jefe?: string;
  created_at: string;
  updated_at: string;
  estados: {
    estado_id: number;
    codigo: string;
    nombre: string;
    descripcion: string;
  };
  viaje?: {
    viaje_id: number;
    numero_guia: string;
    fecha_viaje: string;
    cliente: string;
  };
}

// ✅ ACTUALIZADO: Ahora incluye recaptchaToken opcional
export interface LoginCredentials {
  loginInput: string;
  password: string;
  recaptchaToken?: string | null; // ✅ NUEVO
}

// ✅ ACTUALIZADO: Respuesta puede incluir requiereCaptcha
export interface LoginResponse {
  success: boolean;
  data?: {
    token: string;
    usuario: Usuario;
  };
  message?: string;
  error?: string;
  requiereCaptcha?: boolean; // ✅ NUEVO
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  total?: number;
  filtros?: any;
  error?: string;
}

// ==========================================
// AUTH API
// ==========================================

export const authApi = {
  // ✅ ACTUALIZADO: Ahora acepta recaptchaToken
  login: (credentials: LoginCredentials) =>
    api.post<LoginResponse>("/auth/login", credentials),

  verificarToken: () => api.post("/auth/verificar"),

  logout: () => api.post("/auth/logout"),

  // ✅ NUEVO: Endpoint para verificar si requiere captcha
  verificarRequiereCaptcha: (loginInput: string) =>
    api.post<{
      success: boolean;
      data: {
        requiereCaptcha: boolean;
        intentos: number;
      };
    }>("/auth/verificar-captcha-requerido", { loginInput }),
};

// ==========================================
// USUARIOS API
// ==========================================

export const usuariosApi = {
  obtenerTodos: (params?: any) =>
    api.get<ApiResponse<Usuario[]>>("/api/usuarios", { params }),

  obtenerPorId: (id: number) =>
    api.get<ApiResponse<Usuario>>(`/api/usuarios/${id}`),

  crear: (usuario: Partial<Usuario>) =>
    api.post<ApiResponse<Usuario>>("/api/usuarios", usuario),

  actualizar: (id: number, usuario: Partial<Usuario>) =>
    api.put<ApiResponse<Usuario>>(`/api/usuarios/${id}`, usuario),

  eliminar: (id: number) => api.delete<ApiResponse<any>>(`/api/usuarios/${id}`),

  obtenerPilotos: () =>
    api.get<ApiResponse<Usuario[]>>("/api/usuarios/roles/pilotos"),

  obtenerJefesYarda: () =>
    api.get<ApiResponse<Usuario[]>>("/api/usuarios/roles/jefes-yarda"),

  actualizarSucursal: (usuarioId: number, sucursalId: number) =>
    api.put<ApiResponse<Usuario>>(`/api/usuarios/${usuarioId}/sucursal`, {
      sucursal_id: sucursalId,
    }),

  // ✅ AGREGAR ESTA FUNCIÓN:
  cambiarContrasena: (passwordActual: string, passwordNuevo: string) =>
    api.put<ApiResponse<any>>("/api/usuarios/cambiar-contrasena", {
      passwordActual,
      passwordNuevo,
    }),
};

interface HistorialResponse {
  success: boolean;
  data: any[];
  estadisticas: {
    total_viajes: number;
    total_facturas: number;
    total_guias: number;
    total_entregadas: number;
    pilotos_activos: number;
  };
  filtros: any;
}

export const viajesApi = {
  obtenerTodos: (params?: any) =>
    api.get<ApiResponse<any[]>>("/api/viajes", { params }),

  obtenerPorId: (id: number) => api.get<ApiResponse<any>>(`/api/viajes/${id}`),

  obtenerRecientes: () => api.get<HistorialResponse>("/api/viajes/recientes"),

  obtenerHistorial: (params?: {
    fecha_desde?: string;
    fecha_hasta?: string;
    piloto?: string;
    numero_vehiculo?: string;
  }) => api.get<HistorialResponse>("/api/viajes/historial", { params }),
};

export const sucursalesApi = {
  obtenerTodas: () => api.get<ApiResponse<any[]>>("/api/sucursales"),
};

export const facturasApi = {
  obtenerTodas: (params?: any) =>
    api.get<ApiResponse<FacturaAsignada[]>>("/api/facturas", { params }),

  obtenerPorId: (id: number) =>
    api.get<ApiResponse<FacturaAsignada>>(`/api/facturas/${id}`),

  asignar: (factura: {
    numero_factura: string;
    piloto: string;
    numero_vehiculo: string;
    fecha_asignacion?: string;
    notas_jefe?: string;
  }) => api.post<ApiResponse<FacturaAsignada>>("/api/facturas", factura),

  actualizar: (id: number, factura: Partial<FacturaAsignada>) =>
    api.put<ApiResponse<FacturaAsignada>>(`/api/facturas/${id}`, factura),

  eliminar: (id: number) => api.delete<ApiResponse<any>>(`/api/facturas/${id}`),

  obtenerPendientes: () =>
    api.get<ApiResponse<FacturaAsignada[]>>("/api/facturas/status/pendientes"),

  obtenerDespachadas: (params?: any) =>
    api.get<ApiResponse<FacturaAsignada[]>>(
      "/api/facturas/status/despachadas",
      { params }
    ),

  obtenerEstadisticas: (params?: any) =>
    api.get<
      ApiResponse<{
        total: number;
        asignadas: number;
        despachadas: number;
        porcentaje_completado: number;
      }>
    >("/api/facturas/reportes/estadisticas", { params }),

  obtenerDatosFormulario: () => api.get("/api/facturas/form-data"),
};

export const estadisticasApi = {
  obtenerDashboard: (fecha?: string) =>
    api.get<
      ApiResponse<{
        viajesActivos: number;
        viajesCompletados: number;
        entregasCompletadas: number;
        entregasPendientes: number;
        tasaExito: number;
        totalGuias: number;
      }>
    >("/api/estadisticas/dashboard", {
      params: fecha ? { fecha } : {},
    }),

  obtenerEntregasPorHora: (fecha?: string) =>
    api.get<
      ApiResponse<
        Array<{
          hora: string;
          entregas: number;
        }>
      >
    >("/api/estadisticas/entregas-por-hora", {
      params: fecha ? { fecha } : {},
    }),

  obtenerViajesPorSucursal: (params?: {
    fecha_desde?: string;
    fecha_hasta?: string;
    sucursal_id?: number;
  }) =>
    api.get<
      ApiResponse<
        Array<{
          nombre: string;
          viajes: number;
        }>
      >
    >("/api/estadisticas/viajes-por-sucursal", { params }),

  obtenerTopPilotos: (params?: {
    fecha_desde?: string;
    fecha_hasta?: string;
  }) =>
    api.get<
      ApiResponse<
        Array<{
          piloto: string;
          viajes: number;
          entregas: number;
          total: number;
          tasaExito: number;
        }>
      >
    >("/api/estadisticas/top-pilotos", { params }),

  obtenerActividadReciente: (limit?: number) =>
    api.get<
      ApiResponse<
        Array<{
          tipo: string;
          descripcion: string;
          timestamp: string;
          estado: number;
        }>
      >
    >("/api/estadisticas/actividad-reciente", {
      params: limit ? { limit } : {},
    }),

  obtenerTendenciaSemanal: () =>
    api.get<
      ApiResponse<
        Array<{
          fecha: string;
          dia: string;
          entregas: number;
        }>
      >
    >("/api/estadisticas/tendencia-semanal"),

  obtenerComparacionEstados: (fecha?: string) =>
    api.get<
      ApiResponse<
        Array<{
          estado: string;
          cantidad: number;
          color: string;
        }>
      >
    >("/api/estadisticas/comparacion-estados", {
      params: fecha ? { fecha } : {},
    }),
};

// ==========================================
// VEHÍCULOS API
// ==========================================

export const vehiculosApi = {
  obtenerTodos: (params?: {
    sucursal_id?: number;
    agrupacion?: string;
    activo?: boolean;
    busqueda?: string;
  }) =>
    api.get<
      ApiResponse<
        Array<{
          vehiculo_id: number;
          agrupacion: string | null;
          numero_vehiculo: string;
          placa: string;
          sucursal_id: number;
          activo: boolean;
          created_at: string;
          updated_at: string;
          sucursales?: {
            sucursal_id: number;
            nombre_sucursal: string;
          };
        }>
      >
    >("/api/vehiculos", { params }),

  obtenerPorId: (id: number) =>
    api.get<
      ApiResponse<{
        vehiculo_id: number;
        agrupacion: string | null;
        numero_vehiculo: string;
        placa: string;
        sucursal_id: number;
        activo: boolean;
        created_at: string;
        updated_at: string;
      }>
    >(`/api/vehiculos/${id}`),

  crear: (datos: {
    numero_vehiculo: string;
    placa: string;
    agrupacion?: string;
    sucursal_id: number;
  }) => api.post<ApiResponse<any>>("/api/vehiculos", datos),

  actualizar: (
    id: number,
    datos: {
      numero_vehiculo?: string;
      placa?: string;
      agrupacion?: string;
      sucursal_id?: number;
    }
  ) => api.put<ApiResponse<any>>(`/api/vehiculos/${id}`, datos),

  eliminar: (id: number) =>
    api.delete<ApiResponse<void>>(`/api/vehiculos/${id}`),

  desactivar: (id: number) =>
    api.patch<ApiResponse<any>>(`/api/vehiculos/${id}/desactivar`),

  activar: (id: number) =>
    api.patch<ApiResponse<any>>(`/api/vehiculos/${id}/activar`),

  obtenerPorSucursal: (sucursal_id: number) =>
    api.get<ApiResponse<Array<any>>>(`/api/vehiculos/sucursal/${sucursal_id}`),
};

// ==========================================
// UBICACIONES API
// ==========================================

export const ubicacionesApi = {
  obtenerTodas: (params?: { sucursal_id?: number }) =>
    api.get<
      ApiResponse<{
        total: number;
        con_gps: number;
        sin_gps: number;
        en_viaje: number;
        ubicaciones: Array<{
          vehiculo_id: number;
          numero_vehiculo: string;
          placa: string;
          sucursal_id: number;
          sucursal: string;
          wialon_id: number | null;
          wialon_uid: string | null;
          tiene_gps: boolean;
          latitud: number | null;
          longitud: number | null;
          velocidad: number;
          direccion: number;
          ultima_actualizacion: string | null;
          wialon_nombre: string | null; 
          tiene_viaje: boolean;
          viaje_id: number | null;
          piloto: string | null;
          estado_viaje: string;
          estado_viaje_id: number | null;
        }>;
      }>
    >("/api/ubicaciones", { params }),

  obtenerPorVehiculo: (numero_vehiculo: string) =>
    api.get<ApiResponse<any>>(`/api/ubicaciones/${numero_vehiculo}`),
};

export default api;
