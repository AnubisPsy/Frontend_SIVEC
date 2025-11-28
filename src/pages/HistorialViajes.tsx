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

  const getEstadoBadge = (porcentaje: number) => {
    if (porcentaje === 100)
      return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800";
    if (porcentaje >= 80)
      return "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800";
    return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800";
  };

  const calcularPorcentajes = (viaje: Viaje) => {
    const totalGuias = viaje.estadisticas.total_guias;
    if (totalGuias === 0)
      return { entregadas: 0, noEntregadas: 0, pendientes: 0 };

    const entregadas = Math.round(
      (viaje.estadisticas.guias_entregadas / totalGuias) * 100
    );
    const noEntregadas = Math.round(
      (viaje.estadisticas.guias_no_entregadas / totalGuias) * 100
    );
    const pendientes = 100 - entregadas - noEntregadas;

    return { entregadas, noEntregadas, pendientes };
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
              <Icons.refresh className="w-4 h-4" />
              Actualizar
            </button>
          </div>

          {/* Estadísticas generales */}
          {estadisticas && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-slate-400 font-semibold">
                      Total Viajes
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-slate-100">
                      {estadisticas.total_viajes}
                    </p>
                  </div>
                  <Icons.truck className="w-8 h-8 text-blue-500 dark:text-blue-400" />
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-slate-400 font-semibold">
                      Total Facturas
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-slate-100">
                      {estadisticas.total_facturas}
                    </p>
                  </div>
                  <Icons.document className="w-8 h-8 text-purple-500 dark:text-purple-400" />
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-slate-400 font-semibold">
                      Total Guías
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-slate-100">
                      {estadisticas.total_guias}
                    </p>
                  </div>
                  <Icons.package className="w-8 h-8 text-orange-500 dark:text-orange-400" />
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-slate-400 font-semibold">
                      Entregadas
                    </p>
                    <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                      {estadisticas.total_entregadas}
                    </p>
                  </div>
                  <Icons.checkCircle className="w-8 h-8 text-green-500 dark:text-green-400" />
                </div>
              </div>
            </div>
          )}

          {/* Filtros */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-200 dark:border-slate-700">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Búsqueda */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">
                  Buscar
                </label>
                <div className="relative">
                  <Icons.search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-slate-500" />
                  <input
                    type="text"
                    placeholder="Piloto, vehículo o #viaje..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
                  />
                </div>
              </div>

              {/* Filtro por estado */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">
                  Estado
                </label>
                <select
                  value={filtroEstado}
                  onChange={(e) => setFiltroEstado(e.target.value as any)}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
                >
                  <option value="todos">Todos</option>
                  <option value="exitosos">Exitosos (100%)</option>
                  <option value="parciales">Parciales (≥80%)</option>
                  <option value="fallidos">Fallidos (&lt;80%)</option>
                </select>
              </div>

              {/* Ordenamiento */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">
                  Ordenar por
                </label>
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

        {/* Tabla de viajes */}
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
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-slate-700 border-b border-gray-200 dark:border-slate-600">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-slate-300 uppercase tracking-wider">
                      Viaje
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-slate-300 uppercase tracking-wider">
                      Piloto / Vehículo
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-slate-300 uppercase tracking-wider">
                      Fecha / Duración
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 dark:text-slate-300 uppercase tracking-wider">
                      Facturas
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 dark:text-slate-300 uppercase tracking-wider">
                      Guías
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-slate-300 uppercase tracking-wider">
                      Progreso
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 dark:text-slate-300 uppercase tracking-wider">
                      Éxito
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 dark:text-slate-300 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                  {viajesFiltrados.map((viaje) => {
                    const badgeClasses = getEstadoBadge(
                      viaje.estadisticas.porcentaje_exito
                    );
                    const porcentajes = calcularPorcentajes(viaje);

                    return (
                      <tr
                        key={viaje.viaje_id}
                        className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
                      >
                        {/* Viaje ID */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Icons.truck className="w-5 h-5 text-gray-400 dark:text-slate-500" />
                            <span className="text-sm font-bold text-gray-900 dark:text-slate-100">
                              #{viaje.viaje_id}
                            </span>
                          </div>
                        </td>

                        {/* Piloto / Vehículo */}
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <Icons.user className="w-4 h-4 text-gray-400 dark:text-slate-500" />
                              <span className="text-sm font-medium text-gray-900 dark:text-slate-100">
                                {viaje.piloto}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Icons.truck className="w-4 h-4 text-gray-400 dark:text-slate-500" />
                              <span className="text-sm text-gray-600 dark:text-slate-400">
                                {viaje.numero_vehiculo}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Fecha / Duración */}
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <Icons.calendar className="w-4 h-4 text-gray-400 dark:text-slate-500" />
                              <span className="text-sm text-gray-900 dark:text-slate-100">
                                {new Date(viaje.fecha_viaje).toLocaleDateString(
                                  "es-HN",
                                  {
                                    day: "numeric",
                                    month: "short",
                                  }
                                )}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Icons.clock className="w-4 h-4 text-gray-400 dark:text-slate-500" />
                              <span className="text-sm text-gray-600 dark:text-slate-400">
                                {calcularDuracion(
                                  viaje.created_at,
                                  viaje.updated_at
                                )}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Facturas */}
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 font-bold text-sm">
                            {viaje.estadisticas.total_facturas}
                          </span>
                        </td>

                        {/* Guías */}
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-bold text-sm">
                            {viaje.estadisticas.total_guias}
                          </span>
                        </td>

                        {/* Barra tricolor */}
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-2 min-w-[200px]">
                            {/* Contador E / NE de T */}
                            <div className="text-xs text-gray-600 dark:text-slate-400 font-medium">
                              {viaje.estadisticas.guias_entregadas} /{" "}
                              {viaje.estadisticas.guias_no_entregadas} de{" "}
                              {viaje.estadisticas.total_guias}
                            </div>

                            {/* Barra tricolor */}
                            <div className="flex h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                              {/* Verde - Entregadas */}
                              <div
                                style={{ width: `${porcentajes.entregadas}%` }}
                                className="bg-green-500 dark:bg-green-600"
                                title={`${porcentajes.entregadas}% entregadas`}
                              />
                              {/* Rojo - No entregadas */}
                              <div
                                style={{
                                  width: `${porcentajes.noEntregadas}%`,
                                }}
                                className="bg-red-500 dark:bg-red-600"
                                title={`${porcentajes.noEntregadas}% no entregadas`}
                              />
                              {/* Gris - Pendientes */}
                              <div
                                style={{ width: `${porcentajes.pendientes}%` }}
                                className="bg-gray-300 dark:bg-slate-600"
                                title={`${porcentajes.pendientes}% pendientes`}
                              />
                            </div>

                            {/* Leyendas mini */}
                            <div className="flex items-center gap-3 text-xs">
                              <div className="flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full bg-green-500" />
                                <span className="text-gray-600 dark:text-slate-400">
                                  {porcentajes.entregadas}%
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full bg-red-500" />
                                <span className="text-gray-600 dark:text-slate-400">
                                  {porcentajes.noEntregadas}%
                                </span>
                              </div>
                              {porcentajes.pendientes > 0 && (
                                <div className="flex items-center gap-1">
                                  <div className="w-2 h-2 rounded-full bg-gray-300 dark:bg-slate-600" />
                                  <span className="text-gray-600 dark:text-slate-400">
                                    {porcentajes.pendientes}%
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Badge éxito */}
                        <td className="px-6 py-4 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold border-2 ${badgeClasses}`}
                          >
                            {viaje.estadisticas.porcentaje_exito}%
                            <Icons.checkCircle className="w-3 h-3" />
                          </span>
                        </td>

                        {/* Acciones */}
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => navigate(`/viaje/${viaje.viaje_id}`)}
                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-all"
                          >
                            <Icons.eye className="w-3 h-3" />
                            Ver
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HistorialViajes;
