// src/pages/AdminVehiculos.tsx
import React, { useState, useEffect, useMemo } from "react";
import { vehiculosApi, sucursalesApi } from "../services/api";
import { Icons } from "../components/icons/IconMap";
import { useAuth } from "../contexts/AuthContext";
import { useConfirm } from "../hooks/useConfirm";
import { ConfirmDialog } from "../hooks/ConfirmDialog";
import { useNotification } from "../hooks/useNotification";

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

  const { confirm, isOpen, options, handleConfirm, handleCancel } =
    useConfirm();
  const noti = useNotification();

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
      noti.error({
        title: "Error",
        message: "No se pudieron cargar los datos iniciales",
      });
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
        // ✅ VALIDAR si está cambiando de sucursal
        const cambiandoSucursal =
          formData.sucursal_id !== vehiculoSeleccionado.sucursal_id;

        if (cambiandoSucursal) {
          // Verificar si tiene viajes activos (estados 7 y 8)
          const token = localStorage.getItem("sivec_token");
          const response = await fetch(
            `http://localhost:3000/api/viajes?numero_vehiculo=${vehiculoSeleccionado.numero_vehiculo}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          const dataViajes = await response.json();

          if (dataViajes.success) {
            // Filtrar solo viajes activos (estado 7 = Pendiente, 8 = En Proceso)
            const viajesActivos = dataViajes.data.filter(
              (v: any) => v.estado_viaje === 7 || v.estado_viaje === 8
            );

            if (viajesActivos.length > 0) {
              noti.error({
                title: "No se puede cambiar de sucursal",
                message: `El vehículo ${vehiculoSeleccionado.numero_vehiculo} tiene ${viajesActivos.length} viaje(s) activo(s). Complete o cancele los viajes antes de cambiar de sucursal.`,
              });
              return; // Detener la actualización
            }
          }
        }

        // Si no hay viajes activos o no está cambiando sucursal, continuar
        await vehiculosApi.actualizar(
          vehiculoSeleccionado.vehiculo_id,
          formData
        );
        noti.success({
          title: "Vehículo actualizado",
          message: "El vehículo se actualizó correctamente",
        });
      } else {
        await vehiculosApi.crear(formData);
        noti.success({
          title: "Vehículo creado",
          message: "El vehículo se creó correctamente",
        });
      }

      cerrarModal();
      recargarVehiculos();
    } catch (error: any) {
      noti.error({
        title: "Error",
        message: error.response?.data?.message || "Error al guardar vehículo",
      });
    }
  };

  const handleToggleActivo = async (vehiculo: Vehiculo) => {
    const confirmed = await confirm({
      title: vehiculo.activo ? "¿Desactivar vehículo?" : "¿Activar vehículo?",
      message: vehiculo.activo
        ? `¿Estás seguro de que deseas desactivar el vehículo "${vehiculo.numero_vehiculo}"?`
        : `¿Estás seguro de que deseas activar el vehículo "${vehiculo.numero_vehiculo}"?`,
      confirmText: vehiculo.activo ? "Sí, desactivar" : "Sí, activar",
      cancelText: "Cancelar",
      variant: vehiculo.activo ? "danger" : "warning",
    });

    if (!confirmed) return;

    try {
      if (vehiculo.activo) {
        await vehiculosApi.desactivar(vehiculo.vehiculo_id);
      } else {
        await vehiculosApi.activar(vehiculo.vehiculo_id);
      }

      noti.success({
        title: vehiculo.activo ? "Vehículo desactivado" : "Vehículo activado",
        message: `El vehículo ${vehiculo.numero_vehiculo} fue ${
          vehiculo.activo ? "desactivado" : "activado"
        } correctamente`,
      });

      recargarVehiculos();
    } catch (error: any) {
      noti.error({
        title: "Error",
        message: error.response?.data?.message || "Error al cambiar estado",
      });
    }
  };

  const handleEliminar = async (vehiculo: Vehiculo) => {
    const confirmed = await confirm({
      title: "¿Eliminar vehículo?",
      message: `¿Estás seguro de que deseas eliminar el vehículo "${vehiculo.numero_vehiculo}"? Esta acción no se puede deshacer.`,
      confirmText: "Sí, eliminar",
      cancelText: "Cancelar",
      variant: "danger",
    });

    if (!confirmed) return;

    try {
      await vehiculosApi.eliminar(vehiculo.vehiculo_id);

      noti.success({
        title: "Vehículo eliminado",
        message: `El vehículo ${vehiculo.numero_vehiculo} fue eliminado correctamente`,
      });

      recargarVehiculos();
    } catch (error: any) {
      noti.error({
        title: "Error",
        message: error.response?.data?.message || "Error al eliminar vehículo",
      });
    }
  };

  // Obtener agrupaciones únicas para el filtro
  const agrupaciones = useMemo(() => {
    const agrupacionesSet = new Set(
      vehiculosTodos
        .map((v) => v.agrupacion)
        .filter((a): a is string => a !== null && a !== "")
    );
    return Array.from(agrupacionesSet).sort();
  }, [vehiculosTodos]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Icons.refresh className="w-12 h-12 text-madeyso-primary dark:text-madeyso-primary-light animate-spin mx-auto" />
          <p className="mt-4 text-gray-600 dark:text-slate-400">
            Cargando vehículos...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => window.history.back()}
                className="text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-100 transition-colors flex items-center gap-2"
              >
                <Icons.chevronLeft className="w-5 h-5" />
                Volver
              </button>
              <div className="w-px h-6 bg-gray-300 dark:bg-slate-600"></div>
              <Icons.truck className="w-6 h-6 text-madeyso-primary dark:text-madeyso-primary-light" />
              <h1 className="text-xl font-semibold text-gray-900 dark:text-slate-100">
                Administrar Vehículos
              </h1>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 rounded-lg font-semibold">
                {vehiculos.filter((v) => v.activo).length} activos
              </span>
              <span className="text-gray-500 dark:text-slate-400">de</span>
              <span className="px-3 py-1 bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-slate-300 rounded-lg font-semibold">
                {vehiculos.length} total
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Botón crear */}
        <div className="mb-6">
          <button
            onClick={abrirModalCrear}
            className="px-6 py-3 bg-madeyso-primary-dark hover:bg-madeyso-green-700 dark:bg-madeyso-primary-dark dark:hover:bg-madeyso-green-700 text-white rounded-lg font-semibold transition-all flex items-center gap-2"
          >
            <Icons.plus className="w-5 h-5" />
            Agregar Vehículo
          </button>
        </div>

        <ConfirmDialog
          isOpen={isOpen}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
          {...options}
        />

        {/* Filtros */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md border border-gray-200 dark:border-slate-700 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Búsqueda */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                Buscar
              </label>
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Número o placa..."
                className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-madeyso-primary"
              />
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
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-madeyso-primary"
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
                className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-madeyso-primary"
              >
                <option value="todas">Todas las agrupaciones</option>
                {agrupaciones.map((a) => (
                  <option key={a} value={a}>
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
                className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-madeyso-primary"
              >
                <option value="todos">Todos</option>
                <option value="activos">Activos</option>
                <option value="inactivos">Inactivos</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tabla */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md border border-gray-200 dark:border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
              <thead className="bg-gray-50 dark:bg-slate-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">
                    Número
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">
                    Placa
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">
                    Agrupación
                  </th>
                  {user?.rol_id === 3 && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">
                      Sucursal
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                {vehiculos.map((vehiculo) => (
                  <tr
                    key={vehiculo.vehiculo_id}
                    className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Icons.truck className="w-5 h-5 text-madeyso-primary dark:text-madeyso-primary-light" />
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
                          className="p-2 text-madeyso-primary hover:bg-madeyso-green-50 dark:text-madeyso-primary-light dark:hover:bg-blue-900/30 rounded-lg transition-colors"
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
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-madeyso-primary"
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
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-madeyso-primary uppercase"
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
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-madeyso-primary"
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
                        className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-madeyso-primary"
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
                      className="flex-1 px-4 py-2 bg-madeyso-primary-dark hover:bg-madeyso-green-700 text-white rounded-lg transition-colors"
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
    </div>
  );
};

export default AdminVehiculos;
