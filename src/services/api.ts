// src/services/api.ts
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

export interface Usuario {
  usuario_id: number;
  nombre_usuario: string;
  correo: string;
  rol_id: number;
  created_at: string;
  rol: {
    rol_id: number;
    nombre_rol: string;
    descripcion: string;
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

export interface LoginCredentials {
  loginInput: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  data: {
    token: string;
    usuario: Usuario;
  };
  message: string;
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
  login: (credentials: LoginCredentials) =>
    api.post<LoginResponse>("/auth/login", credentials),

  verificarToken: () => api.post("/auth/verificar"),

  logout: () => api.post("/auth/logout"),
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

export default api;
