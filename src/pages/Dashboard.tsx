// src/pages/Dashboard.tsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { facturasApi, FacturaAsignada } from "../services/api";
import TestIntegration from "../components/TestIntegration";
import FormularioAsignarFactura from "../components/FormularioAsignarFactura";

interface Estadisticas {
  total: number;
  asignadas: number;
  despachadas: number;
  porcentaje_completado: number;
}

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [facturasPendientes, setFacturasPendientes] = useState<
    FacturaAsignada[]
  >([]);
  const [facturasDespachadas, setFacturasDespachadas] = useState<
    FacturaAsignada[]
  >([]);
  const [estadisticas, setEstadisticas] = useState<Estadisticas | null>(null);
  const [loading, setLoading] = useState(true);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [pendientesRes, despachadasRes, estadisticasRes] =
        await Promise.all([
          facturasApi.obtenerPendientes(),
          facturasApi.obtenerDespachadas(),
          facturasApi.obtenerEstadisticas(),
        ]);

      setFacturasPendientes(pendientesRes.data.data);
      setFacturasDespachadas(despachadasRes.data.data);
      setEstadisticas(estadisticasRes.data.data);
    } catch (error) {
      console.error("Error al cargar datos:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAsignarFactura = async (datosFactura: any) => {
    try {
      await facturasApi.asignar(datosFactura);
      setMostrarFormulario(false);
      cargarDatos();
      alert("Factura asignada exitosamente");
    } catch (error: any) {
      alert(
        "Error al asignar factura: " +
          (error.response?.data?.error || error.message)
      );
      throw error;
    }
  };

  const getEstadoBadge = (estado_id: number, nombre: string) => {
    const colors = {
      1: "bg-yellow-100 text-yellow-800", // asignada
      2: "bg-green-100 text-green-800", // despachada
    };

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${
          colors[estado_id as keyof typeof colors] ||
          "bg-gray-100 text-gray-800"
        }`}
      >
        {nombre}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-primary-600 rounded-lg flex items-center justify-center mr-3">
                <svg
                  className="h-5 w-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2"
                  />
                </svg>
              </div>
              <h1 className="text-xl font-semibold text-gray-900">
                SIVEC Dashboard
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                <span className="font-medium">{user?.nombre_usuario}</span>
                <span className="ml-2 text-xs bg-primary-100 text-primary-600 px-2 py-1 rounded">
                  {user?.rol?.nombre_rol || `Rol ${user?.rol_id}`}
                </span>
              </div>
              <button
                onClick={logout}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Estadísticas */}
        {estadisticas && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="card p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <svg
                    className="h-6 w-6 text-blue-600"
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
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Total Facturas
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {estadisticas.total}
                  </p>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <svg
                    className="h-6 w-6 text-yellow-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Pendientes
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {estadisticas.asignadas}
                  </p>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <svg
                    className="h-6 w-6 text-green-600"
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
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Despachadas
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {estadisticas.despachadas}
                  </p>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <svg
                    className="h-6 w-6 text-purple-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                    />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    % Completado
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {estadisticas.porcentaje_completado}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Acciones principales */}
        {(user?.rol_id === 2 || user?.rol_id === 3) && ( // Jefe o Admin
          <div className="mb-8">
            <button
              onClick={() => setMostrarFormulario(!mostrarFormulario)}
              className="btn-primary"
            >
              + Asignar Factura
            </button>
          </div>
        )}

        {/* Formulario de asignar factura */}
        {mostrarFormulario && (
          <FormularioAsignarFactura
            onAsignarFactura={handleAsignarFactura}
            onCancelar={() => setMostrarFormulario(false)}
          />
        )}

        {/* Tabs para facturas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Facturas Pendientes */}
          <div className="card">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <svg
                  className="h-5 w-5 text-yellow-500 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Facturas Pendientes ({facturasPendientes.length})
              </h3>
            </div>
            <div className="p-6">
              {facturasPendientes.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No hay facturas pendientes
                </p>
              ) : (
                <div className="space-y-4">
                  {facturasPendientes.map((factura) => (
                    <div
                      key={factura.factura_id}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-gray-900">
                          {factura.numero_factura}
                        </h4>
                        {getEstadoBadge(
                          factura.estado_id,
                          factura.estados.nombre
                        )}
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>
                          <span className="font-medium">Piloto:</span>{" "}
                          {factura.piloto}
                        </p>
                        <p>
                          <span className="font-medium">Vehículo:</span>{" "}
                          {factura.numero_vehiculo}
                        </p>
                        <p>
                          <span className="font-medium">Fecha:</span>{" "}
                          {new Date(
                            factura.fecha_asignacion
                          ).toLocaleDateString()}
                        </p>
                        {factura.notas_jefe && (
                          <p>
                            <span className="font-medium">Notas:</span>{" "}
                            {factura.notas_jefe}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Facturas Despachadas */}
          <div className="card">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <svg
                  className="h-5 w-5 text-green-500 mr-2"
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
                Facturas Despachadas ({facturasDespachadas.length})
              </h3>
            </div>
            <div className="p-6">
              {facturasDespachadas.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No hay facturas despachadas
                </p>
              ) : (
                <div className="space-y-4">
                  {facturasDespachadas.slice(0, 10).map((factura) => (
                    <div
                      key={factura.factura_id}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-gray-900">
                          {factura.numero_factura}
                        </h4>
                        {getEstadoBadge(
                          factura.estado_id,
                          factura.estados.nombre
                        )}
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>
                          <span className="font-medium">Piloto:</span>{" "}
                          {factura.piloto}
                        </p>
                        <p>
                          <span className="font-medium">Vehículo:</span>{" "}
                          {factura.numero_vehiculo}
                        </p>
                        {factura.viaje && (
                          <>
                            <p>
                              <span className="font-medium">Guía:</span>{" "}
                              {factura.viaje.numero_guia}
                            </p>
                            <p>
                              <span className="font-medium">Cliente:</span>{" "}
                              {factura.viaje.cliente}
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Botón para refrescar datos */}
        <div className="mt-8 text-center">
          <button onClick={cargarDatos} className="btn-secondary mr-4">
            Refrescar Datos
          </button>
        </div>

        {/* Componente de prueba de integración (solo para admins) */}
        {user?.rol_id === 3 && (
          <div className="mt-8">
            <TestIntegration />
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
