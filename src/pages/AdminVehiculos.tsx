// src/pages/AdminVehiculos.tsx
import React, { useState, useEffect, useMemo } from "react";
import { vehiculosApi, sucursalesApi } from "../services/api";
import { Icons } from "../components/icons/IconMap";
import { useAuth } from "../contexts/AuthContext";

interface Vehiculo {
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
}

interface Sucursal {
  sucursal_id: number;
  nombre_sucursal: string;
}

const AdminVehiculos = () => {
  const { user } = useAuth();
  const [vehiculosTodos, setVehiculosTodos] = useState<Vehiculo[]>([]);
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [vehiculoSeleccionado, setVehiculoSeleccionado] =
    useState<Vehiculo | null>(null);

  // Filtros
  const [filtroSucursal, setFiltroSucursal] = useState<string>("todas");
  const [filtroAgrupacion, setFiltroAgrupacion] = useState<string>("todas");
  const [filtroActivo, setFiltroActivo] = useState<string>("todos");
  const [busqueda, setBusqueda] = useState("");

  // Formulario
  const [formData, setFormData] = useState({
    numero_vehiculo: "",
    placa: "",
    agrupacion: "",
    sucursal_id: user?.sucursal_id || 1,
  });

  // ✅ CARGAR DATOS UNA SOLA VEZ
  useEffect(() => {
    cargarDatosIniciales();
  }, []);

  const cargarDatosIniciales = async () => {
    try {
      setLoading(true);

      // Cargar sucursales (solo admin)
      if (user?.rol_id === 3) {
        const resSucursales = await sucursalesApi.obtenerTodas();
        if (resSucursales.data.success) {
          setSucursales(resSucursales.data.data);
        }
      }

      // Cargar TODOS los vehículos (sin filtros)
      const resVehiculos = await vehiculosApi.obtenerTodos();
      if (resVehiculos.data.success) {
        setVehiculosTodos(resVehiculos.data.data);
      }
    } catch (error) {
      console.error("Error cargando datos:", error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ FILTRADO EN FRONTEND (instantáneo, sin llamadas al backend)
  const vehiculos = useMemo(() => {
    return vehiculosTodos.filter((vehiculo) => {
      // Filtro por sucursal
      if (filtroSucursal !== "todas") {
        if (vehiculo.sucursal_id !== parseInt(filtroSucursal)) return false;
      }

      // Filtro por agrupación
      if (filtroAgrupacion !== "todas") {
        if (vehiculo.agrupacion !== filtroAgrupacion) return false;
      }

      // Filtro por estado (activo/inactivo)
      if (filtroActivo === "activos") {
        if (!vehiculo.activo) return false;
      } else if (filtroActivo === "inactivos") {
        if (vehiculo.activo) return false;
      }

      // Búsqueda por número o placa (instantánea)
      if (busqueda) {
        const busquedaLower = busqueda.toLowerCase();
        const coincideNumero = vehiculo.numero_vehiculo
          .toLowerCase()
          .includes(busquedaLower);
        const coincidePlaca = vehiculo.placa
          .toLowerCase()
          .includes(busquedaLower);
        if (!coincideNumero && !coincidePlaca) return false;
      }

      return true;
    });
  }, [
    vehiculosTodos,
    filtroSucursal,
    filtroAgrupacion,
    filtroActivo,
    busqueda,
  ]);

  // ✅ RECARGAR DESPUÉS DE CREAR/EDITAR/ELIMINAR
  const recargarVehiculos = async () => {
    try {
      const resVehiculos = await vehiculosApi.obtenerTodos();
      if (resVehiculos.data.success) {
        setVehiculosTodos(resVehiculos.data.data);
      }
    } catch (error) {
      console.error("Error recargando vehículos:", error);
    }
  };

  const abrirModalCrear = () => {
    setModoEdicion(false);
    setVehiculoSeleccionado(null);
    setFormData({
      numero_vehiculo: "",
      placa: "",
      agrupacion: "",
      sucursal_id: user?.sucursal_id || 1,
    });
    setModalAbierto(true);
  };

  const abrirModalEditar = (vehiculo: Vehiculo) => {
    setModoEdicion(true);
    setVehiculoSeleccionado(vehiculo);
    setFormData({
      numero_vehiculo: vehiculo.numero_vehiculo,
      placa: vehiculo.placa,
      agrupacion: vehiculo.agrupacion || "",
      sucursal_id: vehiculo.sucursal_id,
    });
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setVehiculoSeleccionado(null);
    setModoEdicion(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (modoEdicion && vehiculoSeleccionado) {
        await vehiculosApi.actualizar(
          vehiculoSeleccionado.vehiculo_id,
          formData
        );
      } else {
        await vehiculosApi.crear(formData);
      }

      cerrarModal();
      recargarVehiculos(); // ✅ CORREGIDO
    } catch (error: any) {
      alert(error.response?.data?.message || "Error al guardar vehículo");
    }
  };

  const handleToggleActivo = async (vehiculo: Vehiculo) => {
    try {
      if (vehiculo.activo) {
        await vehiculosApi.desactivar(vehiculo.vehiculo_id);
      } else {
        await vehiculosApi.activar(vehiculo.vehiculo_id);
      }
      recargarVehiculos(); // ✅ CORREGIDO
    } catch (error: any) {
      alert(error.response?.data?.message || "Error al cambiar estado");
    }
  };

  const handleEliminar = async (vehiculo: Vehiculo) => {
    if (!window.confirm(`¿Eliminar el vehículo ${vehiculo.numero_vehiculo}?`))
      return;

    try {
      await vehiculosApi.eliminar(vehiculo.vehiculo_id);
      recargarVehiculos(); // ✅ CORREGIDO
    } catch (error: any) {
      alert(error.response?.data?.message || "Error al eliminar vehículo");
    }
  };

  // Obtener agrupaciones únicas
  const agrupaciones = Array.from(
    new Set(vehiculos.map((v) => v.agrupacion).filter((a) => a))
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-slate-900">
        <div className="text-center">
          <Icons.refresh className="w-16 h-16 text-blue-600 dark:text-blue-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-slate-400">
            Cargando vehículos...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100 flex items-center gap-3">
            <Icons.truck className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            Administración de Vehículos
          </h1>
          <p className="text-gray-600 dark:text-slate-400 mt-2">
            Gestiona la flota de vehículos
          </p>
        </div>

        {/* Filtros y búsqueda */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* Búsqueda */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                Buscar
              </label>
              <div className="relative">
                <Icons.search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Número o placa..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Filtro Sucursal (solo admin) */}
            {user?.rol_id === 3 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                  Sucursal
                </label>
                <select
                  value={filtroSucursal}
                  onChange={(e) => setFiltroSucursal(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="todas">Todas las sucursales</option>
                  {sucursales.map((s) => (
                    <option key={s.sucursal_id} value={s.sucursal_id}>
                      {s.nombre_sucursal}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Filtro Agrupación */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                Agrupación
              </label>
              <select
                value={filtroAgrupacion}
                onChange={(e) => setFiltroAgrupacion(e.target.value)}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="todas">Todas</option>
                {agrupaciones.map((a) => (
                  <option key={a} value={a!}>
                    {a}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro Estado */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                Estado
              </label>
              <select
                value={filtroActivo}
                onChange={(e) => setFiltroActivo(e.target.value)}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="todos">Todos</option>
                <option value="activos">Activos</option>
                <option value="inactivos">Inactivos</option>
              </select>
            </div>
          </div>

          {/* Botón agregar */}
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600 dark:text-slate-400">
              {vehiculos.length} vehículo(s) encontrado(s)
            </p>
            <button
              onClick={abrirModalCrear}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <Icons.plus className="w-5 h-5" />
              Agregar Vehículo
            </button>
          </div>
        </div>

        {/* Tabla */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-slate-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                    Número
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                    Placa
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                    Agrupación
                  </th>
                  {user?.rol_id === 3 && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                      Sucursal
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                {vehiculos.map((vehiculo) => (
                  <tr
                    key={vehiculo.vehiculo_id}
                    className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Icons.truck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        <span className="font-medium text-gray-900 dark:text-slate-100">
                          {vehiculo.numero_vehiculo}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-slate-100">
                      {vehiculo.placa}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {vehiculo.agrupacion ? (
                        <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                          {vehiculo.agrupacion}
                        </span>
                      ) : (
                        <span className="text-gray-400 dark:text-slate-500">
                          Sin agrupación
                        </span>
                      )}
                    </td>
                    {user?.rol_id === 3 && (
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-slate-400">
                        {vehiculo.sucursales?.nombre_sucursal || "N/A"}
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          vehiculo.activo
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        }`}
                      >
                        {vehiculo.activo ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => abrirModalEditar(vehiculo)}
                          className="p-2 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Icons.edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleToggleActivo(vehiculo)}
                          className={`p-2 rounded-lg transition-colors ${
                            vehiculo.activo
                              ? "text-orange-600 hover:bg-orange-50 dark:text-orange-400 dark:hover:bg-orange-900/30"
                              : "text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/30"
                          }`}
                          title={vehiculo.activo ? "Desactivar" : "Activar"}
                        >
                          {vehiculo.activo ? (
                            <Icons.unlock className="w-5 h-5" />
                          ) : (
                            <Icons.lock className="w-5 h-5" />
                          )}
                        </button>
                        <button
                          onClick={() => handleEliminar(vehiculo)}
                          className="p-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                          title="Eliminar"
                        >
                          <Icons.trash className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {vehiculos.length === 0 && (
            <div className="text-center py-12">
              <Icons.truck className="w-16 h-16 text-gray-400 dark:text-slate-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-slate-400">
                No se encontraron vehículos
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal Crear/Editar */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-gray-200 dark:border-slate-700 w-full max-w-md mx-4">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-6">
                {modoEdicion ? "Editar Vehículo" : "Agregar Vehículo"}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Número de vehículo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                    Número de Vehículo *
                  </label>
                  <input
                    type="text"
                    value={formData.numero_vehiculo}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        numero_vehiculo: e.target.value,
                      })
                    }
                    required
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ej: C-001"
                  />
                </div>

                {/* Placa */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                    Placa *
                  </label>
                  <input
                    type="text"
                    value={formData.placa}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        placa: e.target.value.toUpperCase(),
                      })
                    }
                    required
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
                    placeholder="Ej: PAB1234"
                  />
                </div>

                {/* Agrupación */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                    Agrupación (Opcional)
                  </label>
                  <input
                    type="text"
                    value={formData.agrupacion}
                    onChange={(e) =>
                      setFormData({ ...formData, agrupacion: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ej: Camiones, Pickups"
                  />
                </div>

                {/* Sucursal (solo admin) */}
                {user?.rol_id === 3 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                      Sucursal *
                    </label>
                    <select
                      value={formData.sucursal_id}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          sucursal_id: parseInt(e.target.value),
                        })
                      }
                      required
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {sucursales.map((s) => (
                        <option key={s.sucursal_id} value={s.sucursal_id}>
                          {s.nombre_sucursal}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Botones */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={cerrarModal}
                    className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-900 dark:text-slate-100 rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    {modoEdicion ? "Actualizar" : "Crear"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminVehiculos;
