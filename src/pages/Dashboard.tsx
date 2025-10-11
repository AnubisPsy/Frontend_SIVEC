import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

// Tipos
interface Vehiculo {
  placa: string;
  agrupacion: string;
}

interface Estados {
  codigo: string;
  nombre: string;
}

interface Guia {
  guia_id: number;
  numero_guia: string;
  detalle_producto: string;
  cliente: string;
  direccion: string;
  estado_id: number;
  fecha_entrega: string | null;
  estados: Estados;
}

interface Factura {
  factura_id: number;
  numero_factura: string;
  estado_id: number;
  notas_jefe: string | null;
  guias: Guia[];
}

interface Viaje {
  viaje_id: number;
  numero_vehiculo: string;
  piloto: string;
  timestamp_salida: string | null;
  timestamp_regreso: string | null;
  estado_viaje: string;
  created_at: string;
  vehiculo: Vehiculo;
  facturas: Factura[];
  total_guias: number;
  guias_entregadas: number;
}

const Dashboard = () => {
  const [viajes, setViajes] = useState<Viaje[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    cargarViajes();
  }, []);

  const cargarViajes = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const response = await axios.get<Viaje[]>(
        "http://localhost:3000/api/viajes?estado=activo",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setViajes(response.data);
      setError(null);
    } catch (err) {
      console.error("Error cargando viajes:", err);
      setError("No se pudieron cargar los viajes activos");
    } finally {
      setLoading(false);
    }
  };

  const calcularProgreso = (viaje: Viaje): number => {
    if (viaje.total_guias === 0) return 0;
    return Math.round((viaje.guias_entregadas / viaje.total_guias) * 100);
  };

  const verDetalle = (viajeId: number) => {
    navigate(`/viaje/${viajeId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando viajes activos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Dashboard de Viajes
          </h1>
          <p className="text-gray-600">
            Monitorea el estado de todos los viajes activos en tiempo real
          </p>
        </div>

        {/* Resumen rápido */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Viajes Activos</p>
                <p className="text-3xl font-bold text-blue-600">
                  {viajes.length}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Guías</p>
                <p className="text-3xl font-bold text-purple-600">
                  {viajes.reduce((sum, v) => sum + v.total_guias, 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Guías Entregadas</p>
                <p className="text-3xl font-bold text-green-600">
                  {viajes.reduce((sum, v) => sum + v.guias_entregadas, 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Lista de viajes */}
        {viajes.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <svg
              className="w-16 h-16 text-gray-400 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              No hay viajes activos
            </h3>
            <p className="text-gray-500">
              Cuando se asignen viajes, aparecerán aquí
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {viajes.map((viaje) => (
              <div
                key={viaje.viaje_id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => verDetalle(viaje.viaje_id)}
              >
                {/* Header del viaje */}
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-800 mb-1">
                        {viaje.numero_vehiculo}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {viaje.vehiculo?.placa || "Sin placa"}
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-sm font-semibold rounded-full">
                      {viaje.estado_viaje}
                    </span>
                  </div>

                  <div className="flex items-center text-gray-700 mb-3">
                    <svg
                      className="w-5 h-5 mr-2 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    <span className="font-medium">{viaje.piloto}</span>
                  </div>

                  {/* Barra de progreso */}
                  <div className="mb-2">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">
                        Progreso de entregas
                      </span>
                      <span className="font-semibold text-gray-700">
                        {viaje.guias_entregadas} / {viaje.total_guias}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-2.5 rounded-full transition-all"
                        style={{ width: `${calcularProgreso(viaje)}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {calcularProgreso(viaje)}% completado
                    </p>
                  </div>
                </div>

                {/* Facturas */}
                <div className="p-6">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">
                    Facturas asignadas ({viaje.facturas?.length || 0})
                  </h4>

                  <div className="space-y-3">
                    {viaje.facturas?.slice(0, 3).map((factura) => (
                      <div
                        key={factura.factura_id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                          <div>
                            <p className="font-medium text-gray-800 text-sm">
                              {factura.numero_factura}
                            </p>
                            <p className="text-xs text-gray-500">
                              {factura.guias?.length || 0} guías
                            </p>
                          </div>
                        </div>
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                          {factura.guias?.filter((g) => g.estado_id === 4)
                            .length || 0}{" "}
                          entregadas
                        </span>
                      </div>
                    ))}

                    {viaje.facturas?.length > 3 && (
                      <p className="text-xs text-gray-500 text-center pt-2">
                        + {viaje.facturas.length - 3} facturas más
                      </p>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 rounded-b-lg">
                  <button
                    className="w-full text-center text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      verDetalle(viaje.viaje_id);
                    }}
                  >
                    Ver detalles completos →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
