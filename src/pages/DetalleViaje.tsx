import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import MapaWialon from "../components/MapaWialon";

// Tipos (los mismos del Dashboard)
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
  created_at: string;
  vehiculo: Vehiculo;
  facturas: Factura[];
  total_guias: number;
  guias_entregadas: number;
}

const DetalleViaje = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [viaje, setViaje] = useState<Viaje | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [facturaExpandida, setFacturaExpandida] = useState<number | null>(null);

  useEffect(() => {
    cargarViaje();
  }, [id]);

  const cargarViaje = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("sivec_token");

      const response = await axios.get(
        `http://localhost:3000/api/viajes/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log("📦 Response completo:", response.data); // ← Ver estructura

      // ✅ CORRECCIÓN: Acceder a response.data.data
      const viajeData = response.data.data || response.data;

      console.log("📊 Viaje data:", viajeData);
      console.log("🚛 Total guías:", viajeData.total_guias);
      console.log("✅ Guías entregadas:", viajeData.guias_entregadas);

      setViaje(viajeData);
      setError(null);
    } catch (err) {
      console.error("❌ Error cargando viaje:", err);
      setError("No se pudo cargar el detalle del viaje");
    } finally {
      setLoading(false);
    }
  };

  const toggleFactura = (facturaId: number) => {
    setFacturaExpandida(facturaExpandida === facturaId ? null : facturaId);
  };

  const getEstadoColor = (estadoCodigo: string) => {
    switch (estadoCodigo) {
      case "guia_asignada":
        return "bg-blue-100 text-blue-700";
      case "guia_entregada":
        return "bg-green-100 text-green-700";
      case "guia_no_entregada":
        return "bg-red-100 text-red-700";
      case "guia_pendiente":
        return "bg-yellow-100 text-yellow-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando detalle del viaje...</p>
        </div>
      </div>
    );
  }

  if (error || !viaje) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={() => navigate("/dashboard")}
            className="mb-4 flex items-center text-blue-600 hover:text-blue-700"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Volver al Dashboard
          </button>
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        </div>
      </div>
    );
  }

  const progreso =
    viaje.total_guias > 0
      ? Math.round((viaje.guias_entregadas / viaje.total_guias) * 100)
      : 0;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Botón volver */}
        <button
          onClick={() => navigate("/dashboard")}
          className="mb-6 flex items-center text-blue-600 hover:text-blue-700 font-semibold transition"
        >
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Volver al Dashboard
        </button>

        {/* Header del viaje */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                Viaje {viaje.numero_vehiculo}
              </h1>
              <p className="text-gray-600">
                {viaje.vehiculo?.agrupacion || "Sin información del vehículo"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="flex items-center">
              <svg
                className="w-8 h-8 text-blue-500 mr-3"
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
              <div>
                <p className="text-sm text-gray-500">Piloto</p>
                <p className="font-semibold text-gray-800">{viaje.piloto}</p>
              </div>
            </div>

            <div className="flex items-center">
              <svg
                className="w-8 h-8 text-purple-500 mr-3"
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
              <div>
                <p className="text-sm text-gray-500">Total Guías</p>
                <p className="font-semibold text-gray-800">
                  {viaje.total_guias}
                </p>
              </div>
            </div>

            <div className="flex items-center">
              <svg
                className="w-8 h-8 text-green-500 mr-3"
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
              <div>
                <p className="text-sm text-gray-500">Entregadas</p>
                <p className="font-semibold text-gray-800">
                  {viaje.guias_entregadas}
                </p>
              </div>
            </div>
          </div>

          {/* Barra de progreso */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600 font-medium">
                Progreso general
              </span>
              <span className="font-bold text-gray-700">{progreso}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${progreso}%`,
                  background:
                    progreso === 0
                      ? "#d1d5db" // gris
                      : progreso < 50
                      ? "linear-gradient(to right, #ef4444, #f97316)" // rojo a naranja
                      : progreso < 100
                      ? "linear-gradient(to right, #facc15, #3b82f6)" // amarillo a azul
                      : "linear-gradient(to right, #22c55e, #10b981)", // verde
                }}
              ></div>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <MapaWialon numeroVehiculo={viaje.numero_vehiculo} />
        </div>

        {/* Lista de facturas */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Facturas ({viaje.facturas?.length || 0})
          </h2>

          {viaje.facturas?.map((factura) => (
            <div
              key={factura.factura_id}
              className="bg-white rounded-lg shadow-sm border border-gray-200"
            >
              {/* Header de la factura */}
              <div
                className="p-4 cursor-pointer hover:bg-gray-50 transition"
                onClick={() => toggleFactura(factura.factura_id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                      <svg
                        className="w-5 h-5 text-blue-600"
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
                    <div>
                      <h3 className="font-bold text-gray-800">
                        {factura.numero_factura}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {factura.guias?.length || 0} guías •{" "}
                        {factura.guias?.filter((g) => g.estado_id === 4)
                          .length || 0}{" "}
                        entregadas
                      </p>
                    </div>
                  </div>
                  <svg
                    className={`w-5 h-5 text-gray-400 transition-transform ${
                      facturaExpandida === factura.factura_id
                        ? "rotate-180"
                        : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>

                {factura.notas_jefe && (
                  <div className="mt-3 ml-13 p-3 bg-amber-50 border-l-4 border-amber-400 rounded">
                    <p className="text-sm text-amber-800">
                      <span className="font-semibold">Nota del jefe:</span>{" "}
                      {factura.notas_jefe}
                    </p>
                  </div>
                )}
              </div>

              {/* Guías de remisión (expandible) */}
              {facturaExpandida === factura.factura_id && (
                <div className="border-t border-gray-200 p-4 bg-gray-50">
                  <h4 className="font-semibold text-gray-700 mb-3">
                    Guías de Remisión
                  </h4>
                  <div className="space-y-3">
                    {factura.guias?.map((guia) => (
                      <div
                        key={guia.guia_id}
                        className="bg-white p-4 rounded-lg border border-gray-200"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="font-bold text-gray-800">
                              {guia.numero_guia}
                            </p>
                            <span
                              className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mt-1 ${getEstadoColor(
                                guia.estados.codigo
                              )}`}
                            >
                              {guia.estados.nombre}
                            </span>
                          </div>
                          {guia.fecha_entrega && (
                            <p className="text-xs text-gray-500">
                              Entregada:{" "}
                              {new Date(guia.fecha_entrega).toLocaleString(
                                "es-HN"
                              )}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2 text-sm">
                          <div className="flex items-start"></div>

                          <div className="flex items-start">
                            <svg
                              className="w-4 h-4 text-gray-400 mr-2 mt-0.5 flex-shrink-0"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                            </svg>
                            <div>
                              <p className="text-gray-500">Dirección</p>
                              <p className="text-gray-800">{guia.direccion}</p>
                            </div>
                          </div>

                          <div className="flex items-start">
                            <svg
                              className="w-4 h-4 text-gray-400 mr-2 mt-0.5 flex-shrink-0"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                              />
                            </svg>
                            <div>
                              <p className="text-gray-500">Producto</p>
                              <p className="text-gray-800">
                                {guia.detalle_producto}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DetalleViaje;
