// src/hooks/usePageTitle.ts
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Mapeo de rutas a títulos
 * Actualizar aquí cuando agregues nuevas páginas
 */
const routeTitles: Record<string, string> = {
  "/login": "Iniciar Sesión",
  "/home": "Inicio",
  "/dashboard": "Dashboard Analytics",
  "/historial": "Historial de Viajes",
  "/mapa-vivo": "Mapa en Vivo",
  "/reportes": "Reportes",
  "/admin/usuarios": "Administrar Usuarios",
  "/admin/pilotos-temporales": "Pilotos Temporales",
  "/admin/vehiculos": "Administrar Vehículos",
  "/perfil": "Mi Perfil",
  "/configuracion": "Configuración",
  "/ayuda": "Centro de Ayuda",
};

/**
 * Hook que actualiza automáticamente el título de la página
 * basándose en la ruta actual
 *
 * @example
 * // En App.tsx
 * useAutoPageTitle();
 *
 * // Resultado: "SIVEC - Dashboard" cuando estás en /dashboard
 */
export const useAutoPageTitle = () => {
  const location = useLocation();

  useEffect(() => {
    // Obtener la ruta base (sin parámetros dinámicos)
    const pathBase = location.pathname;

    // Caso especial: Detalle de Viaje (/viaje/:id)
    if (pathBase.startsWith("/viaje/")) {
      const viajeId = pathBase.split("/")[2];
      document.title = `SIVEC - Viaje #${viajeId}`;
      return;
    }

    // Buscar el título en el mapeo
    const title = routeTitles[pathBase];

    if (title) {
      document.title = `SIVEC - ${title}`;
    } else {
      // Fallback para rutas no mapeadas
      document.title = "SIVEC";
    }
  }, [location]);
};
