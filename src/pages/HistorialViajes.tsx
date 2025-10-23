// src/pages/HistorialViajes.tsx
import React, { useState, useEffect } from "react";
import { viajesApi } from "../services/api";
import { useNavigate } from "react-router-dom";

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
  const [estadisticas, setEstadisticas] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    cargarHistorial();
  }, []);

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
      alert("Error al cargar el historial");
    } finally {
      setLoading(false);
    }
  };

  const calcularDuracion = (inicio: string, fin: string) => {
    const duracionMs = new Date(fin).getTime() - new Date(inicio).getTime();
    const horas = Math.floor(duracionMs / (1000 * 60 * 60));
    const minutos = Math.floor((duracionMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${horas}h ${minutos}m`;
  };

  const getEstadoClasses = (porcentaje: number) => {
    if (porcentaje === 100) return "border-l-green-500 bg-green-50";
    if (porcentaje >= 80) return "border-l-yellow-500 bg-yellow-50";
    return "border-l-red-500 bg-red-50";
  };

  const getEstadoBadge = (porcentaje: number) => {
    if (porcentaje === 100)
      return "bg-green-100 text-green-800 border-green-200";
    if (porcentaje >= 80)
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    return "bg-red-100 text-red-800 border-red-200";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando historial...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              📋 Historial de Viajes
            </h1>
            <p className="text-gray-600">
              Viajes completados en las últimas 24 horas de tu sucursal
            </p>
          </div>
          <button
            onClick={cargarHistorial}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all flex items-center gap-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Actualizar
          </button>
        </div>

        {/* Estadísticas rápidas */}
        {estadisticas && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl shadow-md border-2 border-blue-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">🚛</span>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">
                    Total Viajes
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {estadisticas.total_viajes}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-md border-2 border-purple-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">📄</span>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">Facturas</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {estadisticas.total_facturas}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-md border-2 border-indigo-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">📋</span>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">
                    Total Guías
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {estadisticas.total_guias}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-md border-2 border-green-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">✅</span>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">
                    Entregadas
                  </p>
                  <p className="text-2xl font-bold text-green-700">
                    {estadisticas.total_entregadas}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Lista de viajes */}
      {viajes.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-md p-12 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">📭</span>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            No hay viajes completados
          </h3>
          <p className="text-gray-600">
            Los viajes completados en las últimas 24 horas aparecerán aquí
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {viajes.map((viaje) => {
            const estadoClasses = getEstadoClasses(
              viaje.estadisticas.porcentaje_exito
            );
            const badgeClasses = getEstadoBadge(
              viaje.estadisticas.porcentaje_exito
            );

            return (
              <div
                key={viaje.viaje_id}
                className={`bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border-l-[6px] ${estadoClasses}`}
              >
                {/* Header */}
                <div className="p-5 border-b border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xl font-bold text-gray-900">
                      Viaje #{viaje.viaje_id}
                    </h3>
                    <span
                      className={`px-3 py-1 rounded-lg text-sm font-bold border-2 ${badgeClasses}`}
                    >
                      {viaje.estadisticas.porcentaje_exito}% ✅
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span>📅</span>
                    <span>
                      {new Date(viaje.fecha_viaje).toLocaleDateString("es-HN", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                    <span className="mx-2">•</span>
                    <span>⏱️</span>
                    <span>
                      {calcularDuracion(viaje.created_at, viaje.updated_at)}
                    </span>
                  </div>
                </div>

                {/* Body */}
                <div className="p-5">
                  {/* Info principal */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                      <span className="text-xl">👨‍✈️</span>
                      <div>
                        <p className="text-xs text-gray-500 font-semibold">
                          Piloto
                        </p>
                        <p className="text-sm font-bold text-gray-900">
                          {viaje.piloto}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                      <span className="text-xl">🚛</span>
                      <div>
                        <p className="text-xs text-gray-500 font-semibold">
                          Vehículo
                        </p>
                        <p className="text-sm font-bold text-gray-900">
                          {viaje.numero_vehiculo}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Estadísticas */}
                  <div className="grid grid-cols-4 gap-2 mb-4">
                    <div className="text-center p-2 bg-gray-50 rounded-lg">
                      <p className="text-lg font-bold text-gray-900">
                        {viaje.estadisticas.total_facturas}
                      </p>
                      <p className="text-[10px] text-gray-600 uppercase font-semibold">
                        Facturas
                      </p>
                    </div>

                    <div className="text-center p-2 bg-gray-50 rounded-lg">
                      <p className="text-lg font-bold text-gray-900">
                        {viaje.estadisticas.total_guias}
                      </p>
                      <p className="text-[10px] text-gray-600 uppercase font-semibold">
                        Guías
                      </p>
                    </div>

                    <div className="text-center p-2 bg-green-50 rounded-lg">
                      <p className="text-lg font-bold text-green-700">
                        {viaje.estadisticas.guias_entregadas}
                      </p>
                      <p className="text-[10px] text-green-600 uppercase font-semibold">
                        Entregadas
                      </p>
                    </div>

                    <div className="text-center p-2 bg-red-50 rounded-lg">
                      <p className="text-lg font-bold text-red-700">
                        {viaje.estadisticas.guias_no_entregadas}
                      </p>
                      <p className="text-[10px] text-red-600 uppercase font-semibold">
                        No entreg.
                      </p>
                    </div>
                  </div>

                  {/* Botón ver detalles */}
                  <button
                    onClick={() => navigate(`/viaje/${viaje.viaje_id}`)}
                    className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-all"
                  >
                    👁️ Ver Detalles Completos
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default HistorialViajes;
