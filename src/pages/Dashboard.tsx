// src/pages/Dashboard.tsx
import React, { useState, useEffect } from "react";
import { useSocket } from "../contexts/SocketContext";
import { estadisticasApi, sucursalesApi } from "../services/api";
import { Icons } from "../components/icons/IconMap";
import { useAuth } from "../contexts/AuthContext";

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface Metricas {
  viajesActivos: number;
  viajesCompletados: number;
  entregasCompletadas: number;
  entregasPendientes: number;
  tasaExito: number;
  totalGuias: number;
}

interface ComparacionEstado {
  estado: string;
  cantidad: number;
  color: string;
}

interface TendenciaDia {
  fecha: string;
  dia: string;
  entregas: number;
}

interface ViajePorSucursal {
  nombre: string;
  viajes: number;
}

interface TopPiloto {
  piloto: string;
  viajes: number;
  entregas: number;
  total: number;
  tasaExito: number;
}

interface Actividad {
  tipo: string;
  descripcion: string;
  timestamp: string;
  estado: number;
}

const Dashboard = () => {
  const { socket, isConnected } = useSocket();

  const [metricas, setMetricas] = useState<Metricas>({
    viajesActivos: 0,
    viajesCompletados: 0,
    entregasCompletadas: 0,
    entregasPendientes: 0,
    tasaExito: 0,
    totalGuias: 0,
  });

  const [comparacionEstados, setComparacionEstados] = useState<
    ComparacionEstado[]
  >([]);
  const [tendenciaSemanal, setTendenciaSemanal] = useState<TendenciaDia[]>([]);
  const [viajesPorSucursal, setViajesPorSucursal] = useState<
    ViajePorSucursal[]
  >([]);
  const [topPilotos, setTopPilotos] = useState<TopPiloto[]>([]);
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [loading, setLoading] = useState(true);
  const [sucursalSeleccionada, setSucursalSeleccionada] = useState<
    number | "todas"
  >("todas");
  const [sucursalesDisponibles, setSucursalesDisponibles] = useState<any[]>([]);
  const { user } = useAuth();

  // Cargar datos iniciales
  useEffect(() => {
    cargarTodasEstadisticas();
  }, []);

  // Escuchar eventos WebSocket
  useEffect(() => {
    if (!socket) return;

    console.log("👂 Dashboard escuchando eventos WebSocket");

    const recargarEstadisticas = () => {
      console.log("🔄 Evento recibido, recargando estadísticas...");
      cargarTodasEstadisticas();
    };

    socket.on("factura:guia_asignada", recargarEstadisticas);
    socket.on("viaje:estado_actualizado", recargarEstadisticas);
    socket.on("guia:estado_actualizado", recargarEstadisticas);
    socket.on("viaje:progreso_actualizado", recargarEstadisticas);
    socket.on("viaje:completado", recargarEstadisticas);

    return () => {
      socket.off("factura:guia_asignada", recargarEstadisticas);
      socket.off("viaje:estado_actualizado", recargarEstadisticas);
      socket.off("guia:estado_actualizado", recargarEstadisticas);
      socket.off("viaje:progreso_actualizado", recargarEstadisticas);
      socket.off("viaje:completado", recargarEstadisticas);
    };
  }, [socket]);

  useEffect(() => {
    const cargarSucursales = async () => {
      if (user?.rol_id === 3) {
        // Solo admin
        try {
          const response = await sucursalesApi.obtenerTodas();
          if (response.data.success) {
            setSucursalesDisponibles(response.data.data);
          }
        } catch (error) {
          console.error("Error cargando sucursales:", error);
        }
      }
    };
    cargarSucursales();
  }, [user]);

  const cargarTodasEstadisticas = async () => {
    try {
      setLoading(true);

      const hoy = new Date().toISOString().split("T")[0];

      // Cargar todas las estadísticas en paralelo
      const [
        resDashboard,
        resComparacion,
        resTendencia,
        resSucursales,
        resPilotos,
        resActividad,
      ] = await Promise.all([
        estadisticasApi.obtenerDashboard(hoy),
        estadisticasApi.obtenerComparacionEstados(hoy),
        estadisticasApi.obtenerTendenciaSemanal(),
        // ✅ CAMBIO: Pasar sucursal seleccionada
        estadisticasApi.obtenerViajesPorSucursal({
          fecha_desde: hoy,
          fecha_hasta: hoy,
          sucursal_id:
            sucursalSeleccionada === "todas" ? undefined : sucursalSeleccionada,
        }),
        estadisticasApi.obtenerTopPilotos({
          fecha_desde: hoy,
          fecha_hasta: hoy,
        }),
        estadisticasApi.obtenerActividadReciente(10),
      ]);

      setMetricas(resDashboard.data.data);
      setComparacionEstados(resComparacion.data.data);
      setTendenciaSemanal(resTendencia.data.data);
      setViajesPorSucursal(resSucursales.data.data);
      setTopPilotos(resPilotos.data.data);
      setActividades(resActividad.data.data);

      console.log("✅ Estadísticas cargadas");
    } catch (error) {
      console.error("❌ Error cargando estadísticas:", error);
    } finally {
      setLoading(false);
    }
  };

  // Colores para gráficos
  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-slate-900">
        <div className="text-center">
          <Icons.refresh className="w-16 h-16 text-blue-600 dark:text-blue-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-slate-400">
            Cargando estadísticas...
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
            <Icons.barChart className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            Dashboard Analytics
          </h1>
          <p className="text-gray-600 dark:text-slate-400 mt-2">
            Métricas y estadísticas en tiempo real
          </p>
        </div>

        {/* Indicador WebSocket */}
        <div className="mb-6">
          <div
            className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg ${
              isConnected
                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
            }`}
          >
            <div
              className={`w-2 h-2 rounded-full ${
                isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"
              }`}
            ></div>
            <span className="text-sm font-medium">
              {isConnected
                ? "Actualización en tiempo real activa"
                : "Sin conexión en tiempo real"}
            </span>
          </div>
        </div>

        {/* GRID PRINCIPAL - 3 gráficos grandes */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* 1. Comparación de Estados (Barras) */}
          <div className="lg:col-span-1 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100 mb-4 flex items-center gap-2">
              <Icons.barChart className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Estados de Entregas
            </h2>
            <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">
              Hoy
            </p>
            {comparacionEstados.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={comparacionEstados}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="estado" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      border: "1px solid #334155",
                      borderRadius: "8px",
                      color: "#e2e8f0",
                    }}
                  />
                  <Bar dataKey="cantidad" radius={[8, 8, 0, 0]}>
                    {comparacionEstados.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-500 dark:text-slate-400 text-center py-8">
                Sin datos de entregas
              </p>
            )}
          </div>

          {/* 2. Tendencia Últimos 7 Días (Línea) */}
          <div className="lg:col-span-1 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100 mb-4 flex items-center gap-2">
              <Icons.activity className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              Tendencia Semanal
            </h2>
            <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">
              Entregas de últimos 7 días
            </p>
            {tendenciaSemanal.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={tendenciaSemanal}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="dia" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      border: "1px solid #334155",
                      borderRadius: "8px",
                      color: "#e2e8f0",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="entregas"
                    stroke="#8b5cf6"
                    strokeWidth={3}
                    dot={{ fill: "#8b5cf6", r: 5 }}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-500 dark:text-slate-400 text-center py-8">
                Sin datos de tendencia
              </p>
            )}
          </div>

          {/* 3. Tasa de Éxito (Circular) */}
          <div className="lg:col-span-1 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100 mb-4 flex items-center gap-2">
              <Icons.target className="w-5 h-5 text-green-600 dark:text-green-400" />
              Tasa de Éxito
            </h2>
            <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">
              Hoy
            </p>
            <div className="flex flex-col items-center justify-center py-4">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={[
                      { name: "Exitosas", value: metricas.tasaExito },
                      { name: "Fallidas", value: 100 - metricas.tasaExito },
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    startAngle={90}
                    endAngle={-270}
                    dataKey="value"
                  >
                    <Cell fill="#10b981" />
                    <Cell fill="#e5e7eb" />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="text-center mt-4">
                <p className="text-5xl font-bold text-green-600 dark:text-green-400">
                  {metricas.tasaExito}%
                </p>
                <p className="text-sm text-gray-500 dark:text-slate-400 mt-2">
                  {metricas.entregasCompletadas} de {metricas.totalGuias}{" "}
                  entregas
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* GRID SECUNDARIO - Viajes por sucursal */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Viajes por Sucursal */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100 flex items-center gap-2">
                <Icons.mapPin className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                Viajes por Sucursal
              </h2>

              {/* ✅ SELECTOR DE SUCURSAL (solo admins) */}
              {user?.rol_id === 3 && sucursalesDisponibles.length > 0 && (
                <select
                  value={sucursalSeleccionada}
                  onChange={(e) =>
                    setSucursalSeleccionada(
                      e.target.value === "todas"
                        ? "todas"
                        : parseInt(e.target.value)
                    )
                  }
                  className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-slate-700 text-gray-900 dark:text-slate-100 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="todas">Todas las sucursales</option>
                  {sucursalesDisponibles.map((sucursal) => (
                    <option
                      key={sucursal.sucursal_id}
                      value={sucursal.sucursal_id}
                    >
                      {sucursal.nombre_sucursal}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {viajesPorSucursal.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={viajesPorSucursal}
                    dataKey="viajes"
                    nameKey="nombre"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label
                  >
                    {viajesPorSucursal.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      border: "1px solid #334155",
                      borderRadius: "8px",
                      color: "#e2e8f0",
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-500 dark:text-slate-400 text-center py-8">
                {user?.rol_id === 3
                  ? "Sin datos para la sucursal seleccionada"
                  : "Solo administradores pueden ver esta métrica"}
              </p>
            )}
          </div>

          {/* Top 5 Pilotos */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100 mb-4 flex items-center gap-2">
              <Icons.user className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Top 5 Pilotos
            </h2>
            {topPilotos.length > 0 ? (
              <div className="space-y-3">
                {topPilotos.map((piloto, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg transition-all hover:bg-gray-100 dark:hover:bg-slate-700"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-slate-100">
                          {piloto.piloto}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-slate-400">
                          {piloto.viajes} viajes • {piloto.entregas}/
                          {piloto.total} entregas
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-600 dark:text-green-400">
                        {piloto.tasaExito}%
                      </p>
                      <p className="text-xs text-gray-500 dark:text-slate-400">
                        éxito
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-slate-400 text-center py-8">
                Sin datos de pilotos
              </p>
            )}
          </div>
        </div>

        {/* Actividad Reciente - MÁS COMPACTA */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100 mb-4 flex items-center gap-2">
            <Icons.clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            Actividad Reciente
          </h2>
          {actividades.length > 0 ? (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {" "}
              {/* ← CAMBIO: space-y-2 y max-h-64 */}
              {actividades.map((actividad, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-slate-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <div
                    className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      actividad.estado === 4
                        ? "bg-green-500"
                        : actividad.estado === 5
                        ? "bg-red-500"
                        : "bg-blue-500"
                    }`}
                  ></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 dark:text-slate-100 truncate">
                      {actividad.descripcion}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-slate-400">
                      {new Date(actividad.timestamp).toLocaleString("es-HN", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-slate-400 text-center py-8">
              Sin actividad reciente
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
