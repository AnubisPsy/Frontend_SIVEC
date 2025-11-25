// src/pages/HistorialViajes.tsx
import React, { useState, useEffect } from "react";
import { viajesApi } from "../services/api";
import { useNavigate } from "react-router-dom";
import { Icons } from "../components/icons/IconMap";
import { useNotification } from "../hooks/useNotification";

interface Viaje {
  viaje_id: number;
  numero_vehiculo: string;
  piloto: string;
  fecha_viaje: string;
  created_at: string;
  updated_at: string;
  facturas: any[];
  guias: any[];
  estadisticas: {
    total_facturas: number;
    total_guias: number;
    guias_entregadas: number;
    guias_no_entregadas: number;
    porcentaje_exito: number;
  };
}

const HistorialViajes = () => {
  const [viajes, setViajes] = useState<Viaje[]>([]);
  const [viajesFiltrados, setViajesFiltrados] = useState<Viaje[]>([]);
  const [estadisticas, setEstadisticas] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Estados de búsqueda y filtros
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<
    "todos" | "exitosos" | "parciales" | "fallidos"
  >("todos");
  const [ordenamiento, setOrdenamiento] = useState<
    "reciente" | "antiguo" | "exito_desc" | "exito_asc"
  >("reciente");

  const navigate = useNavigate();
  const noti = useNotification();

  useEffect(() => {
    cargarHistorial();
  }, []);

  useEffect(() => {
    aplicarFiltros();
  }, [viajes, busqueda, filtroEstado, ordenamiento]);

  const cargarHistorial = async () => {
    setLoading(true);
    try {
      const response = await viajesApi.obtenerRecientes();

      if (response.data.success) {
        setViajes(response.data.data);
        setEstadisticas(response.data.estadisticas);
        console.log(
          "✅ Historial cargado:",
          response.data.data.length,
          "viajes"
        );
      }
    } catch (error: any) {
      console.error("❌ Error cargando historial:", error);
      noti.error({ message: "Error al cargar el historial de viajes." });
    } finally {
      setLoading(false);
    }
  };

  const aplicarFiltros = () => {
    let resultado = [...viajes];

    // Filtro de búsqueda
    if (busqueda) {
      resultado = resultado.filter(
        (viaje) =>
          viaje.piloto.toLowerCase().includes(busqueda.toLowerCase()) ||
          viaje.numero_vehiculo
            .toLowerCase()
            .includes(busqueda.toLowerCase()) ||
          viaje.viaje_id.toString().includes(busqueda)
      );
    }

    // Filtro por estado de éxito
    if (filtroEstado !== "todos") {
      resultado = resultado.filter((viaje) => {
        const porcentaje = viaje.estadisticas.porcentaje_exito;
        if (filtroEstado === "exitosos") return porcentaje === 100;
        if (filtroEstado === "parciales")
          return porcentaje >= 80 && porcentaje < 100;
        if (filtroEstado === "fallidos") return porcentaje < 80;
        return true;
      });
    }

    // Ordenamiento
    resultado.sort((a, b) => {
      switch (ordenamiento) {
        case "reciente":
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        case "antiguo":
          return (
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
        case "exito_desc":
          return (
            b.estadisticas.porcentaje_exito - a.estadisticas.porcentaje_exito
          );
        case "exito_asc":
          return (
            a.estadisticas.porcentaje_exito - b.estadisticas.porcentaje_exito
          );
        default:
          return 0;
      }
    });

    setViajesFiltrados(resultado);
  };

  const limpiarFiltros = () => {
    setBusqueda("");
    setFiltroEstado("todos");
    setOrdenamiento("reciente");
  };

  const calcularDuracion = (inicio: string, fin: string) => {
    const duracionMs = new Date(fin).getTime() - new Date(inicio).getTime();
    const horas = Math.floor(duracionMs / (1000 * 60 * 60));
    const minutos = Math.floor((duracionMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${horas}h ${minutos}m`;
  };

  const getEstadoClasses = (porcentaje: number) => {
    if (porcentaje === 100)
      return "border-l-green-500 bg-green-50 dark:bg-green-900/20 dark:border-l-green-600";
    if (porcentaje >= 80)
      return "border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 dark:border-l-yellow-600";
    return "border-l-red-500 bg-red-50 dark:bg-red-900/20 dark:border-l-red-600";
  };

  const getEstadoBadge = (porcentaje: number) => {
    if (porcentaje === 100)
      return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800";
    if (porcentaje >= 80)
      return "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800";
    return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-slate-900">
        <div className="text-center">
          <Icons.refresh className="w-16 h-16 text-blue-600 dark:text-blue-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-slate-400">
            Cargando historial...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                <Icons.clock className="w-7 h-7 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100">
                  Historial de Viajes
                </h1>
                <p className="text-gray-600 dark:text-slate-400">
                  Viajes completados en las últimas 24 horas de tu sucursal
                </p>
              </div>
            </div>
            <button
              onClick={cargarHistorial}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-lg font-semibold transition-all flex items-center gap-2"
            >
              <Icons.refresh className="w-5 h-5" />
              Actualizar
            </button>
          </div>

          {/* Estadísticas rápidas */}
          {estadisticas && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-md border-2 border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                    <Icons.truck className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-slate-400 font-medium">
                      Total Viajes
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-slate-100">
                      {estadisticas.total_viajes}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-md border-2 border-purple-200 dark:border-purple-800">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                    <Icons.document className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-slate-400 font-medium">
                      Facturas
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-slate-100">
                      {estadisticas.total_facturas}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-md border-2 border-indigo-200 dark:border-indigo-800">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
                    <Icons.package className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-slate-400 font-medium">
                      Total Guías
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-slate-100">
                      {estadisticas.total_guias}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-md border-2 border-green-200 dark:border-green-800">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                    <Icons.checkCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-slate-400 font-medium">
                      Entregadas
                    </p>
                    <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                      {estadisticas.total_entregadas}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Barra de búsqueda y filtros */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md border border-gray-200 dark:border-slate-700 p-4">
            <div className="flex items-center gap-3 mb-4">
              <Icons.search className="w-5 h-5 text-gray-400 dark:text-slate-500" />
              <h3 className="font-semibold text-gray-700 dark:text-slate-300">
                Búsqueda y Filtros
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Búsqueda */}
              <div className="md:col-span-2 relative">
                <Icons.search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-slate-500" />
                <input
                  type="text"
                  placeholder="Buscar por piloto, vehículo o ID de viaje..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
                />
              </div>

              {/* Filtro por Estado */}
              <div>
                <select
                  value={filtroEstado}
                  onChange={(e) => setFiltroEstado(e.target.value as any)}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
                >
                  <option value="todos">Todos los estados</option>
                  <option value="exitosos">Exitosos (100%)</option>
                  <option value="parciales">Parciales (80-99%)</option>
                  <option value="fallidos">Fallidos (&lt;80%)</option>
                </select>
              </div>

              {/* Ordenamiento */}
              <div>
                <select
                  value={ordenamiento}
                  onChange={(e) => setOrdenamiento(e.target.value as any)}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
                >
                  <option value="reciente">Más recientes</option>
                  <option value="antiguo">Más antiguos</option>
                  <option value="exito_desc">Mayor éxito</option>
                  <option value="exito_asc">Menor éxito</option>
                </select>
              </div>
            </div>

            {/* Indicador de filtros activos */}
            {(busqueda ||
              filtroEstado !== "todos" ||
              ordenamiento !== "reciente") && (
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-slate-400">
                  <span className="font-medium">
                    {viajesFiltrados.length} resultado
                    {viajesFiltrados.length !== 1 ? "s" : ""} encontrado
                    {viajesFiltrados.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <button
                  onClick={limpiarFiltros}
                  className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                >
                  Limpiar filtros
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Lista de viajes */}
        {viajesFiltrados.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-md border border-gray-200 dark:border-slate-700 p-12 text-center">
            <div className="w-20 h-20 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icons.package className="w-10 h-10 text-gray-400 dark:text-slate-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-2">
              {viajes.length === 0
                ? "No hay viajes completados"
                : "No se encontraron resultados"}
            </h3>
            <p className="text-gray-600 dark:text-slate-400">
              {viajes.length === 0
                ? "Los viajes completados en las últimas 24 horas aparecerán aquí"
                : "Intenta ajustar los filtros de búsqueda"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {viajesFiltrados.map((viaje) => {
              const estadoClasses = getEstadoClasses(
                viaje.estadisticas.porcentaje_exito
              );
              const badgeClasses = getEstadoBadge(
                viaje.estadisticas.porcentaje_exito
              );

              return (
                <div
                  key={viaje.viaje_id}
                  className={`bg-white dark:bg-slate-800 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border-l-[6px] ${estadoClasses}`}
                >
                  {/* Header */}
                  <div className="p-5 border-b border-gray-200 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2">
                        <Icons.truck className="w-5 h-5" />
                        Viaje #{viaje.viaje_id}
                      </h3>
                      <span
                        className={`px-3 py-1 rounded-lg text-sm font-bold border-2 inline-flex items-center gap-1 ${badgeClasses}`}
                      >
                        {viaje.estadisticas.porcentaje_exito}%
                        <Icons.checkCircle className="w-4 h-4" />
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-slate-400">
                      <Icons.calendar className="w-4 h-4" />
                      <span>
                        {new Date(viaje.fecha_viaje).toLocaleDateString(
                          "es-HN",
                          {
                            weekday: "short",
                            day: "numeric",
                            month: "short",
                          }
                        )}
                      </span>
                      <span className="mx-2">•</span>
                      <Icons.clock className="w-4 h-4" />
                      <span>
                        {calcularDuracion(viaje.created_at, viaje.updated_at)}
                      </span>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-5">
                    {/* Info principal */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                        <Icons.user className="w-5 h-5 text-gray-500 dark:text-slate-400" />
                        <div>
                          <p className="text-xs text-gray-500 dark:text-slate-400 font-semibold">
                            Piloto
                          </p>
                          <p className="text-sm font-bold text-gray-900 dark:text-slate-100">
                            {viaje.piloto}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                        <Icons.truck className="w-5 h-5 text-gray-500 dark:text-slate-400" />
                        <div>
                          <p className="text-xs text-gray-500 dark:text-slate-400 font-semibold">
                            Vehículo
                          </p>
                          <p className="text-sm font-bold text-gray-900 dark:text-slate-100">
                            {viaje.numero_vehiculo}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Estadísticas */}
                    <div className="grid grid-cols-4 gap-2 mb-4">
                      <div className="text-center p-2 bg-gray-50 dark:bg-slate-700 rounded-lg">
                        <p className="text-lg font-bold text-gray-900 dark:text-slate-100">
                          {viaje.estadisticas.total_facturas}
                        </p>
                        <p className="text-[10px] text-gray-600 dark:text-slate-400 uppercase font-semibold">
                          Facturas
                        </p>
                      </div>

                      <div className="text-center p-2 bg-gray-50 dark:bg-slate-700 rounded-lg">
                        <p className="text-lg font-bold text-gray-900 dark:text-slate-100">
                          {viaje.estadisticas.total_guias}
                        </p>
                        <p className="text-[10px] text-gray-600 dark:text-slate-400 uppercase font-semibold">
                          Guías
                        </p>
                      </div>

                      <div className="text-center p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <p className="text-lg font-bold text-green-700 dark:text-green-400">
                          {viaje.estadisticas.guias_entregadas}
                        </p>
                        <p className="text-[10px] text-green-600 dark:text-green-400 uppercase font-semibold">
                          Entregadas
                        </p>
                      </div>

                      <div className="text-center p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                        <p className="text-lg font-bold text-red-700 dark:text-red-400">
                          {viaje.estadisticas.guias_no_entregadas}
                        </p>
                        <p className="text-[10px] text-red-600 dark:text-red-400 uppercase font-semibold">
                          No entreg.
                        </p>
                      </div>
                    </div>

                    {/* Botón ver detalles */}
                    <button
                      onClick={() => navigate(`/viaje/${viaje.viaje_id}`)}
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2"
                    >
                      <Icons.eye className="w-4 h-4" />
                      Ver Detalles Completos
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default HistorialViajes;
