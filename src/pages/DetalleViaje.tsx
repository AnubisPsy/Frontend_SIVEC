// src/pages/DetalleViaje.tsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import MapaWialon from "../components/MapaWialon";
import { Icons } from "../components/icons/IconMap";

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

      console.log("📦 Response completo:", response.data);

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
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      case "guia_entregada":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "guia_no_entregada":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      case "guia_pendiente":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-slate-900">
        <div className="text-center">
          <Icons.refresh className="w-16 h-16 text-blue-600 dark:text-blue-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-slate-400">
            Cargando detalle del viaje...
          </p>
        </div>
      </div>
    );
  }

  if (error || !viaje) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-6">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={() => navigate("/dashboard")}
            className="mb-4 flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors gap-2"
          >
            <Icons.chevronLeft className="w-5 h-5" />
            Volver al Dashboard
          </button>
          <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg flex items-center gap-3">
            <Icons.alertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
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
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Botón volver */}
        <button
          onClick={() => navigate("/dashboard")}
          className="mb-6 flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold transition-colors gap-2"
        >
          <Icons.chevronLeft className="w-5 h-5" />
          Volver al Dashboard
        </button>

        {/* Header del viaje */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md border border-gray-200 dark:border-slate-700 p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                <Icons.truck className="w-7 h-7 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-800 dark:text-slate-100">
                  Viaje {viaje.numero_vehiculo}
                </h1>
                <p className="text-gray-600 dark:text-slate-400">
                  {viaje.vehiculo?.agrupacion || "Sin información del vehículo"}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <Icons.user className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-slate-400 font-medium">
                  Piloto
                </p>
                <p className="font-semibold text-gray-800 dark:text-slate-100">
                  {viaje.piloto}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                <Icons.package className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-slate-400 font-medium">
                  Total Guías
                </p>
                <p className="font-semibold text-gray-800 dark:text-slate-100">
                  {viaje.total_guias}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <Icons.checkCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-slate-400 font-medium">
                  Entregadas
                </p>
                <p className="font-semibold text-gray-800 dark:text-slate-100">
                  {viaje.guias_entregadas}
                </p>
              </div>
            </div>
          </div>

          {/* Barra de progreso */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600 dark:text-slate-400 font-medium">
                Progreso general
              </span>
              <span className="font-bold text-gray-700 dark:text-slate-300">
                {progreso}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${progreso}%`,
                  background:
                    progreso === 0
                      ? "#d1d5db"
                      : progreso < 50
                      ? "linear-gradient(to right, #ef4444, #f97316)"
                      : progreso < 100
                      ? "linear-gradient(to right, #facc15, #3b82f6)"
                      : "linear-gradient(to right, #22c55e, #10b981)",
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
          <h2 className="text-2xl font-bold text-gray-800 dark:text-slate-100 mb-4 flex items-center gap-2">
            <Icons.document className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            Facturas ({viaje.facturas?.length || 0})
          </h2>

          {viaje.facturas?.map((factura) => (
            <div
              key={factura.factura_id}
              className="bg-white dark:bg-slate-800 rounded-xl shadow-md border border-gray-200 dark:border-slate-700 overflow-hidden"
            >
              {/* Header de la factura */}
              <div
                className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                onClick={() => toggleFactura(factura.factura_id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                      <Icons.document className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800 dark:text-slate-100">
                        {factura.numero_factura}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-slate-400">
                        <span>{factura.guias?.length || 0} guías</span>
                        <span>•</span>
                        <span className="text-green-600 dark:text-green-400">
                          {factura.guias?.filter((g) => g.estado_id === 4)
                            .length || 0}{" "}
                          entregadas
                        </span>
                      </div>
                    </div>
                  </div>
                  <Icons.chevronDown
                    className={`w-5 h-5 text-gray-400 dark:text-slate-500 transition-transform ${
                      facturaExpandida === factura.factura_id
                        ? "rotate-180"
                        : ""
                    }`}
                  />
                </div>

                {factura.notas_jefe && (
                  <div className="mt-3 ml-13 p-3 bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-400 dark:border-amber-600 rounded flex items-start gap-2">
                    <Icons.alertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-800 dark:text-amber-300">
                      <span className="font-semibold">Nota del jefe:</span>{" "}
                      {factura.notas_jefe}
                    </p>
                  </div>
                )}
              </div>

              {/* Guías de remisión (expandible) */}
              {facturaExpandida === factura.factura_id && (
                <div className="border-t border-gray-200 dark:border-slate-700 p-4 bg-gray-50 dark:bg-slate-700/50">
                  <h4 className="font-semibold text-gray-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                    <Icons.package className="w-5 h-5" />
                    Guías de Remisión
                  </h4>
                  <div className="space-y-3">
                    {factura.guias?.map((guia) => (
                      <div
                        key={guia.guia_id}
                        className="bg-white dark:bg-slate-800 p-4 rounded-lg border-2 border-gray-200 dark:border-slate-600"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="font-bold text-gray-800 dark:text-slate-100 flex items-center gap-2">
                              <Icons.package className="w-4 h-4" />
                              {guia.numero_guia}
                            </p>
                            <span
                              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold mt-2 ${getEstadoColor(
                                guia.estados.codigo
                              )}`}
                            >
                              {guia.estados.codigo === "guia_entregada" && (
                                <Icons.checkCircle className="w-3 h-3" />
                              )}
                              {guia.estados.codigo === "guia_no_entregada" && (
                                <Icons.xCircle className="w-3 h-3" />
                              )}
                              {guia.estados.codigo === "guia_asignada" && (
                                <Icons.package className="w-3 h-3" />
                              )}
                              {guia.estados.nombre}
                            </span>
                          </div>
                          {guia.fecha_entrega && (
                            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-slate-400">
                              <Icons.calendar className="w-3 h-3" />
                              <span>
                                Entregada:{" "}
                                {new Date(guia.fecha_entrega).toLocaleString(
                                  "es-HN"
                                )}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="space-y-3 text-sm">
                          <div className="flex items-start gap-2 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                            <Icons.mapPin className="w-4 h-4 text-gray-400 dark:text-slate-500 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <p className="text-xs text-gray-500 dark:text-slate-400 font-semibold uppercase mb-1">
                                Dirección
                              </p>
                              <p className="text-gray-800 dark:text-slate-200">
                                {guia.direccion}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-start gap-2 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                            <Icons.package className="w-4 h-4 text-gray-400 dark:text-slate-500 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <p className="text-xs text-gray-500 dark:text-slate-400 font-semibold uppercase mb-1">
                                Producto
                              </p>
                              <p className="text-gray-800 dark:text-slate-200">
                                {guia.detalle_producto}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-start gap-2 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                            <Icons.user className="w-4 h-4 text-gray-400 dark:text-slate-500 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <p className="text-xs text-gray-500 dark:text-slate-400 font-semibold uppercase mb-1">
                                Cliente
                              </p>
                              <p className="text-gray-800 dark:text-slate-200">
                                {guia.cliente}
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
