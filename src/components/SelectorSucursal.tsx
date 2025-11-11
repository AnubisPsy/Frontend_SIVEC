// SelectorSucursal.tsx - VERSIÓN CORREGIDA FINAL
// Usa user.sucursal.sucursal_id en lugar de user.sucursal_id

import React, { useEffect, useState } from "react";
import { useSucursal } from "../contexts/SucursalContext";
import { useAuth } from "../contexts/AuthContext";
import { Icons } from "./icons/IconMap";

const SelectorSucursal: React.FC = () => {
  const { user } = useAuth();
  const { sucursales, cambiarSucursal, cargarSucursales, loading } =
    useSucursal();
  const [renderKey, setRenderKey] = useState(0);

  console.log("🎨 SELECTOR RENDER:");
  console.log("  user.sucursal_id (directo):", user?.sucursal_id);
  console.log("  user.sucursal:", user?.sucursal);
  console.log("  user.sucursal.sucursal_id:", user?.sucursal?.sucursal_id);

  // Cargar sucursales al montar
  useEffect(() => {
    if (user?.rol_id === 3) {
      console.log("✅ Admin detectado, cargando sucursales");
      cargarSucursales();
    }
  }, [user?.rol_id]);

  // Forzar re-render cuando cambien las sucursales
  useEffect(() => {
    setRenderKey((prev) => prev + 1);
  }, [sucursales]);

  // Solo mostrar para administradores
  if (user?.rol_id !== 3) {
    return null;
  }

  // ✅ USAR EL CAMPO CORRECTO
  const sucursalActual = user?.sucursal?.sucursal_id || user?.sucursal_id || 1;
  console.log("🏢 Sucursal actual a mostrar:", sucursalActual);

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-slate-700 rounded-lg">
      <Icons.building className="w-5 h-5 text-gray-600 dark:text-slate-400 flex-shrink-0" />

      {loading ? (
        <div className="flex items-center gap-2">
          <Icons.refresh className="w-4 h-4 animate-spin text-gray-500 dark:text-slate-400" />
          <span className="text-sm text-gray-600 dark:text-slate-400">
            Cargando...
          </span>
        </div>
      ) : sucursales.length === 0 ? (
        <span className="text-sm text-gray-600 dark:text-slate-400">
          Sin sucursales disponibles
        </span>
      ) : (
        <>
          <select
            key={renderKey}
            value={sucursalActual} // ✅ CORREGIDO: Usar sucursal del objeto
            onChange={(e) => {
              const nuevaSucursalId = parseInt(e.target.value);
              console.log("🎯 Cambio seleccionado:", nuevaSucursalId);
              cambiarSucursal(nuevaSucursalId);
            }}
            className="bg-transparent border-none text-sm font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1 cursor-pointer min-w-[8rem]"
            title="Cambiar sucursal (Admin)"
          >
            {sucursales.map((s) => (
              <option
                key={s.sucursal_id}
                value={s.sucursal_id}
                className="text-gray-900 dark:text-white bg-white dark:bg-slate-800"
              >
                {s.nombre_sucursal}
              </option>
            ))}
          </select>

          <span className="text-xs text-gray-500 dark:text-slate-400">
            ({sucursales.length})
          </span>
        </>
      )}
    </div>
  );
};

export default SelectorSucursal;
