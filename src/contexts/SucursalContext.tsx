// SucursalContext.tsx - VERSIÓN FINAL CON UPDATE A BD
// Reemplaza tu archivo actual con este

import React, { createContext, useContext, useState, ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { sucursalesApi, usuariosApi } from "../services/api";
import { toast } from "react-toastify";

interface Sucursal {
  sucursal_id: number;
  nombre_sucursal: string;
  created_at?: string;
}

interface SucursalContextType {
  sucursales: Sucursal[];
  cambiarSucursal: (sucursalId: number) => void;
  cargarSucursales: () => Promise<void>;
  loading: boolean;
}

const SucursalContext = createContext<SucursalContextType | undefined>(
  undefined
);

export const SucursalProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [loading, setLoading] = useState(false);

  // Cargar sucursales (solo para admins)
  const cargarSucursales = async () => {
    if (user?.rol_id !== 3) {
      return;
    }

    setLoading(true);
    try {
      const response = await sucursalesApi.obtenerTodas();

      if (response.data.success) {
        const sucursalesData = response.data.data;
        setSucursales(sucursalesData);
      //  console.log(`✅ ${sucursalesData.length} sucursales cargadas`);
      }
    } catch (error: any) {
      console.error("❌ Error cargando sucursales:", error);
    } finally {
      setLoading(false);
    }
  };

  // Cambiar sucursal (solo admins)
  const cambiarSucursal = async (sucursalId: number) => {
    if (user?.rol_id !== 3) {
      console.warn("⚠️ Solo administradores pueden cambiar de sucursal");
      toast.warn("Solo administradores pueden cambiar de sucursal");
      return;
    }

    // ✅ OBTENER SUCURSAL ACTUAL DEL OBJETO
    const sucursalActualId = user?.sucursal?.sucursal_id || user?.sucursal_id;

  /*  console.log("═══════════════════════════════════════════════════");
    console.log("🔄 CAMBIAR SUCURSAL");
    console.log("═══════════════════════════════════════════════════");
    console.log("Usuario ID:", user.usuario_id);
    console.log("Sucursal actual ID:", sucursalActualId);
    console.log("Nueva sucursal ID:", sucursalId);
    */

    // Verificar que sea un cambio real
    if (sucursalActualId === sucursalId) {
   //   console.log("ℹ️ Ya estás en esa sucursal");
      toast.info("Ya estás en esa sucursal");
      return;
    }

    // Buscar la sucursal completa
    const sucursalSeleccionada = sucursales.find(
      (s) => s.sucursal_id === sucursalId
    );

    if (!sucursalSeleccionada) {
      console.error("❌ Sucursal no encontrada en la lista");
      toast.error("Sucursal no encontrada");
      return;
    }

  /*  console.log(
      `✅ Sucursal encontrada: "${sucursalSeleccionada.nombre_sucursal}"`
    );
*/

    try {
      // 🔥 PASO 1: ACTUALIZAR EN LA BASE DE DATOS
    //  console.log("📡 Actualizando sucursal en la base de datos...");
      toast.info("Cambiando sucursal...", { autoClose: 2000 });

      const response = await usuariosApi.actualizarSucursal(
        user.usuario_id,
        sucursalId
      );

    //  console.log("📥 Respuesta del servidor:", response.data);

      if (response.data.success) {
        //     console.log("✅ Sucursal actualizada en BD exitosamente");

        // 🔥 PASO 2: ACTUALIZAR LOCALSTORAGE
        const usuarioActualizado = {
          ...user,
          sucursal_id: sucursalId,
          sucursal: {
            sucursal_id: sucursalId,
            nombre_sucursal: sucursalSeleccionada.nombre_sucursal,
          },
        };

        localStorage.setItem("sivec_user", JSON.stringify(usuarioActualizado));
        localStorage.setItem("sucursal_admin", sucursalId.toString());

        //      console.log("✅ Usuario actualizado en localStorage");

        // 🔥 PASO 3: NOTIFICAR Y RECARGAR
        toast.success(
          `Cambiando a ${sucursalSeleccionada.nombre_sucursal}...`,
          {
            autoClose: 1500,
          }
        );

        //     console.log("🔄 Recargando página en 1 segundo...");
        //    console.log("═══════════════════════════════════════════════════");

        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        console.error("❌ Error: respuesta sin success");
        toast.error("Error al cambiar sucursal");
      }
    } catch (error: any) {
      console.error("❌ ERROR al actualizar sucursal:", error);
      console.error("Error response:", error.response?.data);

      const mensaje =
        error.response?.data?.message || "Error al cambiar sucursal";
      toast.error(mensaje);
    }
  };

  return (
    <SucursalContext.Provider
      value={{
        sucursales,
        cambiarSucursal,
        cargarSucursales,
        loading,
      }}
    >
      {children}
    </SucursalContext.Provider>
  );
};

export const useSucursal = () => {
  const context = useContext(SucursalContext);
  if (context === undefined) {
    throw new Error("useSucursal debe usarse dentro de SucursalProvider");
  }
  return context;
};
